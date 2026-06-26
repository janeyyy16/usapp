// Role-based access control for demo users.
// Maps demo login emails to a role, and each role to the modules / dashboard
// cards / panels they are allowed to see. Universal tools (timecard, profile,
// settings, announcements) are available to everyone.

export type RoleId =
  | "admin"        // full access (existing default)
  | "hr"           // HR + payroll + attendance
  | "csr"          // regular customer service agent
  | "csr_tl"       // CSR team leader
  | "csr_mngr"     // CSR manager (Raul) — issues warnings, full CSR dashboard
  | "po"           // parts order worker
  | "finance";     // finance / accounting

export interface RoleDef {
  id: RoleId;
  label: string;
  /** Top-level modules visible in the home grid. "*" = all modules. */
  modules: string[] | "*";
  /** Dashboard submodule slugs visible as cards. "*" = all. [] = none. */
  dashboardCards: string[] | "*";
  /** Default landing module slug after login. */
  defaultModule: string;
  /** Optional: restrict to specific submodule slugs within allowed modules. "*" = all within the module. */
  submodules?: Record<string, string[] | "*">;
}

// Universal tools available to every role regardless of module access.
export const UNIVERSAL_ROUTES = ["/timecard", "/profile", "/settings", "/privacy", "/announcements", "/home", "/landing", "/"];

export const ROLES: Record<RoleId, RoleDef> = {
  admin: {
    id: "admin",
    label: "Administrator",
    modules: "*",
    dashboardCards: "*",
    defaultModule: "dashboard",
  },

  hr: {
    id: "hr",
    label: "Human Resources",
    modules: ["dashboard"],
    dashboardCards: [
      "hr-dashboard",
      "attendance-monitoring",
      "employee-self-service",
      "pto-leave-management",
      "daily-activity",
      "overall-status",
    ],
    defaultModule: "dashboard",
    submodules: { dashboard: "*" },
  },

  csr: {
    id: "csr",
    label: "Customer Service Representative",
    modules: ["dashboard", "tickets"],
    dashboardCards: [
      "csr-dashboard",
      "employee-self-service",
      "daily-activity",
    ],
    defaultModule: "dashboard",
    // CSR agents see ticket tools but not admin-level ticket controls
    submodules: {
      dashboard: ["csr-dashboard", "employee-self-service", "daily-activity"],
      tickets: ["ticket-list", "new-ticket", "sms-list", "todo-list"],
    },
  },

  csr_tl: {
    id: "csr_tl",
    label: "CSR Team Leader",
    modules: ["dashboard", "tickets"],
    dashboardCards: [
      "csr-dashboard",
      "employee-self-service",
      "daily-activity",
      "csr-daily-report",
      "csr-status-summary",
    ],
    defaultModule: "dashboard",
    submodules: {
      dashboard: ["csr-dashboard", "employee-self-service", "daily-activity", "csr-daily-report", "csr-status-summary"],
      tickets: "*",
    },
  },

  csr_mngr: {
    id: "csr_mngr",
    label: "CSR Manager",
    modules: ["dashboard", "tickets"],
    dashboardCards: [
      "csr-dashboard",
      "csr-daily-report",
      "call-tracker",
      "csr-status-summary",
      "employee-self-service",
      "daily-activity",
    ],
    defaultModule: "dashboard",
    submodules: {
      dashboard: "*",
      tickets: "*",
    },
  },

  po: {
    id: "po",
    label: "Parts Order Worker",
    modules: ["dashboard", "parts"],
    dashboardCards: [
      "parts-dashboard",
      "employee-self-service",
    ],
    defaultModule: "parts",
    submodules: {
      dashboard: ["parts-dashboard", "employee-self-service"],
      parts: "*",
    },
  },

  finance: {
    id: "finance",
    label: "Finance",
    modules: ["dashboard"],
    dashboardCards: [
      "accounting-dashboard",
      "expense-tracking",
      "payroll-calculation",
      "overall-status",
      "employee-self-service",
    ],
    defaultModule: "dashboard",
    submodules: { dashboard: "*" },
  },
};

// Demo user accounts. Password is "demo123" for all (not validated — demo only).
export interface DemoUser {
  email: string;
  role: RoleId;
  name: string;
  companyId: string;
  /** For CSR agents: the name they map to in the report data (their personal stats). */
  agentName?: string;
  /** For CSR team leaders: which team they lead (e.g. "TEAM DANIELA"). */
  team?: string;
  /** For CSR agents: their assigned branch. */
  branch?: string;
}

export const DEMO_USERS: DemoUser[] = [
  { email: "admin@ahsolutions.com", role: "admin",   name: "System Admin",        companyId: "4930403" },
  { email: "hr@ahs.com",            role: "hr",       name: "HR Manager",          companyId: "4930403" },
  { email: "csr1@ahs.com",          role: "csr",      name: "Anna Dominique",      companyId: "4930403", agentName: "Anna Dominique", team: "TEAM DANIELA", branch: "Nashville" },
  { email: "csr.tl@ahs.com",        role: "csr_tl",   name: "Daniela Mercado",     companyId: "4930403", team: "TEAM DANIELA" },
  { email: "csr.mngr@ahs.com",      role: "csr_mngr", name: "Raul Mendoza",        companyId: "4930403" },
  { email: "po@ahs.com",            role: "po",       name: "Parts Order Worker",  companyId: "4930403" },
  { email: "fnnc@ahs.com",          role: "finance",  name: "Finance Officer",     companyId: "4930403" },
];

/** Returns the report-data agent name a CSR demo user maps to, if any. */
export function getAgentNameForEmail(email: string | null): string | null {
  if (!email) return null;
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  return user?.agentName ?? null;
}

/** Returns the team a CSR team leader leads, if any. */
export function getTeamForEmail(email: string | null): string | null {
  if (!email) return null;
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  return user?.team ?? null;
}

/** Returns the assigned branch for a CSR agent, if any. */
export function getBranchForEmail(email: string | null): string | null {
  if (!email) return null;
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  return user?.branch ?? null;
}

const DEMO_PASSWORD = "demo123";

export function validateDemoLogin(email: string, password: string): DemoUser | null {
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (user && password === DEMO_PASSWORD) return user;
  return null;
}

export function getRoleForEmail(email: string | null): RoleDef {
  if (!email) return ROLES.admin; // default to full access if unknown (back-compat)
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  return user ? ROLES[user.role] : ROLES.admin;
}

const FIREBASE_ROLE_MAP: Record<string, RoleId> = {
  SUPERADMIN: "admin", ADMIN: "admin", MANAGER: "admin", OPERATIONS: "admin", VIEWER: "admin",
  HR: "hr", CSR: "csr", PARTS: "po", FINANCE: "finance", ACCOUNTING: "finance", TECHNICIAN: "csr",
};
export function resolveRole(email: string | null, roleString?: string | null): RoleDef {
  if (roleString) {
    const m = FIREBASE_ROLE_MAP[roleString.toUpperCase()];
    if (m) return ROLES[m];
  }
  return getRoleForEmail(email);
}

export function canAccessModule(email: string | null, moduleSlug: string, roleString?: string | null): boolean {
  const role = resolveRole(email, roleString);
  if (role.modules === "*") return true;
  return role.modules.includes(moduleSlug);
}

export function canAccessSubmodule(email: string | null, moduleSlug: string, submoduleSlug: string, roleString?: string | null): boolean {
  const role = resolveRole(email, roleString);
  if (role.modules !== "*" && !role.modules.includes(moduleSlug)) return false;
  if (!role.submodules) return true;
  const allowed = role.submodules[moduleSlug];
  if (!allowed || allowed === "*") return true;
  return allowed.includes(submoduleSlug);
}

export function visibleDashboardCards(email: string | null, allSlugs: string[], roleString?: string | null): string[] {
  const role = resolveRole(email, roleString);
  if (role.dashboardCards === "*") return allSlugs;
  return allSlugs.filter(s => (role.dashboardCards as string[]).includes(s));
}

/** Cards a role should see even though they're hidden from the default dashboard grid. */
export function roleExtraDashboardCards(email: string | null, roleString?: string | null): string[] {
  const role = resolveRole(email, roleString);
  const EXTRA = ["csr-todo"];
  if (role.dashboardCards === "*") return [];
  return (role.dashboardCards as string[]).filter(s => EXTRA.includes(s));
}
