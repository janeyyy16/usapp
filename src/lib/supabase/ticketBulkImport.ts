/**
 * Import Bulk Tickets (Tickets → Create New Ticket) — reads a ServicePower
 * ticket export (.csv or .xlsx/.xls, same columns as the files that used to
 * be turned into SQL by scripts/gen-ticket-sql.mjs) and creates one customer
 * + one ticket per row, in the signed-in user's company (the insert triggers
 * stamp company_id from the session, RLS keeps it company-scoped).
 *
 * Field mapping is the same as gen-ticket-sql.mjs:
 *   ticket_no <- TicketNo            status <- StatusDesc
 *   warranty <- WarrantyType         manufacturer <- MfgAbbName
 *   account <- MfgName               account_no <- AccountNo
 *   ticket_source / claim_company <- "NSA" for NSA rows, else MfgName (or RefType)
 *   product_type <- Product          model / model_version / serial <- ModelCode / ModelVersion / SerialNo
 *   technician <- TechName           location <- LocationName (or Branch)
 *   schedule_date <- ScheduleDate    call_received_date <- CreateTime (or PostingDate)
 *   problem_description <- SymptomByCx   internal_note <- NoteInternal
 *   diagnosed <- DiagnosedYn         redo <- Redo   aging <- Aging   calls <- nCallAttempt
 *   customer_pref <- CxPreferredDate present
 *   customer <- CxUserName / CxAddress1/2 / CxCity / CxState / CxZipCode / CxEmail / phones
 *
 * Skipped (never inserted): no TicketNo, a ticket number already in the
 * system, or a ticket number repeated later in the same file.
 */
import * as XLSX from "xlsx";
import { supabase } from "./client";
import { invalidateCompanyTicketsCache } from "./tickets";

export type ImportRow = Record<string, string>;

export type ImportOutcome =
  | { kind: "added"; ticketNo: string }
  | { kind: "skipped"; ticketNo: string; reason: "exists" | "duplicate-in-file" | "missing-ticket-no"; line: number }
  | { kind: "failed"; ticketNo: string; error: string };

export interface ImportSummary {
  totalRows: number;
  added: string[];
  skippedExisting: string[];
  skippedDuplicate: string[];
  skippedMissing: number[]; // spreadsheet line numbers
  failed: { ticketNo: string; error: string }[];
}

/** Same CSV rules as gen-ticket-sql.mjs: only a quote at the start of a field opens a quoted field (stray quotes inside CSR notes are literal). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"' && field.length === 0) inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r[0] && r[0].trim() !== ""));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Excel cell → text. Real date cells become "DD/MM/YYYY HH:mm" so they parse the same as the CSV export's text dates. */
function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    return `${pad(v.getDate())}/${pad(v.getMonth() + 1)}/${v.getFullYear()} ${pad(v.getHours())}:${pad(v.getMinutes())}`;
  }
  return String(v);
}

/** Reads the uploaded file into header-keyed rows. */
export async function readImportFile(file: File): Promise<ImportRow[]> {
  let table: string[][];
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    table = parseCsv(await file.text());
  } else {
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
    table = raw.map((r) => r.map(cellText));
  }
  if (table.length === 0) return [];
  const header = table[0].map((h) => h.trim().replace(/^﻿/, ""));
  return table.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** True when the file has the ServicePower export's key columns. */
export function looksLikeTicketExport(rows: ImportRow[]): boolean {
  if (rows.length === 0) return false;
  const cols = Object.keys(rows[0]);
  return ["TicketNo", "StatusDesc", "CxUserName"].every((c) => cols.includes(c));
}

/** "22/09/2026 00:00" → "2026-09-22" (the export is day-first). */
function ddmmyyyyToIso(v: string): string | null {
  const m = (v || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

const int = (v: string) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

function toRecords(r: ImportRow) {
  const get = (c: string) => (r[c] ?? "").trim();
  const name = get("CxUserName");
  const account = get("MfgName");
  const refType = get("RefType");
  const ticketSource = refType === "NSA" ? "NSA" : account || refType || null;
  const callReceived = ddmmyyyyToIso(get("CreateTime")) || ddmmyyyyToIso(get("PostingDate"));
  const customer = {
    first_name: name.split(/\s+/)[0] || "",
    last_name: name.split(/\s+/).slice(1).join(" "),
    full_name: name,
    phone: get("CxPhone") || get("CxCellPhone") || get("CxHomePhone"),
    second_phone: get("CxCellPhone2") || get("CxCellPhone"),
    email: get("CxEmail"),
    address: get("CxAddress1"),
    address2: get("CxAddress2"),
    city: get("CxCity"),
    state: get("CxState"),
    zip: get("CxZipCode"),
  };
  const ticket = {
    ticket_no: get("TicketNo"),
    ticket_source: ticketSource,
    claim_company: ticketSource,
    warranty: get("WarrantyType") || null,
    manufacturer: get("MfgAbbName") || null,
    account: account || null,
    account_no: get("AccountNo") || null,
    model: get("ModelCode") || null,
    model_version: get("ModelVersion") || null,
    serial: get("SerialNo") || null,
    product_type: get("Product") || null,
    status: get("StatusDesc") || "CSR-Needs Scheduling",
    redo: /^y/i.test(get("Redo")),
    schedule_date: ddmmyyyyToIso(get("ScheduleDate")),
    call_received_date: callReceived,
    technician: get("TechName") || null,
    location: get("LocationName") || get("Branch") || null,
    problem_description: get("SymptomByCx") || null,
    internal_note: get("NoteInternal") || null,
    diagnosed: /^y/i.test(get("DiagnosedYn")),
    aging: int(get("Aging")),
    calls: int(get("nCallAttempt")),
    customer_pref: !!get("CxPreferredDate"),
    created_at: callReceived ? new Date(`${callReceived}T12:00:00`).toISOString() : new Date().toISOString(),
  };
  return { customer, ticket };
}

/** Ticket numbers (from `ticketNos`) that already exist in the signed-in company. */
async function existingTicketNos(ticketNos: string[]): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < ticketNos.length; i += 200) {
    const { data, error } = await supabase.from("tickets").select("ticket_no").in("ticket_no", ticketNos.slice(i, i + 200));
    if (error) throw new Error(`Couldn't check existing tickets: ${error.message}`);
    for (const r of data ?? []) found.add(r.ticket_no);
  }
  return found;
}

async function insertOne(rec: ReturnType<typeof toRecords>): Promise<ImportOutcome> {
  const ticketNo = rec.ticket.ticket_no;
  const { data: cust, error: custErr } = await supabase.from("customers").insert(rec.customer).select("id").single();
  if (custErr) return { kind: "failed", ticketNo, error: `Customer: ${custErr.message}` };
  const { error } = await supabase.from("tickets").insert({ ...rec.ticket, customer_id: cust.id });
  if (error) {
    // Don't leave an orphan customer behind.
    await supabase.from("customers").delete().eq("id", cust.id);
    if (error.code === "23505") return { kind: "skipped", ticketNo, reason: "exists", line: 0 };
    return { kind: "failed", ticketNo, error: error.message };
  }
  return { kind: "added", ticketNo };
}

/**
 * Imports every row. `onProgress(done, total)` fires as tickets are written.
 * Rows are written a few at a time (not one giant insert) so one bad row only
 * fails itself.
 */
export async function importTickets(rows: ImportRow[], onProgress?: (done: number, total: number) => void): Promise<ImportSummary> {
  const summary: ImportSummary = { totalRows: rows.length, added: [], skippedExisting: [], skippedDuplicate: [], skippedMissing: [], failed: [] };

  const seen = new Set<string>();
  const toInsert: ReturnType<typeof toRecords>[] = [];
  rows.forEach((r, i) => {
    const rec = toRecords(r);
    const no = rec.ticket.ticket_no;
    if (!no) {
      summary.skippedMissing.push(i + 2); // +1 header, +1 one-based
      return;
    }
    if (seen.has(no)) {
      summary.skippedDuplicate.push(no);
      return;
    }
    seen.add(no);
    toInsert.push(rec);
  });

  const existing = await existingTicketNos(toInsert.map((r) => r.ticket.ticket_no));
  const fresh = toInsert.filter((r) => {
    if (existing.has(r.ticket.ticket_no)) {
      summary.skippedExisting.push(r.ticket.ticket_no);
      return false;
    }
    return true;
  });

  let done = 0;
  onProgress?.(0, fresh.length);
  const POOL = 4;
  for (let i = 0; i < fresh.length; i += POOL) {
    const results = await Promise.all(fresh.slice(i, i + POOL).map(insertOne));
    for (const res of results) {
      if (res.kind === "added") summary.added.push(res.ticketNo);
      else if (res.kind === "skipped") summary.skippedExisting.push(res.ticketNo);
      else if (res.kind === "failed") summary.failed.push({ ticketNo: res.ticketNo, error: res.error });
    }
    done += results.length;
    onProgress?.(done, fresh.length);
  }

  if (summary.added.length > 0) invalidateCompanyTicketsCache();
  return summary;
}
