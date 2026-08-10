import { normalizeRole, ATTENDANCE_MANAGER_TIER_ROLES_ARRAY, isSubmoduleAllowed, isCompanySuperAdminRole } from "./roleLabels";
import type { ModuleDef, SubModuleDef } from "./modules";

/**
 * Role gates for the Dashboard module's submodules (mod.slug === "dashboard").
 * Keyed by submodule slug. A submodule with no entry here is open to every
 * signed-in user (e.g. the Employee Self-Service Portal).
 *
 * SUPERADMIN always passes regardless of this list — same convention as the
 * admin-module gate in m.$module.$submodule.tsx.
 */
export const DASHBOARD_ROLE_GATES: Record<string, string[]> = {
  "daily-activity": ["ADMIN", "BIZOPS_MANAGER", "BIZOPS_SENIOR_MANAGER", "CSR_MANAGER", "HR", "MANAGER", "SENIOR_MANAGER"],
  "overall-status": ["ADMIN", "BIZOPS_MANAGER", "BIZOPS_SENIOR_MANAGER", "MANAGER", "SENIOR_MANAGER"],
  "accounting-dashboard": ["ADMIN", "FINANCE"],
  // Manager-tier roles (see ATTENDANCE_MANAGER_TIER_ROLES_ARRAY) are scoped to
  // their own direct reports here (AttendanceMonitoringPage.tsx's
  // visibleAttendanceProfileIds) — ADMIN/HR/FINANCE/SUPERADMIN see everyone.
  "attendance-monitoring": ["ADMIN", "HR", "FINANCE", ...ATTENDANCE_MANAGER_TIER_ROLES_ARRAY],
  "payroll-calculation": ["ADMIN", "FINANCE"],
  "expense-tracking": ["ADMIN", "FINANCE"],
  // View access matches expense-tracking (SUPERADMIN always bypasses per
  // hasDashboardAccess) — write access (scheduling/editing a trip) is
  // further restricted inside FlashTechCalendarPage.tsx itself and by the
  // flash_tech_trips RLS policies (migration 0126) to just those three.
  "flash-tech-calendar": ["ADMIN", "FINANCE"],
  // CSR_AGENT/CSR_TEAM_LEADER are allowed in here too even though the org-wide
  // overview is meant for CSR_MANAGER/Admin/BizOps — CSRDashboard.tsx itself
  // redirects those two roles straight to their personal Team Leader
  // Dashboard, so they need to pass this gate for that redirect to fire.
  "csr-dashboard": ["ADMIN", "CSR_MANAGER", "BIZOPS_MANAGER", "BIZOPS_SENIOR_MANAGER", "CSR_AGENT", "CSR_TEAM_LEADER"],
  "hr-dashboard": ["ADMIN", "HR"],
  "live-chat-support": ["ADMIN", "BIZOPS_MANAGER", "BIZOPS_SENIOR_MANAGER", "CSR_AGENT", "CSR_TEAM_LEADER", "CSR_MANAGER"],
  // IT Tickets now lives only in the Admin module (m.$module.$submodule.tsx
  // reuses this same list via getDashboardRoleGate("it-tickets") to carve
  // an exception into the Admin-module's Admin/SuperAdmin-only gate) — IT
  // and Admin get full edit/delete, Senior-tier managers are view-only,
  // both enforced again inside ItTicketsPage.tsx and by the it_tickets RLS
  // policies (migration 0112), not just this list.
  "it-tickets": ["IT", "ADMIN", "SENIOR_MANAGER", "SENIOR_BRANCH_MANAGER", "BIZOPS_SENIOR_MANAGER"],
};

export function getDashboardRoleGate(subSlug: string): string[] | null {
  return DASHBOARD_ROLE_GATES[subSlug] ?? null;
}

/**
 * True if `role` (primary) or anything in `extraRoles` satisfies one of the
 * `allowedRoles` for a gated page. SUPERADMIN always passes.
 */
export function hasDashboardAccess(
  allowedRoles: string[],
  role: string | null | undefined,
  extraRoles: string[] | null | undefined
): boolean {
  const primary = normalizeRole(role);
  if (primary === "SUPERADMIN") return true;
  // normalizeRole() so legacy space-separated role values (e.g. "CSR Manager")
  // still match the underscore-form codes in allowedRoles (e.g. "CSR_MANAGER").
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  if (normalizedAllowed.includes(primary)) return true;
  return (extraRoles || []).some((r) => normalizedAllowed.includes(normalizeRole(r)));
}

/**
 * Roles allowed into the admin module overall, and into User Management
 * specifically. Hoisted here (out of m.$module.$submodule.tsx, the only
 * place that used to declare these) so the Accessibility Management page's
 * displayed defaults can never drift from what the route gate actually
 * enforces — both read the exact same constants.
 */
export const ADMIN_MODULE_ROLES = ["ADMIN", "SUPERADMIN"];
export const USER_MANAGEMENT_ROLES = ["HR", "MANAGER", "ADMIN", "SUPERADMIN"];

/** Admin-module submodules open to every role regardless of the admin-module gate — company-wide utilities like the internal team messenger. */
export const ALL_ROLES_ADMIN_SUBMODULES = new Set(["internal-message-support"]);

/**
 * Collapses the five hardcoded "can this role open this submodule at all"
 * checks m.$module.$submodule.tsx runs (CSR allow-list, Admin-module gate,
 * User Management gate, Company Settings gate, Dashboard-submodule gate)
 * into one boolean, for a role in the abstract (no extraRoles/signed-in
 * user — this answers "what can this role code do on its own"). Used by
 * both the real route gate (as its fallback when no explicit
 * role_module_access override exists) and the Accessibility Management
 * matrix page (to seed each checkbox's default state) — so the two can
 * never disagree about what today's rules actually allow.
 */
export function computeSubmoduleFallbackAccess(mod: ModuleDef, sub: SubModuleDef, role: string): boolean {
  if (!isSubmoduleAllowed(role, mod.slug, sub.slug, [])) return false;

  if (mod.slug === "admin") {
    const hasAdmin = hasDashboardAccess(ADMIN_MODULE_ROLES, role, []);
    const hasItTickets = (sub as any).custom === "it-tickets" && hasDashboardAccess(getDashboardRoleGate("it-tickets") || [], role, []);
    if (!hasAdmin && !hasItTickets && !ALL_ROLES_ADMIN_SUBMODULES.has(sub.slug)) return false;
  }

  if (sub.custom === "user-management" && !hasDashboardAccess(USER_MANAGEMENT_ROLES, role, [])) return false;

  if ((sub as any).custom === "company-settings" && !isCompanySuperAdminRole(role, [])) return false;

  if (mod.slug === "dashboard") {
    const gate = getDashboardRoleGate(sub.slug);
    if (gate && !hasDashboardAccess(gate, role, [])) return false;
  }

  return true;
}
