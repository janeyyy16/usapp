/** Company expenses (migration 0479) — Expenses → Flash Tech → Other Expenses. */
import { supabase } from "./client";
import type { CompanyExpense, CompanyExpenseFile } from "@/lib/companyExpenses";

const COLUMNS = "id, amount, expense_date, category, branch, memo, account, receipts, import_source, created_by_name, created_at, updated_by_name";
const PAGE = 1000;

const needs0479 = (msg: string) =>
  /company_expenses/.test(msg) && /does not exist|schema cache|not find/i.test(msg)
    ? "Other Expenses needs migration 0479 — run it in the Supabase SQL Editor first."
    : msg;

function mapRow(r: any): CompanyExpense {
  return {
    id: r.id,
    amount: Number(r.amount) || 0,
    expenseDate: r.expense_date ?? "",
    category: r.category ?? "",
    branch: r.branch ?? "Company",
    memo: r.memo ?? "",
    account: r.account ?? "",
    receipts: (Array.isArray(r.receipts) ? r.receipts : [])
      .filter((f: any) => f && typeof f.url === "string")
      .map((f: any) => ({ url: f.url as string, path: typeof f.path === "string" ? f.path : null, name: typeof f.name === "string" ? f.name : "" })),
    importSource: r.import_source ?? null,
    createdByName: r.created_by_name ?? null,
    createdAt: r.created_at ?? "",
    updatedByName: r.updated_by_name ?? null,
  };
}

/** Every company expense, newest date first. Throws (with the migration hint) when the table is missing. */
export async function getCompanyExpenseRows(): Promise<CompanyExpense[]> {
  const all: CompanyExpense[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("company_expenses")
      .select(COLUMNS)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(needs0479(error.message));
    all.push(...(data ?? []).map(mapRow));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

export type CompanyExpenseInput = Pick<CompanyExpense, "amount" | "expenseDate" | "category" | "branch" | "memo" | "account">;

const toDb = (e: CompanyExpenseInput) => ({
  amount: Math.round(e.amount * 100) / 100,
  expense_date: e.expenseDate,
  category: e.category.trim(),
  branch: e.branch.trim() || "Company",
  memo: e.memo.trim(),
  account: e.account.trim(),
});

/** Adds it and returns its id (attachments are uploaded under that id, then saved with setCompanyExpenseReceipts). */
export async function addCompanyExpense(e: CompanyExpenseInput): Promise<string> {
  const { data, error } = await supabase.from("company_expenses").insert(toDb(e)).select("id").single();
  if (error) throw new Error(needs0479(error.message));
  return data.id as string;
}

export async function setCompanyExpenseReceipts(id: string, receipts: CompanyExpenseFile[]): Promise<void> {
  const { error } = await supabase
    .from("company_expenses")
    .update({ receipts: receipts.map((f) => ({ url: f.url, path: f.path, name: f.name })) })
    .eq("id", id);
  if (error) {
    throw new Error(/receipts/.test(error.message) && /column|schema cache/i.test(error.message)
      ? "Attachments need the latest migration 0479 (receipts column) - run it again in the Supabase SQL Editor."
      : needs0479(error.message));
  }
}

export async function updateCompanyExpense(id: string, e: CompanyExpenseInput): Promise<void> {
  const { error } = await supabase.from("company_expenses").update(toDb(e)).eq("id", id);
  if (error) throw new Error(needs0479(error.message));
}

export async function deleteCompanyExpense(id: string): Promise<void> {
  const { error } = await supabase.from("company_expenses").delete().eq("id", id);
  if (error) throw new Error(needs0479(error.message));
}

/** Import Excel: saves in batches of 200; returns how many went in. */
export async function importCompanyExpenses(rows: CompanyExpenseInput[], source: string, onProgress?: (done: number) => void): Promise<number> {
  let done = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200).map((r) => ({ ...toDb(r), import_source: source }));
    const { error } = await supabase.from("company_expenses").insert(chunk);
    if (error) throw new Error(`${needs0479(error.message)}${done ? ` (${done} saved before this)` : ""}`);
    done += chunk.length;
    onProgress?.(done);
  }
  return done;
}
