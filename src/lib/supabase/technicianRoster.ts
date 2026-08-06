/**
 * Single source of truth for "who is an active technician" across every
 * technician-assignment dropdown in the app (ticket detail's Edit
 * Schedule/Add Visit/Compensation selects, Work Planner's tech columns).
 *
 * Combines the live, company-scoped Supabase roster — anyone `is_active`
 * whose primary `role` OR any `extra_roles` entry contains "TECHNICIAN", so
 * a secondary/extra Technician role always qualifies, now and for any
 * future role assignment — with the legacy static TECHNICIANS_BY_LOCATION
 * seed (src/lib/locations.ts) as a fallback ONLY for names that have no
 * matching Supabase profile at all (real field techs never migrated into
 * User Management). A name that DOES have a profile is governed entirely by
 * that profile's is_active/role state: deactivate them in Supabase and they
 * drop out of every dropdown that calls this, even though their name is
 * still baked into the static seed.
 */
import { getCompanyUsers, type ProfileRow } from "./users";
import { ALL_TECHNICIANS, TECHNICIANS_BY_LOCATION } from "../locations";

// Collapses common variants of the same person (case, whitespace, middle
// initials, email local part, trailing "(Tech)" markers) so a user listed
// under slightly different strings in different sources renders once.
function canonicalNameKey(n: string): string {
  return String(n || "")
    .toLowerCase()
    .replace(/@.*$/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\b[a-z]\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTechnicianRole(p: Pick<ProfileRow, "role" | "extra_roles">): boolean {
  const primary = String(p.role || "").toUpperCase();
  if (primary.includes("TECHNICIAN")) return true;
  return ((p.extra_roles as string[] | null) ?? []).some((r) => String(r || "").toUpperCase().includes("TECHNICIAN"));
}

export interface TechnicianRosterEntry {
  name: string;
  /** assigned_branch for a live profile, or the static seed's location key for a legacy fallback name. */
  location: string;
}

/** Every active technician (primary or secondary role), company-wide, deduped, plus any never-migrated legacy names from the static seed. Sorted alphabetically. */
export async function getActiveTechnicianRoster(): Promise<TechnicianRosterEntry[]> {
  const profiles = await getCompanyUsers();
  const chosen = new Map<string, TechnicianRosterEntry>();
  const knownProfileKeys = new Set<string>();

  for (const p of profiles) {
    const name = (p.display_name || p.username || p.email || "").trim();
    if (!name) continue;
    const key = canonicalNameKey(name);
    if (!key) continue;
    knownProfileKeys.add(key);
    if (!p.is_active) continue;
    if (!hasTechnicianRole(p)) continue;
    const existing = chosen.get(key);
    if (!existing || name.length > existing.name.length) {
      chosen.set(key, { name, location: p.assigned_branch || "" });
    }
  }

  // Legacy fallback: static seed names with no Supabase profile at all.
  for (const [location, names] of Object.entries(TECHNICIANS_BY_LOCATION)) {
    for (const n of names) {
      const key = canonicalNameKey(n);
      if (!key || knownProfileKeys.has(key) || chosen.has(key)) continue;
      chosen.set(key, { name: n, location });
    }
  }

  return Array.from(chosen.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Just the names, sorted — for a flat technician <select>. Falls back to the static ALL_TECHNICIANS list only if the live fetch itself fails. */
export async function getActiveTechnicianNames(): Promise<string[]> {
  try {
    return (await getActiveTechnicianRoster()).map((t) => t.name);
  } catch (err) {
    console.warn("getActiveTechnicianNames: live fetch failed, falling back to static list:", err);
    return [...ALL_TECHNICIANS];
  }
}

/** Same roster grouped by branch/location — for location-scoped pickers like Work Planner. Technicians with no known location are omitted (callers already fall back to a flat list for those). */
export async function getActiveTechniciansByLocation(): Promise<Record<string, string[]>> {
  const roster = await getActiveTechnicianRoster();
  const map: Record<string, string[]> = {};
  for (const t of roster) {
    if (!t.location) continue;
    (map[t.location] ??= []).push(t.name);
  }
  return map;
}
