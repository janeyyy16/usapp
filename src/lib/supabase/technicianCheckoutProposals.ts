/**
 * Auto-proposed technician Time Out — created client-side
 * (TechnicianLocationTracker.tsx) the moment a clocked-in technician's live
 * GPS shows them back at their branch or home address, paired with their
 * last ticket update for review context. Held as "pending" until a
 * SuperAdmin or Finance reviewer approves it on Attendance Monitoring's
 * Daily Attendance Tracker — only then does the proposed time become the
 * technician's real timecard_entries.check_out (see
 * approveCheckoutProposal). See migration 0208 for the full RLS story.
 */
import { supabase } from "./client";
import { getEntryForDate, saveEntry, savePunch, appendEntryNote } from "./timecards";
import { HOME_AUTO_CHECKOUT_RADIUS_MILES } from "@/lib/mapEngine";

export type CheckoutProposalSource = "branch" | "home";
export type CheckoutProposalStatus = "pending" | "approved" | "dismissed";

export interface CheckoutProposal {
  id: string;
  profileId: string;
  workDate: string;
  /** "HH:MM:SS" — same format timecard_entries.check_out already uses. */
  proposedCheckOut: string;
  source: CheckoutProposalSource;
  lastTicketNo: string | null;
  lastTicketUpdatedAt: string | null;
  status: CheckoutProposalStatus;
}

function mapRow(r: any): CheckoutProposal {
  return {
    id: r.id,
    profileId: r.profile_id,
    workDate: r.work_date,
    proposedCheckOut: r.proposed_check_out,
    source: r.source,
    lastTicketNo: r.last_ticket_no ?? null,
    lastTicketUpdatedAt: r.last_ticket_updated_at ?? null,
    status: r.status,
  };
}

/**
 * Creates or refreshes the caller's own pending proposal for this work
 * date. company_id is deliberately omitted — the same auto-stamp trigger
 * every tenant table uses fills it in from the caller's own JWT (see
 * migration 0208's header comment). A no-op in practice once already
 * approved/dismissed — RLS only allows the technician to update their own
 * still-pending row.
 */
export async function upsertMyCheckoutProposal(input: {
  profileId: string;
  workDate: string;
  proposedCheckOut: string;
  source: CheckoutProposalSource;
  lastTicketNo: string | null;
  lastTicketUpdatedAt: string | null;
}): Promise<void> {
  const { error } = await supabase.from("technician_checkout_proposals").upsert(
    {
      profile_id: input.profileId,
      work_date: input.workDate,
      proposed_check_out: input.proposedCheckOut,
      source: input.source,
      last_ticket_no: input.lastTicketNo,
      last_ticket_updated_at: input.lastTicketUpdatedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,work_date" }
  );
  if (error) throw new Error(error.message);
}

/**
 * Automatic technician clock-out on arriving home (inside the
 * HOME_AUTO_CHECKOUT_RADIUS_MILES geofence — a 1-mile diameter). Unlike the
 * branch path, this does NOT wait for a SuperAdmin/Finance reviewer: it
 * writes the technician's real timecard_entries.check_out directly, stamped
 * with the moment they crossed into the circle (`checkOut`), and leaves an
 * audit note. Deliberately NOT routed through technician_checkout_proposals
 * — that table is the review queue, and an auto-applied home checkout needs
 * no review. check_out is written with savePunch (single-column upsert) so
 * a stale local view can't clobber check_in / meal punches.
 *
 * Called from TechnicianLocationTracker.tsx, as the technician themselves —
 * same self-punch RLS path as the mobile Time Out button. If GPS never
 * fires (tab closed, permission denied), the 11:59 PM server sweep
 * (technicianForcedCheckout.ts) closes the shift instead.
 */
export async function autoClockOutAtHome(input: {
  profileId: string;
  workDate: string;
  /** "HH:MM:SS" in the technician's own schedule timezone. */
  checkOut: string;
  lastTicketNo: string | null;
}): Promise<void> {
  await savePunch(input.profileId, input.workDate, "checkOut", input.checkOut);
  const ctx = input.lastTicketNo ? ` last ticket ${input.lastTicketNo};` : "";
  await appendEntryNote(
    input.profileId,
    input.workDate,
    `[Auto clock-out ${input.checkOut} — arrived home (within ${HOME_AUTO_CHECKOUT_RADIUS_MILES * 2} mi);${ctx} system]`
  ).catch((e) => console.error("autoClockOutAtHome: note write failed (clock-out already saved):", e));
}

/**
 * Every still-pending proposal the caller can see — RLS restricts real
 * access to SuperAdmin/Finance (or a technician's own row, which never
 * matters here since this is only ever called from Attendance Monitoring).
 * Not date-scoped: a pending proposal only exists for the short window
 * between a technician arriving at branch/home and a reviewer acting on
 * it, so there's no history to page through the way full attendance
 * records need.
 */
export async function getPendingCheckoutProposals(): Promise<CheckoutProposal[]> {
  const { data, error } = await supabase
    .from("technician_checkout_proposals")
    .select("*")
    .eq("status", "pending");
  if (error) {
    console.error("getPendingCheckoutProposals error:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

/**
 * Approves a proposal: writes its proposed_check_out onto the technician's
 * REAL timecard_entries.check_out for that day (preserving their existing
 * check-in/meal times/notes untouched), then marks the proposal approved.
 * RLS restricts the proposal-row update itself to SuperAdmin/Finance; the
 * timecard_entries write is company-wide, same as every other proxy-punch
 * path in this app (see AttendanceMonitoringPage.tsx's handleProxyClockIn).
 */
export async function approveCheckoutProposal(proposal: CheckoutProposal, approverId: string): Promise<void> {
  const existing = await getEntryForDate(proposal.profileId, proposal.workDate);
  await saveEntry(proposal.profileId, proposal.workDate, {
    checkIn: existing?.checkIn ?? "",
    checkOut: proposal.proposedCheckOut,
    mealStart: existing?.mealStart ?? "",
    mealEnd: existing?.mealEnd ?? "",
    notes: existing?.notes ?? "",
  });
  const { error } = await supabase
    .from("technician_checkout_proposals")
    .update({ status: "approved", approved_by: approverId, approved_at: new Date().toISOString() })
    .eq("id", proposal.id);
  if (error) throw new Error(error.message);
}
