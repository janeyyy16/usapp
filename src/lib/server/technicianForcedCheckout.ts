/**
 * Runs on the every-5-minutes Cron Trigger (see scheduled() in
 * src/server.ts), alongside runAttendanceAlertCheck.
 *
 * The rule: a technician who never clocked out is force-clocked-out for
 * that day. The Time Out RECORDED is not the moment this job runs — it's
 * the latest real signal of them still working that day:
 *   1. latest tickets.onsite_done_at  (their last "Work Done")   — basis "ticket_done"
 *   2. else latest tickets.onsite_arrived_at ("Work Start", never marked done) — "ticket_arrived"
 *   3. else their scheduled required_check_out                    — "scheduled_end"
 *   4. else 23:59:00                                              — "eod"
 * A candidate that lands before their own check-in (clock skew, a stray
 * timestamp) is skipped and the next basis tried.
 *
 * "For that specific day" is resolved per technician in their own timezone
 * (profiles.schedule_timezone -> else their branch's zone): the job acts on
 * an open entry only once the calendar has rolled past that entry's
 * work_date in the technician's zone, so it fires within ~5 min of local
 * midnight and also sweeps any older straggler that was missed.
 *
 * Applies to PRIMARY and SECONDARY technician roles — any held role
 * (role or extra_roles[]) in TECHNICIAN_PAY_ROLES.
 *
 * This is the fallback for TechnicianLocationTracker.tsx's home-geofence
 * auto clock-out (which handles the case where the technician's phone was
 * on and in range). Entries that path already closed have a non-null
 * check_out and are skipped here.
 *
 * Mirrors attendanceAlerts.ts / nsaPartsSync.ts: raw PostgREST + service
 * key, per-row try/catch, a plain summary object, company_id only used to
 * group internally (single global job, not per-tenant).
 */

import { timezoneForBranch } from "../attendanceGrace";
import { TECHNICIAN_PAY_ROLES, normalizeRole } from "../roleLabels";

type CheckoutBasis = "ticket_done" | "ticket_arrived" | "scheduled_end" | "eod";

interface ForcedCheckoutSummary {
  techniciansChecked: number;
  forcedOut: number;
  byBasis: Record<CheckoutBasis, number>;
  errors: string[];
  /** Only populated when dryRun is true. */
  dryRunPreview?: Array<{
    name: string;
    workDate: string;
    checkIn: string;
    checkOut: string;
    basis: CheckoutBasis;
  }>;
}

interface ServerProfile {
  id: string;
  company_id: string;
  display_name: string | null;
  role: string | null;
  extra_roles: string[] | null;
  assigned_branch: string | null;
  required_check_out: string | null;
  schedule_timezone: string | null;
}

interface OpenEntry {
  id: string;
  profile_id: string;
  work_date: string;
  check_in: string;
  notes: string | null;
}

const SCHEDULE_TZ_TO_IANA: Record<string, string> = {
  CST: "America/Chicago",
  EST: "America/New_York",
};

/** How far back to look for un-closed entries — yesterday plus a couple of straggler days. */
const STRAGGLER_LOOKBACK_DAYS = 4;

function resolveCreds(env: Record<string, string | undefined>) {
  const g = globalThis as any;
  const supabaseUrl =
    (g.__SUPABASE_URL__ && g.__SUPABASE_URL__ !== "" ? g.__SUPABASE_URL__ : undefined) ?? env.VITE_SUPABASE_URL;
  const supabaseServiceKey =
    (g.__SUPABASE_SERVICE_KEY__ && g.__SUPABASE_SERVICE_KEY__ !== "" ? g.__SUPABASE_SERVICE_KEY__ : undefined) ??
    env.SUPABASE_SERVICE_KEY;
  return { supabaseUrl, supabaseServiceKey };
}

function heldTechnicianRole(role: string | null, extraRoles: string[] | null): boolean {
  return [role, ...(extraRoles ?? [])].some((r) => TECHNICIAN_PAY_ROLES.has(normalizeRole(r)));
}

function ianaZoneFor(p: ServerProfile): string {
  const sched = (p.schedule_timezone || "").trim().toUpperCase();
  return SCHEDULE_TZ_TO_IANA[sched] ?? timezoneForBranch(p.assigned_branch);
}

/** Wall-clock HH:MM:SS and calendar date (YYYY-MM-DD) for an instant, as seen in `timeZone`. */
function zoned(instant: Date, timeZone: string): { hms: string; date: string } {
  const hms = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(instant);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
  // Intl can render midnight as "24:00:00" under hour12:false — normalize.
  return { hms: hms.startsWith("24") ? `00${hms.slice(2)}` : hms, date };
}

function toSeconds(hms: string): number {
  const [h, m, s = 0] = hms.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

/** "17:00" -> "17:00:00"; passes "17:00:00" through; "" -> null. */
function normalizeHms(v: string | null | undefined): string | null {
  if (!v) return null;
  const parts = v.split(":");
  if (parts.length === 2) return `${v}:00`;
  return v;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const BASIS_LABEL: Record<CheckoutBasis, string> = {
  ticket_done: "last Work Done",
  ticket_arrived: "last Work Start (never marked done)",
  scheduled_end: "scheduled end of shift",
  eod: "end of day",
};

export async function runTechnicianForcedCheckout(
  env: Record<string, string | undefined>,
  opts: { dryRun?: boolean } = {}
): Promise<ForcedCheckoutSummary> {
  const summary: ForcedCheckoutSummary = {
    techniciansChecked: 0,
    forcedOut: 0,
    byBasis: { ticket_done: 0, ticket_arrived: 0, scheduled_end: 0, eod: 0 },
    errors: [],
    ...(opts.dryRun ? { dryRunPreview: [] } : {}),
  };

  const { supabaseUrl, supabaseServiceKey } = resolveCreds(env);
  if (!supabaseUrl || !supabaseServiceKey) {
    summary.errors.push("Missing Supabase URL/service key — cannot run.");
    return summary;
  }
  const sbHeaders = {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    "Content-Type": "application/json",
  };

  const now = new Date();
  const lookbackStart = isoDaysAgo(STRAGGLER_LOOKBACK_DAYS);

  const [profilesRes, entriesRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id,company_id,display_name,role,extra_roles,assigned_branch,required_check_out,schedule_timezone&is_active=eq.true`,
      { headers: sbHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/timecard_entries?select=id,profile_id,work_date,check_in,notes&check_in=not.is.null&check_out=is.null&work_date=gte.${lookbackStart}`,
      { headers: sbHeaders }
    ),
  ]);

  if (!profilesRes.ok) {
    summary.errors.push(`Failed to list profiles: HTTP ${profilesRes.status}`);
    return summary;
  }
  if (!entriesRes.ok) {
    summary.errors.push(`Failed to list open timecard entries: HTTP ${entriesRes.status}`);
    return summary;
  }

  const profiles: ServerProfile[] = await profilesRes.json();
  const openEntries: OpenEntry[] = (await entriesRes.json()).filter(
    (e: OpenEntry) => e.check_in && e.check_in.trim() !== ""
  );

  const techById = new Map(
    profiles.filter((p) => heldTechnicianRole(p.role, p.extra_roles)).map((p) => [p.id, p])
  );

  for (const entry of openEntries) {
    const p = techById.get(entry.profile_id);
    if (!p) continue; // not a technician (primary or secondary) — leave office staff alone
    summary.techniciansChecked++;

    const tz = ianaZoneFor(p);
    const todayLocal = zoned(now, tz).date;
    // Only act once the technician's own calendar day has ended. An entry
    // whose work_date is still "today" for them is a live, in-progress shift.
    if (entry.work_date >= todayLocal) continue;

    const checkInSec = toSeconds(entry.check_in);
    const name = p.display_name || "This technician";

    try {
      // The technician's ticket timestamps for that work_date. tickets.technician
      // is free text — match on the display name case-insensitively, same
      // tolerance getTechnicianTodayRoute uses.
      let doneMax: string | null = null;
      let arrivedMax: string | null = null;
      if (p.display_name) {
        const tkRes = await fetch(
          `${supabaseUrl}/rest/v1/tickets?select=onsite_arrived_at,onsite_done_at&schedule_date=eq.${entry.work_date}&technician=ilike.${encodeURIComponent(p.display_name)}`,
          { headers: sbHeaders }
        );
        if (tkRes.ok) {
          const tickets: Array<{ onsite_arrived_at: string | null; onsite_done_at: string | null }> =
            await tkRes.json();
          for (const t of tickets) {
            if (t.onsite_done_at && (!doneMax || t.onsite_done_at > doneMax)) doneMax = t.onsite_done_at;
            if (t.onsite_arrived_at && (!arrivedMax || t.onsite_arrived_at > arrivedMax)) arrivedMax = t.onsite_arrived_at;
          }
        }
      }

      // Turn an instant into an HH:MM:SS on the entry's own local work_date,
      // but only if it actually lands on that day and is not before check-in.
      const localTimeIfValid = (iso: string | null): string | null => {
        if (!iso) return null;
        const z = zoned(new Date(iso), tz);
        if (z.date !== entry.work_date) return null;
        if (toSeconds(z.hms) < checkInSec) return null;
        return z.hms;
      };

      let checkOut: string | null = null;
      let basis: CheckoutBasis = "eod";

      const fromDone = localTimeIfValid(doneMax);
      if (fromDone) {
        checkOut = fromDone;
        basis = "ticket_done";
      }
      if (!checkOut) {
        const fromArrived = localTimeIfValid(arrivedMax);
        if (fromArrived) {
          checkOut = fromArrived;
          basis = "ticket_arrived";
        }
      }
      if (!checkOut) {
        const sched = normalizeHms(p.required_check_out);
        if (sched && toSeconds(sched) >= checkInSec) {
          checkOut = sched;
          basis = "scheduled_end";
        }
      }
      if (!checkOut) {
        checkOut = "23:59:00";
        basis = "eod";
      }

      if (opts.dryRun) {
        summary.dryRunPreview!.push({ name, workDate: entry.work_date, checkIn: entry.check_in, checkOut, basis });
        summary.forcedOut++;
        summary.byBasis[basis]++;
        continue;
      }

      const marker = `[Auto clock-out ${checkOut} — ${BASIS_LABEL[basis]}; still clocked in at end of ${entry.work_date} (system)]`;
      const mergedNotes = entry.notes && entry.notes.trim() ? `${entry.notes.trim()}\n${marker}` : marker;

      // check_out=is.null in the filter keeps this idempotent and race-safe —
      // a concurrent run (or the client home-geofence path) that already
      // closed the entry matches zero rows and we move on.
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/timecard_entries?id=eq.${entry.id}&check_out=is.null`,
        {
          method: "PATCH",
          headers: { ...sbHeaders, Prefer: "return=representation" },
          body: JSON.stringify({ check_out: checkOut, notes: mergedNotes }),
        }
      );
      if (!patchRes.ok) {
        summary.errors.push(`${name} (${entry.work_date}): PATCH failed HTTP ${patchRes.status}`);
        continue;
      }
      const patched: unknown[] = await patchRes.json();
      if (patched.length === 0) continue; // already closed by another path

      summary.forcedOut++;
      summary.byBasis[basis]++;

      // Any still-pending branch checkout proposal for this day is now moot —
      // the forced time won. Best-effort; a failure here doesn't undo the
      // clock-out.
      await fetch(
        `${supabaseUrl}/rest/v1/technician_checkout_proposals?profile_id=eq.${p.id}&work_date=eq.${entry.work_date}&status=eq.pending`,
        {
          method: "PATCH",
          headers: sbHeaders,
          body: JSON.stringify({ status: "dismissed", updated_at: now.toISOString() }),
        }
      ).catch(() => {});
    } catch (e) {
      summary.errors.push(`${name} (${entry.work_date}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return summary;
}
