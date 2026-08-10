/**
 * Role x Module/Submodule access overrides (migration 0154) — backs the
 * "Accessibility Management" page, a live matrix of which roles can open
 * which modules/submodules. This OVERRIDES (doesn't replace) the hardcoded
 * gates in roleLabels.ts (CSR allow-list) and dashboardAccess.ts (Admin
 * module, User Management, Company Settings, Dashboard-submodule gates):
 * an explicit row here wins; no row for a given role/module/submodule means
 * "defer to whatever the hardcoded rule already decides" — see
 * resolveModuleAccessOverride below.
 *
 * getCompanyRoleModuleAccess() never throws — this table is newer/optional
 * (like working_hours/meal_minutes in users.ts), so a missing migration or
 * transient error must degrade to "no overrides" rather than break every
 * page's access checks.
 */
import { useEffect, useState } from "react";
import { supabase } from "./client";

export interface RoleModuleAccessRow {
  role: string;
  moduleSlug: string;
  /** "" = a whole-module row (applies to every submodule under it that has no more specific row of its own). */
  submoduleSlug: string;
  allowed: boolean;
}

function mapRow(row: any): RoleModuleAccessRow {
  return {
    role: row.role,
    moduleSlug: row.module_slug,
    submoduleSlug: row.submodule_slug ?? "",
    allowed: Boolean(row.allowed),
  };
}

/** Every access override for the caller's company. Fails closed (empty array) — see file header. */
export async function getCompanyRoleModuleAccess(): Promise<RoleModuleAccessRow[]> {
  const { data, error } = await supabase
    .from("role_module_access")
    .select("role, module_slug, submodule_slug, allowed");
  if (error) {
    console.error("getCompanyRoleModuleAccess error:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

// m.$module.$submodule.tsx (the real route gate) sits on every single page
// transition in the app, so it must be able to check overrides without
// re-fetching on every navigation — only the first check per session pays
// a real round trip; everything after reads this cache synchronously. The
// new Accessibility Management page calls invalidateRoleModuleAccessCache()
// after every edit so the very next navigation (by anyone) sees it.
let cachedOverrides: RoleModuleAccessRow[] | null = null;
let inFlight: Promise<RoleModuleAccessRow[]> | null = null;

/** Synchronous peek at the cache — null means "not fetched yet this session." */
export function getCachedRoleModuleAccessSync(): RoleModuleAccessRow[] | null {
  return cachedOverrides;
}

export async function getCompanyRoleModuleAccessCached(): Promise<RoleModuleAccessRow[]> {
  if (cachedOverrides) return cachedOverrides;
  if (!inFlight) {
    inFlight = getCompanyRoleModuleAccess().then((rows) => {
      cachedOverrides = rows;
      inFlight = null;
      return rows;
    });
  }
  return inFlight;
}

/** Call after any setRoleModuleAccess() write so the next navigation (this tab or a fresh one) sees the change instead of the stale cache. */
export function invalidateRoleModuleAccessCache(): void {
  cachedOverrides = null;
}

/** Create/update one cell of the matrix — one (role, moduleSlug, submoduleSlug) triple. */
export async function setRoleModuleAccess(
  role: string,
  moduleSlug: string,
  submoduleSlug: string,
  allowed: boolean
): Promise<void> {
  const { error } = await supabase.from("role_module_access").upsert(
    { role, module_slug: moduleSlug, submodule_slug: submoduleSlug, allowed },
    { onConflict: "company_id,role,module_slug,submodule_slug" }
  );
  if (error) {
    console.error("setRoleModuleAccess error:", error.message);
    throw new Error(error.message);
  }
  invalidateRoleModuleAccessCache();
}

/**
 * Does `role` (plus any `extraRoles`) have an explicit override for this
 * exact module/submodule? A submodule-specific row always wins over a
 * module-level (submoduleSlug="") row for the same role. Pile-up semantics
 * match every other role check in this app (see roleLabels.ts): if ANY held
 * role has an explicit "allowed" row, that wins.
 *
 * Returns `undefined` when there's no override anywhere for this cell —
 * callers must then fall back to the existing hardcoded rule (see
 * computeSubmoduleFallbackAccess in dashboardAccess.ts). This is what makes
 * an empty/not-yet-migrated table a complete no-op.
 */
/**
 * Session-cached overrides for use in a component. Returns `null` while
 * still loading (only happens once per session — see the cache above) —
 * callers on the real security boundary (m.$module.$submodule.tsx) should
 * treat `null` like they already treat `extraRoles === null`: wait, don't
 * render yet. Cosmetic-only consumers (ModuleNavigator.tsx's hover strip)
 * can just treat `null` as "no overrides yet" and re-render once it loads.
 */
export function useRoleModuleAccessOverrides(): RoleModuleAccessRow[] | null {
  const [overrides, setOverrides] = useState<RoleModuleAccessRow[] | null>(() => getCachedRoleModuleAccessSync());
  useEffect(() => {
    if (overrides !== null) return;
    let cancelled = false;
    getCompanyRoleModuleAccessCached().then((rows) => {
      if (!cancelled) setOverrides(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [overrides]);
  return overrides;
}

export function resolveModuleAccessOverride(
  overrides: RoleModuleAccessRow[],
  role: string | null | undefined,
  extraRoles: string[] | null | undefined,
  moduleSlug: string,
  submoduleSlug: string
): boolean | undefined {
  const held = new Set(
    [role, ...(extraRoles ?? [])].map((r) => (r || "").toUpperCase()).filter(Boolean)
  );
  if (held.size === 0) return undefined;

  const specific = overrides.filter(
    (o) => o.moduleSlug === moduleSlug && o.submoduleSlug === submoduleSlug && held.has(o.role.toUpperCase())
  );
  if (specific.length > 0) return specific.some((o) => o.allowed);

  const moduleLevel = overrides.filter(
    (o) => o.moduleSlug === moduleSlug && o.submoduleSlug === "" && held.has(o.role.toUpperCase())
  );
  if (moduleLevel.length > 0) return moduleLevel.some((o) => o.allowed);

  return undefined;
}
