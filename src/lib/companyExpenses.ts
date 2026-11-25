/**
 * Accounting → Expenses → Flash Tech → Other Expenses: company expenses from
 * the bank accounts (migration 0479), not tied to an employee.
 *
 * Finance's "AHS Expenses" workbook has one sheet per bank account (the
 * sheet name is the statement period then the account's last 4 digits:
 * "101-1115 3510" = 10/1 – 11/15, account 3510), a header row
 * Amount · Date · Category · Branch · Memo, and spending as negative
 * amounts. Here an expense is positive and a credit / refund negative.
 */
import { LOCATIONS_DATA } from "@/lib/zipCoverage";
import { CONTRACTOR_DATA_US_STATES } from "@/lib/contractorDataUsFormTemplate";

export interface CompanyExpense {
  id: string;
  /** Spent, positive; a credit / refund is negative. */
  amount: number;
  /** YYYY-MM-DD */
  expenseDate: string;
  category: string;
  /** "Company", a branch ("Memphis, TN") or a state ("North Carolina"). */
  branch: string;
  memo: string;
  /** Bank account's last 4 digits ("3510"); "" when none. */
  account: string;
  /** Attached photos / PDFs (Add / Edit) - imported lines start with none. */
  receipts: CompanyExpenseFile[];
  importSource: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedByName: string | null;
}

export interface CompanyExpenseFile {
  url: string;
  /** Firebase Storage path - to delete the file when it's removed. */
  path: string | null;
  name: string;
}

/** How many files one expense can carry. */
export const MAX_COMPANY_EXPENSE_FILES = 10;

export const COMPANY_BRANCH = "Company";

/** The workbook's categories, A → Z — the form's list (any other can be typed). */
export const COMPANY_EXPENSE_CATEGORIES = [
  "Accounting & Legal Fees",
  "Automotive",
  "Bank Charge",
  "Bills & Utilities",
  "Car Loan",
  "Credit Card",
  "Entertainment",
  "Food & Drink",
  "Gas",
  "Insurance Expense",
  "Merchandise & Inventory",
  "Mortgage Payable",
  "Office & Shipping",
  "Office Equipment",
  "Operating Expense",
  "Payroll",
  "Professional Services",
  "Repair & Maintenance",
  "Taxes & Licenses",
  "Travel",
];

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Same category however it's typed: capitals, spaces, "&" — and "Repairs" = "Repair". */
export function normalizeCategory(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return "";
  const k = key(s).replace(/^repairs/, "repair");
  return COMPANY_EXPENSE_CATEGORIES.find((c) => key(c).replace(/^repairs/, "repair") === k) ?? s;
}

/** Every branch as "City, ST" (Jackson,MS → "Jackson, MS"), A → Z. US branches only. */
export const COMPANY_EXPENSE_BRANCHES: string[] = Array.from(
  new Set(
    LOCATIONS_DATA.filter((l) => !l.isPhilippines && !l.isMexico && l.state)
      .map((l) => {
        const city = l.location.split(",")[0].trim();
        return `${city}, ${l.state}`;
      })
  )
).sort((a, b) => a.localeCompare(b));

export const COMPANY_EXPENSE_STATES: string[] = CONTRACTOR_DATA_US_STATES.filter((s) => s !== "Puerto Rico");

/** Levenshtein distance — catches "Tallahasee" / "Nashvillle". */
function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/**
 * The workbook's Branch → one of the form's choices. Blank → Company.
 * `matched` is false when it couldn't be placed ("Check AHS", "Jackson, MS or
 * Jackson, TN") — kept as typed and flagged for a look.
 */
export function normalizeBranch(raw: string): { branch: string; matched: boolean } {
  const s = raw.replace(/\s+/g, " ").trim();
  if (!s) return { branch: COMPANY_BRANCH, matched: true };
  const k = key(s);
  if (k === key(COMPANY_BRANCH)) return { branch: COMPANY_BRANCH, matched: true };
  const exact = COMPANY_EXPENSE_BRANCHES.find((b) => key(b) === k) ?? COMPANY_EXPENSE_STATES.find((st) => key(st) === k);
  if (exact) return { branch: exact, matched: true };
  // A typo in the city (one or two letters), same state.
  let best: { b: string; d: number } | null = null;
  for (const b of COMPANY_EXPENSE_BRANCHES) {
    const d = distance(key(b), k);
    if (d <= 2 && (!best || d < best.d)) best = { b, d };
  }
  return best ? { branch: best.b, matched: true } : { branch: s, matched: false };
}

/** Excel day number, a Date, "2026-10-14" or "10/14/2026" → "YYYY-MM-DD" ("" when not a date). */
export function toISODate(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
  }
  if (typeof v === "number" && isFinite(v)) return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  const s = String(v ?? "").trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(s);
  if (us) return `${us[3].length === 2 ? `20${us[3]}` : us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  return "";
}

/** "-1,250.50" / "$72.83" / -72.83 → number (null when not a number). */
export function toAmount(v: unknown): number | null {
  if (typeof v === "number") return isFinite(v) ? v : null;
  const s = String(v ?? "").replace(/[$,\s]/g, "");
  const neg = /^\(.*\)$/.test(s);
  const n = Number(s.replace(/[()]/g, ""));
  return s && isFinite(n) ? (neg ? -n : n) : null;
}

/**
 * A sheet name → its account and statement period:
 * "101-1115 3510" → account "3510", period 10/1 – 11/15 ("10/1 – 11/15").
 * The account is the last 4-digit group; a name without one is kept whole.
 * The period is "MDD-MMDD"-style digits before it (month is 2 digits when
 * that makes a real month, else 1: "101" = 10/1, "915" = 9/15).
 */
export function parseSheetName(name: string): { account: string; period: string } {
  const s = name.replace(/\s+/g, " ").trim();
  const acct = /(\d{4})\s*$/.exec(s);
  const account = acct ? acct[1] : s;
  const rest = acct ? s.slice(0, acct.index).trim() : "";
  const md = (d: string) => {
    for (const ml of [2, 1]) {
      if (d.length <= ml) continue;
      const m = Number(d.slice(0, ml)), day = Number(d.slice(ml));
      if (m >= 1 && m <= 12 && day >= 1 && day <= 31 && d.length - ml <= 2) return `${m}/${day}`;
    }
    return null;
  };
  const range = /^(\d{2,4})\s*-\s*(\d{2,4})$/.exec(rest);
  const from = range ? md(range[1]) : null;
  const to = range ? md(range[2]) : null;
  return { account, period: from && to ? `${from} – ${to}` : rest };
}

export interface ImportRow {
  sheet: string;
  /** The statement period from the sheet name ("10/1 – 11/15"), for the preview. */
  period: string;
  /** 1-based row in the sheet, for "row 14" messages. */
  rowNumber: number;
  account: string;
  /** Spent, positive; a credit (positive in the workbook) is negative. */
  amount: number;
  expenseDate: string;
  category: string;
  branch: string;
  /** The Branch cell as typed, when it was changed or couldn't be placed. */
  branchTyped: string;
  branchMatched: boolean;
  memo: string;
  problems: string[];
}

/**
 * One sheet (rows of cells) → expense rows. Finds the header row
 * (Amount … Memo) anywhere in the first 10 rows; the account is the sheet
 * name. Blank rows are skipped; rows missing an amount or date are kept
 * with a problem so they show in the preview but aren't saved.
 */
export function parseExpenseSheet(sheet: string, rows: unknown[][]): ImportRow[] | null {
  const headerAt = rows.slice(0, 10).findIndex((r) => {
    const cells = (r ?? []).map((c) => key(String(c ?? "")));
    return cells.includes("amount") && cells.includes("date") && cells.includes("category");
  });
  if (headerAt === -1) return null;
  const header = rows[headerAt].map((c) => key(String(c ?? "")));
  const col = (name: string) => header.indexOf(name);
  const [ca, cd, cc, cb, cm] = [col("amount"), col("date"), col("category"), col("branch"), col("memo")];
  const out: ImportRow[] = [];
  const { account, period } = parseSheetName(sheet);
  for (let i = headerAt + 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const cell = (c: number) => (c >= 0 ? r[c] : "");
    if ([ca, cd, cc, cb, cm].every((c) => String(cell(c) ?? "").trim() === "")) continue;
    const raw = toAmount(cell(ca));
    const date = toISODate(cell(cd));
    const category = normalizeCategory(String(cell(cc) ?? ""));
    const typedBranch = String(cell(cb) ?? "").replace(/\s+/g, " ").trim();
    const { branch, matched } = normalizeBranch(typedBranch);
    const problems: string[] = [];
    if (raw == null || raw === 0) problems.push("No amount");
    if (!date) problems.push("No date");
    out.push({
      sheet,
      rowNumber: i + 1,
      account,
      period,
      amount: raw == null ? 0 : Math.round(-raw * 100) / 100,
      expenseDate: date,
      category: category || "Uncategorized",
      branch,
      branchTyped: typedBranch && typedBranch !== branch ? typedBranch : "",
      branchMatched: matched,
      memo: String(cell(cm) ?? "").replace(/\s+/g, " ").trim(),
      problems,
    });
  }
  return out;
}

/** What makes two lines the same transaction (for skipping ones already saved). */
export function expenseKey(e: { account: string; expenseDate: string; amount: number; category: string; branch: string; memo: string }): string {
  return [e.account.trim(), e.expenseDate, e.amount.toFixed(2), key(e.category), key(e.branch), key(e.memo)].join("|");
}

/**
 * Marks rows already saved. Counts, not just keys: two identical $127.98
 * background screenings on the same day are two rows, so if one is saved
 * the second still goes in.
 */
export function markAlreadySaved<T extends { account: string; expenseDate: string; amount: number; category: string; branch: string; memo: string }>(
  rows: T[],
  saved: { account: string; expenseDate: string; amount: number; category: string; branch: string; memo: string }[]
): { row: T; alreadySaved: boolean }[] {
  const left = new Map<string, number>();
  for (const s of saved) left.set(expenseKey(s), (left.get(expenseKey(s)) ?? 0) + 1);
  return rows.map((row) => {
    const k = expenseKey(row);
    const n = left.get(k) ?? 0;
    if (n > 0) left.set(k, n - 1);
    return { row, alreadySaved: n > 0 };
  });
}
