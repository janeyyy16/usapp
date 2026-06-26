// CSR operations data layer — warnings/mistakes with approval workflow,
// to-do tickets (raw, not yet scheduled), and attendance summaries.
// All dummy data, seeded deterministically per agent so it's stable across reloads.

export type WarningStatus = "Pending Manager" | "Pending Lead" | "Pending Senior" | "Approved" | "Rejected";
export type ApprovalStage = "CSR Manager" | "Lead Manager" | "Senior Manager";

export interface MistakeRecord {
  id: string;
  agent: string;
  team: string;
  date: string;            // YYYY-MM-DD
  category: string;        // e.g. "Wrong Disposition", "Missed Callback"
  description: string;
  severity: "Low" | "Medium" | "High";
  issuedBy: string;        // the Team Leader who granted it
  isWarning: boolean;      // true = warning (needs approval), false = logged mistake only
  status: WarningStatus;
  approvals: { stage: ApprovalStage; by: string; at: string | null; decision: "approved" | "rejected" | "pending" }[];
}

export interface TodoTicket {
  id: string;
  ticketNo: string;
  customer: string;
  city: string;
  branch: string;
  brand: string;
  reason: string;          // why it's in the to-do (raw / left message / note added)
  state: "Raw - From Customer" | "Attended - Note Left" | "Left Message" | "Callback Needed";
  ageHours: number;        // how long it's been waiting
  assignedAgent: string;
  date: string;
}

export interface AttendanceSummary {
  agent: string;
  team: string;
  month: string;           // YYYY-MM
  present: number;
  late: number;
  absent: number;
  pto: number;
}

// ── Seeded RNG ──
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}
function nameSeed(name: string, salt = 0) {
  return name.split("").reduce((s, c) => s + c.charCodeAt(0), 0) + salt;
}
function pick<T>(arr: T[], r: number): T { return arr[Math.min(Math.floor(r * arr.length), arr.length - 1)]; }

// ── Reference data ──
export const CSR_MANAGER = "Raul Mendoza";       // issues warnings/mistakes (csr.mngr@ahs.com)
export const LEAD_MANAGER = "Lou Basco";          // Lead Manager approval
export const SENIOR_MANAGER = "Aleena Hii";       // Senior Manager approval

export const TEAM_LEADERS: Record<string, string> = {
  "TEAM DANIELA": "Daniela Mercado",
  "TEAM ROBYN": "Robyn Heredia",
  "TEAM ROCHELLE": "Rochelle Santos",
  "TEAM SHANE": "Shane Villanueva",
};

const MISTAKE_CATEGORIES = [
  "Wrong Disposition", "Missed Callback", "Incorrect Scheduling", "No Note Left",
  "Wrong Status Update", "Late Follow-up", "Customer Complaint", "Incomplete Ticket Info",
  "Failed Verification", "Duplicate Ticket",
];
const MISTAKE_DESCRIPTIONS = [
  "Set ticket to wrong status without verifying parts availability.",
  "Did not return customer call within the SLA window.",
  "Scheduled technician outside the coverage zone.",
  "Closed ticket without leaving a disposition note.",
  "Marked ticket resolved while parts were still pending.",
  "Followed up 2 days late on a pending callback.",
  "Customer escalated due to repeated missed appointments.",
  "Ticket created without complete appliance model info.",
  "Did not verify warranty status before scheduling.",
  "Created a duplicate ticket for an existing case.",
];

// ── Generate mistake/warning records (replaces misleading old data) ──
export function generateMistakeRecords(agentName: string, team: string, count: number): MistakeRecord[] {
  const rng = seededRand(nameSeed(agentName, 99));
  const tl = TEAM_LEADERS[team] || "Team Leader";
  const records: MistakeRecord[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(rng() * 120);   // spread over ~4 months
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    const date = d.toISOString().slice(0, 10);
    const isWarning = rng() < 0.45;
    const sevRoll = rng();
    const severity = sevRoll < 0.5 ? "Low" : sevRoll < 0.82 ? "Medium" : "High";
    const catIdx = Math.floor(rng() * MISTAKE_CATEGORIES.length);

    // Issued by the Team Leader, then approved through:
    // Raul (CSR Manager) -> Lou (Lead Manager) -> Aleena (Senior Manager)
    let status: WarningStatus = "Approved";
    const approvals: MistakeRecord["approvals"] = [];
    if (isWarning) {
      const progress = rng();  // how far through the chain
      const mgrAt = new Date(d); mgrAt.setHours(mgrAt.getHours() + 4);
      const leadAt = new Date(d); leadAt.setDate(leadAt.getDate() + 1);
      const seniorAt = new Date(d); seniorAt.setDate(seniorAt.getDate() + 2);

      if (progress < 0.25) {
        status = "Pending Manager";
        approvals.push({ stage: "CSR Manager", by: CSR_MANAGER, at: null, decision: "pending" });
        approvals.push({ stage: "Lead Manager", by: LEAD_MANAGER, at: null, decision: "pending" });
        approvals.push({ stage: "Senior Manager", by: SENIOR_MANAGER, at: null, decision: "pending" });
      } else if (progress < 0.5) {
        status = "Pending Lead";
        approvals.push({ stage: "CSR Manager", by: CSR_MANAGER, at: mgrAt.toISOString(), decision: "approved" });
        approvals.push({ stage: "Lead Manager", by: LEAD_MANAGER, at: null, decision: "pending" });
        approvals.push({ stage: "Senior Manager", by: SENIOR_MANAGER, at: null, decision: "pending" });
      } else if (progress < 0.7) {
        status = "Pending Senior";
        approvals.push({ stage: "CSR Manager", by: CSR_MANAGER, at: mgrAt.toISOString(), decision: "approved" });
        approvals.push({ stage: "Lead Manager", by: LEAD_MANAGER, at: leadAt.toISOString(), decision: "approved" });
        approvals.push({ stage: "Senior Manager", by: SENIOR_MANAGER, at: null, decision: "pending" });
      } else if (progress < 0.9) {
        status = "Approved";
        approvals.push({ stage: "CSR Manager", by: CSR_MANAGER, at: mgrAt.toISOString(), decision: "approved" });
        approvals.push({ stage: "Lead Manager", by: LEAD_MANAGER, at: leadAt.toISOString(), decision: "approved" });
        approvals.push({ stage: "Senior Manager", by: SENIOR_MANAGER, at: seniorAt.toISOString(), decision: "approved" });
      } else {
        status = "Rejected";
        const rejectStage = pick(["CSR Manager", "Lead Manager", "Senior Manager"] as ApprovalStage[], rng());
        approvals.push({ stage: "CSR Manager", by: CSR_MANAGER, at: mgrAt.toISOString(), decision: rejectStage === "CSR Manager" ? "rejected" : "approved" });
        if (rejectStage !== "CSR Manager") {
          approvals.push({ stage: "Lead Manager", by: LEAD_MANAGER, at: leadAt.toISOString(), decision: rejectStage === "Lead Manager" ? "rejected" : "approved" });
        }
        if (rejectStage === "Senior Manager") {
          approvals.push({ stage: "Senior Manager", by: SENIOR_MANAGER, at: seniorAt.toISOString(), decision: "rejected" });
        }
      }
    }

    records.push({
      id: `m-${agentName}-${i}`.replace(/\s+/g, "_"),
      agent: agentName,
      team,
      date,
      category: MISTAKE_CATEGORIES[catIdx],
      description: MISTAKE_DESCRIPTIONS[catIdx],
      severity,
      issuedBy: tl,
      isWarning,
      status: isWarning ? status : "Approved",
      approvals,
    });
  }
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Generate To-Do tickets (raw / not yet scheduled) ──
const TODO_FIRST = ["Robert","Maria","John","Anna","Jose","Mary","Michael","Linda","Carlos","Patricia","Daniel","Susan","James","Jessica","David"];
const TODO_LAST = ["Smith","Johnson","Williams","Brown","Garcia","Miller","Davis","Rodriguez","Martinez","Wilson","Anderson","Taylor","Moore","Jackson","Lee"];
const TODO_CITIES = ["Nashville","Atlanta","Memphis","Birmingham","Richmond","Mobile","Knoxville","Savannah","Raleigh","Montgomery"];
const TODO_BRANCHES = ["Nashville","Atlanta","Memphis","Birmingham","Richmond"];
const TODO_BRANDS = ["GE","ASSURANT","SQT","ELECTROLUX","MIDEA","LG","HISENSE"];
const TODO_STATES: TodoTicket["state"][] = ["Raw - From Customer", "Attended - Note Left", "Left Message", "Callback Needed"];
const TODO_REASONS: Record<TodoTicket["state"], string> = {
  "Raw - From Customer": "New ticket straight from the customer — untouched, not yet reviewed",
  "Attended - Note Left": "Reviewed and noted — still not set to Need Scheduling",
  "Left Message": "Called customer, left voicemail — awaiting callback before scheduling",
  "Callback Needed": "Customer requested a callback before we can schedule",
};

export function generateTodoTickets(agentName: string, branch: string, count: number): TodoTicket[] {
  const rng = seededRand(nameSeed(agentName, 7));
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const state = TODO_STATES[Math.floor(rng() * TODO_STATES.length)];
    const ageHours = Math.floor(rng() * 72) + 1;
    const d = new Date(today); d.setHours(d.getHours() - ageHours);
    const fn = TODO_FIRST[Math.floor(rng() * TODO_FIRST.length)];
    const ln = TODO_LAST[Math.floor(rng() * TODO_LAST.length)];
    const pfx = rng() < 0.5 ? "SA-" : rng() < 0.7 ? "HAP" : "";
    return {
      id: `todo-${agentName}-${i}`.replace(/\s+/g, "_"),
      ticketNo: pfx + (Math.floor(rng() * 9000000) + 1000000),
      customer: `${fn} ${ln}`,
      city: branch,
      branch,
      brand: TODO_BRANDS[Math.floor(rng() * TODO_BRANDS.length)],
      reason: TODO_REASONS[state],
      state,
      ageHours,
      assignedAgent: agentName,
      date: d.toISOString().slice(0, 10),
    };
  }).sort((a, b) => b.ageHours - a.ageHours);
}

// ── Generate attendance summary for an agent over recent months ──
export function generateAttendance(agentName: string, team: string, months: number): AttendanceSummary[] {
  const rng = seededRand(nameSeed(agentName, 31));
  const out: AttendanceSummary[] = [];
  const now = new Date();
  for (let m = 0; m < months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const workdays = 22;
    const late = Math.floor(rng() * 4);
    const absent = Math.floor(rng() * 2);
    const pto = Math.floor(rng() * 2);
    out.push({ agent: agentName, team, month, present: workdays - absent - pto, late, absent, pto });
  }
  return out;
}

// Helper: filter records to a month (YYYY-MM) or date range
export function filterByMonth<T extends { date: string }>(records: T[], month: string | null): T[] {
  if (!month) return records;
  return records.filter(r => r.date.startsWith(month));
}
export function filterByRange<T extends { date: string }>(records: T[], from: string | null, to: string | null): T[] {
  return records.filter(r => (!from || r.date >= from) && (!to || r.date <= to));
}

// ── Build a full ticket-detail record from To-Do tickets ──
// Lets the ticket detail page open a To-Do ticket with real editable data
// instead of "Ticket not found". Searches all demo agents' generated to-do lists.
export interface TodoTicketDetail {
  ticketNo: string; account: string; warranty: string; product: string;
  tat: string; status: string; schedule: string; contact: string; location: string;
  firstName: string; lastName: string; address: string; city: string;
  state: string; zip: string; homePhone: string; cellPhone: string; email: string;
  brand: string; model: string; serialNo: string; productCategory: string;
  purchaseDate: string; warrantyType: string; claimCompany: string;
  accountNo: string; callNo: string; callType: string; callStatus: string;
  postingDate: string; problemDescription: string; scheduleDate: string;
  schedulePeriod: string; technician: string;
  customerNotes: Array<{ date: string; notes: string; by: string }>;
  servicerNotes: Array<{ notes: string; by: string }>;
}

const TODO_PRODUCTS = ["Refrigerator", "Washer", "Dryer", "Dishwasher", "Range", "Microwave", "Freezer"];
const TODO_PROBLEMS = [
  "Unit not cooling properly, customer reports warm interior.",
  "Washer not draining, water remains after cycle.",
  "Dryer not heating, clothes remain damp after full cycle.",
  "Dishwasher leaking from bottom door seal.",
  "Range burner not igniting on front-left element.",
  "Microwave turntable not rotating, possible motor issue.",
  "Freezer building excess frost, door seal suspect.",
];
const STATE_TO_STATUS: Record<string, string> = {
  "Raw - From Customer": "New - From Customer",
  "Attended - Note Left": "CSR - Note Left",
  "Left Message": "CSR - Left Message",
  "Callback Needed": "CSR - Callback Needed",
};

/** Returns every demo agent's to-do tickets, used to resolve a clicked ticket. */
function allDemoTodos(): TodoTicket[] {
  // mirror the demo agents/branches that have to-do lists
  const agents: { name: string; branch: string }[] = [
    { name: "Anna Dominique", branch: "Nashville" },
  ];
  const out: TodoTicket[] = [];
  agents.forEach(a => out.push(...generateTodoTickets(a.name, a.branch, 18)));
  return out;
}

export function buildTicketDetailFromTodo(ticketNo: string): TodoTicketDetail | null {
  const todo = allDemoTodos().find(t => t.ticketNo === ticketNo);
  if (!todo) return null;
  const rng = seededRand(nameSeed(todo.ticketNo, 13));
  const [firstName, lastName] = todo.customer.split(" ");
  const product = TODO_PRODUCTS[Math.floor(rng() * TODO_PRODUCTS.length)];
  const problem = TODO_PROBLEMS[Math.floor(rng() * TODO_PROBLEMS.length)];
  const street = `${Math.floor(rng() * 9000) + 100} ${["Oak", "Maple", "Main", "Pine", "Cedar", "Elm"][Math.floor(rng() * 6)]} St`;
  const phone = `615-${Math.floor(rng() * 900) + 100}-${Math.floor(rng() * 9000) + 1000}`;

  const customerNotes = [{
    date: `${todo.date} 09:${String(Math.floor(rng() * 60)).padStart(2, "0")}:00`,
    notes: todo.state === "Raw - From Customer"
      ? "Ticket created from inbound customer call. Awaiting CSR review."
      : todo.reason,
    by: "System",
  }];

  return {
    ticketNo: todo.ticketNo,
    account: todo.brand,
    warranty: "IW",
    product,
    tat: `${Math.floor(todo.ageHours / 24)}d`,
    status: STATE_TO_STATUS[todo.state] || "New",
    schedule: "Not yet scheduled",
    contact: "Pending",
    location: todo.branch,
    firstName: firstName || todo.customer,
    lastName: lastName || "",
    address: street,
    city: todo.city,
    state: "Tennessee",
    zip: `37${Math.floor(rng() * 900) + 100}`,
    homePhone: phone,
    cellPhone: phone,
    email: `${(firstName || "customer").toLowerCase()}@example.com`,
    brand: todo.brand,
    model: `MDL-${Math.floor(rng() * 90000) + 10000}`,
    serialNo: `SN${Math.floor(rng() * 9000000) + 1000000}`,
    productCategory: product,
    purchaseDate: "2025-08-15",
    warrantyType: "In warranty",
    claimCompany: todo.brand,
    accountNo: `ACC${Math.floor(rng() * 90000) + 10000}`,
    callNo: todo.ticketNo,
    callType: "In warranty",
    callStatus: "PENDING / NOT YET SCHEDULED",
    postingDate: todo.date,
    problemDescription: problem,
    scheduleDate: "",
    schedulePeriod: "",
    technician: "",
    customerNotes,
    servicerNotes: [],
  };
}
