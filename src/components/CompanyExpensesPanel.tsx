/**
 * Expenses → Flash Tech → Other Expenses: company expenses from the bank
 * accounts (migration 0479) — not tied to an employee. Add Expense takes
 * Amount · Date · Category · Branch (Company, a branch or a state) · Memo ·
 * Account; Import Excel reads Finance's "AHS Expenses" workbook (one sheet
 * per bank account). The page's date range drives everything here.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Building2, DollarSign, Download, FileSpreadsheet, FileText, Loader2, Paperclip, Pencil, Receipt, Trash2, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import {
  COMPANY_BRANCH,
  COMPANY_EXPENSE_BRANCHES,
  COMPANY_EXPENSE_CATEGORIES,
  COMPANY_EXPENSE_STATES,
  markAlreadySaved,
  MAX_COMPANY_EXPENSE_FILES,
  normalizeCategory,
  parseExpenseSheet,
  type CompanyExpense,
  type CompanyExpenseFile,
  type ImportRow,
} from "@/lib/companyExpenses";
import { addCompanyExpense, deleteCompanyExpense, importCompanyExpenses, setCompanyExpenseReceipts, updateCompanyExpense } from "@/lib/supabase/companyExpenses";
import { deleteExpenseReceiptFile, uploadExpenseReceipt } from "@/lib/firebase/storage";
import { ReceiptLightbox, isPdfReceipt } from "@/components/ReceiptLightbox";
import { useAuth } from "@/lib/auth";
import { todayISO } from "@/lib/localDate";

const fmtMoney = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDay = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const sum = (rows: CompanyExpense[]) => rows.reduce((s, r) => s + r.amount, 0);

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic)$/i;
/** One attachment as a small square: the photo, or a PDF / file icon. */
function FileThumb({ url, name, onClick, size = "h-8 w-8" }: { url: string; name?: string; onClick?: () => void; size?: string }) {
  const pdf = isPdfReceipt(url) || /\.pdf$/i.test(name ?? "");
  const image = !pdf && (IMAGE_EXT.test(name ?? "") || IMAGE_EXT.test(decodeURIComponent(url.split("?")[0])));
  return (
    <button type="button" onClick={onClick} title={name || "Open"} className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded border border-white/15 bg-slate-800 hover:border-blue-400`}>
      {image ? <img src={url} alt={name || "Receipt"} className="h-full w-full object-cover" /> : <FileText className="h-4 w-4 text-slate-300" />}
    </button>
  );
}

export function CompanyExpensesPanel({
  rows,
  loading,
  loadError,
  reload,
  dateFrom,
  dateTo,
  rangeLabel,
  canEdit,
}: {
  rows: CompanyExpense[];
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void> | void;
  dateFrom: string;
  dateTo: string;
  rangeLabel: string;
  canEdit: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [branch, setBranch] = useState("");
  const [account, setAccount] = useState("");
  const [form, setForm] = useState<{ editing: CompanyExpense | null } | null>(null);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; urls: string[] } | null>(null);

  const inRange = useMemo(
    () => rows.filter((r) => (!dateFrom || r.expenseDate >= dateFrom) && (!dateTo || r.expenseDate <= dateTo)),
    [rows, dateFrom, dateTo]
  );
  const accounts = useMemo(() => [...new Set(rows.map((r) => r.account).filter(Boolean))].sort(), [rows]);
  const categories = useMemo(() => [...new Set(inRange.map((r) => r.category))].sort(), [inRange]);
  const branches = useMemo(() => [...new Set(inRange.map((r) => r.branch))].sort((a, b) => (a === COMPANY_BRANCH ? -1 : b === COMPANY_BRANCH ? 1 : a.localeCompare(b))), [inRange]);

  const q = search.trim().toLowerCase();
  const shown = inRange.filter(
    (r) =>
      (!category || r.category === category) &&
      (!branch || r.branch === branch) &&
      (!account || r.account === account) &&
      (!q || [r.category, r.branch, r.memo, r.account, r.expenseDate, r.amount.toFixed(2), r.createdByName ?? ""].some((v) => v.toLowerCase().includes(q)))
  );
  const total = sum(shown);
  const credits = shown.filter((r) => r.amount < 0);
  const largest = shown.reduce<CompanyExpense | null>((m, r) => (!m || r.amount > m.amount ? r : m), null);

  // Spend by category / branch — from the rows shown, but ignoring that dimension's own filter, so a click can switch.
  const spendBy = (pick: (r: CompanyExpense) => string, ignore: "category" | "branch") => {
    const m = new Map<string, { amount: number; count: number }>();
    for (const r of inRange) {
      if (ignore !== "category" && category && r.category !== category) continue;
      if (ignore !== "branch" && branch && r.branch !== branch) continue;
      if (account && r.account !== account) continue;
      const k = pick(r);
      const v = m.get(k) ?? { amount: 0, count: 0 };
      v.amount += r.amount;
      v.count++;
      m.set(k, v);
    }
    return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount);
  };
  const byCategory = spendBy((r) => r.category, "category");
  const byBranch = spendBy((r) => r.branch, "branch");

  const remove = async (r: CompanyExpense) => {
    if (!confirm(`Delete ${fmtMoney(r.amount)} ${r.category}${r.memo ? ` — ${r.memo}` : ""} (${fmtDay(r.expenseDate)})?`)) return;
    setDeletingId(r.id);
    try {
      await deleteCompanyExpense(r.id);
      for (const f of r.receipts) if (f.path) void deleteExpenseReceiptFile(f.path).catch(() => {});
      toast.success("Expense deleted");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = () => {
    const qv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [["Date", "Amount", "Category", "Branch", "Memo", "Account", "Added By"], ...shown.map((r) => [r.expenseDate, r.amount.toFixed(2), r.category, r.branch, r.memo, r.account, r.createdByName ?? ""])];
    const el = document.createElement("a");
    el.href = "data:text/csv;charset=utf-8," + encodeURIComponent(String.fromCharCode(0xfeff) + lines.map((l) => l.map(qv).join(",")).join("\n"));
    el.download = `other-expenses_${dateFrom || "all"}_to_${dateTo || "all"}.csv`;
    document.body.appendChild(el);
    el.click();
    el.remove();
  };

  const filterLabel = [category, branch, account].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {loadError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Spend", value: fmtMoney(total), sub: `${rangeLabel}${filterLabel ? ` · ${filterLabel}` : ""}`, Icon: DollarSign, tone: "border-violet-500/30 text-violet-200 bg-violet-500/15" },
          { label: "Records", value: shown.length.toLocaleString(), sub: `${new Set(shown.map((r) => r.category)).size} categories · ${new Set(shown.map((r) => r.branch)).size} branches`, Icon: Receipt, tone: "border-sky-500/30 text-sky-200 bg-sky-500/15" },
          { label: "Credits / Refunds", value: fmtMoney(-sum(credits)), sub: `${credits.length} line${credits.length === 1 ? "" : "s"} — taken off the total`, Icon: TrendingUp, tone: "border-emerald-500/30 text-emerald-200 bg-emerald-500/15" },
          { label: "Largest", value: largest ? fmtMoney(largest.amount) : "—", sub: largest ? `${largest.memo || largest.category} · ${fmtDay(largest.expenseDate)}` : "No records", Icon: Building2, tone: "border-amber-500/30 text-amber-200 bg-amber-500/15" },
        ].map(({ label, value, sub, Icon, tone }) => (
          <div key={label} className={`rounded-xl border bg-slate-900/60 p-4 ${tone.split(" ")[0]}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.split(" ").slice(1).join(" ")}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">{loading ? "…" : value}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500" title={sub}>{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && inRange.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {([["Spend by category", byCategory, category, setCategory], ["Spend by branch", byBranch, branch, setBranch]] as const).map(([title, list, current, set]) => {
            const max = Math.max(0, ...list.map((x) => x.amount));
            return (
              <div key={title} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-500">{current ? "Click it again to show all" : "Click one to see only its expenses"}</p>
                </div>
                <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
                  {list.map((x) => {
                    const on = current === x.name;
                    return (
                      <button
                        key={x.name}
                        type="button"
                        onClick={() => set(on ? "" : x.name)}
                        aria-pressed={on}
                        className={`group grid w-full grid-cols-[10rem_1fr_8.5rem] items-center gap-3 rounded-md px-2 py-1 text-left text-xs transition ${on ? "bg-blue-500/15 ring-1 ring-blue-500/40" : "hover:bg-white/5"}`}
                      >
                        <span className={`truncate ${on ? "font-semibold text-white" : "text-slate-300"}`} title={x.name}>{x.name}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-white/5">
                          <span className={`block h-full rounded-full ${on ? "bg-blue-400" : "bg-blue-500/60 group-hover:bg-blue-400/80"}`} style={{ width: `${max > 0 ? Math.max(2, (Math.max(0, x.amount) / max) * 100) : 2}%` }} />
                        </span>
                        <span className="text-right tabular-nums text-slate-200">
                          {fmtMoney(x.amount)} <span className="text-slate-500">· {x.count}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search — category, branch, memo, account, amount, date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-slate-800/50 p-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          {([["Category", "All categories", category, setCategory, categories], ["Branch", "All branches", branch, setBranch, branches], ["Account", "All accounts", account, setAccount, accounts]] as const).map(([label, all, value, set, opts]) => (
            <select key={label} aria-label={label} value={value} onChange={(e) => set(e.target.value)} className="rounded-lg border border-white/10 bg-slate-800/50 px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">{all}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={exportCsv} disabled={shown.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          {canEdit && (
            <>
              <button type="button" onClick={() => setImporting(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
                <FileSpreadsheet className="h-4 w-4" /> Import Excel
              </button>
              <button type="button" onClick={() => setForm({ editing: null })} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                + Add Expense
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto rounded-lg border border-white/10 bg-slate-900/50 p-4">
        <h2 className="mb-3 text-lg font-bold text-white">Other Expenses</h2>
        <table className="w-full min-w-max text-xs">
          <thead>
            <tr className="border-b border-white/10 text-left uppercase text-slate-400">
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2 text-right">Amount</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Branch</th>
              <th className="px-2 py-2">Memo</th>
              <th className="px-2 py-2">Account</th>
              <th className="px-2 py-2">Receipt</th>
              <th className="px-2 py-2">Added By</th>
              {canEdit && <th className="px-2 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-2 py-8 text-center text-slate-400"><Loader2 className="inline h-4 w-4 animate-spin" /></td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={9} className="px-2 py-8 text-center text-slate-400">{rows.length === 0 ? "No other expenses yet — use + Add Expense or Import Excel." : "No expenses match these filters."}</td></tr>
            ) : (
              shown.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-300">{fmtDay(r.expenseDate)}</td>
                  <td className={`whitespace-nowrap px-2 py-1.5 text-right font-semibold tabular-nums ${r.amount < 0 ? "text-emerald-300" : "text-white"}`} title={r.amount < 0 ? "Credit / refund — taken off the total" : undefined}>{fmtMoney(r.amount)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-200">{r.category}</td>
                  <td className={`whitespace-nowrap px-2 py-1.5 ${r.branch === COMPANY_BRANCH ? "text-slate-400" : "text-slate-200"}`}>{r.branch}</td>
                  <td className="max-w-[22rem] truncate px-2 py-1.5 text-slate-300" title={r.memo}>{r.memo || "—"}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-slate-400">{r.account || "—"}</td>
                  <td className="px-2 py-1.5">
                    {r.receipts.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {r.receipts.slice(0, 3).map((f) => (
                          <FileThumb key={f.url} url={f.url} name={f.name} onClick={() => setPreview({ url: f.url, urls: r.receipts.map((x) => x.url) })} />
                        ))}
                        {r.receipts.length > 3 && <span className="text-[10px] text-slate-400">+{r.receipts.length - 3}</span>}
                      </div>
                    ) : canEdit ? (
                      <button type="button" onClick={() => setForm({ editing: r })} className="inline-flex items-center gap-1 rounded border border-dashed border-white/20 px-1.5 py-1 text-[10px] text-slate-400 hover:border-blue-400 hover:text-blue-300" title="Attach photos or PDFs">
                        <Paperclip className="h-3 w-3" /> Attach
                      </button>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-slate-400" title={r.importSource ? `Imported from ${r.importSource}` : undefined}>
                    {r.createdByName || "—"}{r.importSource && <span className="ml-1 rounded bg-emerald-500/15 px-1 py-0.5 text-[10px] text-emerald-300">Imported</span>}
                  </td>
                  {canEdit && (
                    <td className="whitespace-nowrap px-2 py-1.5 text-right">
                      <button type="button" onClick={() => setForm({ editing: r })} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => void remove(r)} disabled={deletingId === r.id} className="rounded p-1 text-slate-400 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-50" title="Delete">
                        {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {!loading && shown.length > 0 && (
            <tfoot>
              <tr className="border-t border-white/10 font-semibold text-white">
                <td className="px-2 py-2">Total · {shown.length}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmtMoney(total)}</td>
                <td colSpan={7} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {form && (
        <CompanyExpenseForm
          editing={form.editing}
          accounts={accounts}
          extraCategories={[...new Set(rows.map((r) => r.category))]}
          onClose={() => setForm(null)}
          onSaved={async () => { setForm(null); await reload(); }}
        />
      )}
      {preview && <ReceiptLightbox url={preview.url} urls={preview.urls} onClose={() => setPreview(null)} />}
      {importing && <CompanyExpenseImport saved={rows} onClose={() => setImporting(false)} onSaved={async () => { setImporting(false); await reload(); }} />}
    </div>
  );
}

const OTHER = "__other__";
const inputCls = "w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none";

function CompanyExpenseForm({ editing, accounts, extraCategories, onClose, onSaved }: {
  editing: CompanyExpense | null;
  accounts: string[];
  extraCategories: string[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const categoryList = useMemo(
    () => [...new Set([...COMPANY_EXPENSE_CATEGORIES, ...extraCategories.filter(Boolean)])].sort((a, b) => a.localeCompare(b)),
    [extraCategories]
  );
  const known = new Set([COMPANY_BRANCH, ...COMPANY_EXPENSE_BRANCHES, ...COMPANY_EXPENSE_STATES]);
  const [amount, setAmount] = useState(editing ? Math.abs(editing.amount).toFixed(2) : "");
  const [credit, setCredit] = useState(!!editing && editing.amount < 0);
  const [date, setDate] = useState(editing?.expenseDate || todayISO());
  const [categoryPick, setCategoryPick] = useState(editing?.category ?? "");
  const [categoryOther, setCategoryOther] = useState("");
  const [branch, setBranch] = useState(editing?.branch ?? COMPANY_BRANCH);
  const [memo, setMemo] = useState(editing?.memo ?? "");
  const [account, setAccount] = useState(editing?.account ?? "");
  const { companyId } = useAuth();
  /** Files already saved on it (minus any removed here) and new ones picked, uploaded on Save. */
  const [kept, setKept] = useState<CompanyExpenseFile[]>(editing?.receipts ?? []);
  const [picked, setPicked] = useState<{ file: File; url: string }[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileCount = kept.length + picked.length;
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_COMPANY_EXPENSE_FILES - fileCount;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > list.length) setError(`Up to ${MAX_COMPANY_EXPENSE_FILES} files per expense.`);
    setPicked((p) => [...p, ...list.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const save = async () => {
    const n = Number(amount.replace(/[$,\s]/g, ""));
    const category = categoryPick === OTHER ? normalizeCategory(categoryOther) : categoryPick;
    if (!isFinite(n) || n <= 0) return setError("Enter the amount.");
    if (!date) return setError("Pick the date.");
    if (!category) return setError("Pick a category.");
    setSaving(true);
    setError(null);
    try {
      const input = { amount: credit ? -n : n, expenseDate: date, category, branch: branch || COMPANY_BRANCH, memo, account };
      let id = editing?.id ?? "";
      if (editing) await updateCompanyExpense(editing.id, input);
      else id = await addCompanyExpense(input);
      const removed = (editing?.receipts ?? []).filter((f) => !kept.some((k) => k.url === f.url));
      if (picked.length > 0 || removed.length > 0) {
        if (picked.length > 0 && !companyId) throw new Error("Couldn't attach the files - no company on this sign-in.");
        const uploaded: CompanyExpenseFile[] = [];
        try {
          for (const p of picked) {
            const r = await uploadExpenseReceipt(companyId!, `company-${id}`, p.file);
            uploaded.push({ url: r.url, path: r.fullPath, name: p.file.name });
          }
        } finally {
          // Save whatever made it up, even if one upload failed.
          await setCompanyExpenseReceipts(id, [...kept, ...uploaded]);
        }
        for (const f of removed) if (f.path) void deleteExpenseReceiptFile(f.path).catch(() => {});
      }
      toast.success(editing ? "Expense updated" : "Expense added");
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{editing ? "Edit Expense" : "Add Expense"}</h3>
          <button type="button" onClick={onClose} disabled={saving} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-300">
            Amount
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,$]/g, ""))} placeholder="0.00" className={`${inputCls} mt-1`} autoFocus />
            <span className="mt-1 flex items-center gap-1.5 font-normal text-slate-400">
              <input type="checkbox" checked={credit} onChange={(e) => setCredit(e.target.checked)} /> Credit / refund (taken off the total)
            </span>
          </label>
          <label className="block text-xs font-semibold text-slate-300">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} mt-1 [color-scheme:dark]`} />
          </label>
          <label className="block text-xs font-semibold text-slate-300 sm:col-span-2">
            Category
            <select value={categoryPick} onChange={(e) => setCategoryPick(e.target.value)} className={`${inputCls} mt-1`}>
              <option value="">Pick a category…</option>
              {categoryList.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={OTHER}>Other (type it)…</option>
            </select>
            {categoryPick === OTHER && <input value={categoryOther} onChange={(e) => setCategoryOther(e.target.value)} placeholder="New category" className={`${inputCls} mt-2`} />}
          </label>
          <label className="block text-xs font-semibold text-slate-300 sm:col-span-2">
            Branch
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className={`${inputCls} mt-1`}>
              <option value={COMPANY_BRANCH}>Company (company-wide)</option>
              {!known.has(branch) && branch && <option value={branch}>{branch} (as saved)</option>}
              <optgroup label="Branches">
                {COMPANY_EXPENSE_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </optgroup>
              <optgroup label="States">
                {COMPANY_EXPENSE_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-300 sm:col-span-2">
            Memo
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="e.g. Lease Expense, Utility Expense, IRS Federal Tax" className={`${inputCls} mt-1`} />
          </label>
          <div className="block text-xs font-semibold text-slate-300 sm:col-span-2">
            Attachments <span className="font-normal text-slate-500">(optional - receipts, bills, photos or PDFs; up to {MAX_COMPANY_EXPENSE_FILES})</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {kept.map((f) => (
                <span key={f.url} className="relative">
                  <FileThumb url={f.url} name={f.name} size="h-14 w-14" onClick={() => setLightbox(f.url)} />
                  <button type="button" onClick={() => setKept((k) => k.filter((x) => x.url !== f.url))} disabled={saving} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-500" title="Remove"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {picked.map((p) => (
                <span key={p.url} className="relative">
                  <FileThumb url={p.url} name={p.file.name} size="h-14 w-14" onClick={() => window.open(p.url, "_blank")} />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b bg-blue-600/80 text-center text-[9px] font-semibold text-white">New</span>
                  <button type="button" onClick={() => setPicked((x) => x.filter((y) => y.url !== p.url))} disabled={saving} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-500" title="Remove"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {fileCount < MAX_COMPANY_EXPENSE_FILES && (
                <label className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded border border-dashed border-white/25 text-[10px] font-normal text-slate-400 hover:border-blue-400 hover:text-blue-300">
                  <Paperclip className="h-4 w-4" /> Attach
                  <input type="file" accept="image/*,application/pdf" multiple className="sr-only" disabled={saving} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>
          <label className="block text-xs font-semibold text-slate-300 sm:col-span-2">
            Account <span className="font-normal text-slate-500">(optional — the bank account it was paid from)</span>
            <input value={account} onChange={(e) => setAccount(e.target.value)} list="company-expense-accounts" placeholder="e.g. 3510" maxLength={20} className={`${inputCls} mt-1`} />
            <datalist id="company-expense-accounts">{accounts.map((a) => <option key={a} value={a} />)}</datalist>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Cancel</button>
          <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving && picked.length > 0 ? "Uploading…" : editing ? "Save" : "Add Expense"}
          </button>
        </div>
      </div>
      {lightbox && <ReceiptLightbox url={lightbox} urls={kept.map((f) => f.url)} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function CompanyExpenseImport({ saved, onClose, onSaved }: { saved: CompanyExpense[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ row: ImportRow; alreadySaved: boolean }[] | null>(null);
  const [sheetsSkipped, setSheetsSkipped] = useState<string[]>([]);
  const [saving, setSaving] = useState<number | null>(null);

  const read = async (f: File) => {
    setFile(f);
    setParsed(null);
    setReadError(null);
    setReading(true);
    try {
      const XLSX = await import("xlsx");
      // Dates stay Excel day numbers (no cellDates) so the day never shifts with the browser's time zone.
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const all: ImportRow[] = [];
      const skipped: string[] = [];
      for (const name of wb.SheetNames) {
        const rows = parseExpenseSheet(name, XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: null, raw: true }));
        if (rows) all.push(...rows); else skipped.push(name);
      }
      if (all.length === 0) throw new Error("No expense rows found — each sheet needs a header row with Amount, Date, Category, Branch and Memo.");
      setSheetsSkipped(skipped);
      setParsed(markAlreadySaved(all, saved));
    } catch (e) {
      setReadError(e instanceof Error ? e.message : String(e));
    } finally {
      setReading(false);
    }
  };

  const toAdd = (parsed ?? []).filter((p) => !p.alreadySaved && p.row.problems.length === 0);
  const already = (parsed ?? []).filter((p) => p.alreadySaved).length;
  const problems = (parsed ?? []).filter((p) => p.row.problems.length > 0).length;
  const unplaced = (parsed ?? []).filter((p) => !p.row.branchMatched).length;
  const bySheet = useMemo(() => {
    const m = new Map<string, { count: number; amount: number; account: string; period: string }>();
    for (const p of toAdd) {
      const v = m.get(p.row.sheet) ?? { count: 0, amount: 0, account: p.row.account, period: p.row.period };
      v.count++;
      v.amount += p.row.amount;
      m.set(p.row.sheet, v);
    }
    return [...m.entries()];
  }, [toAdd]);

  const save = async () => {
    if (!file || toAdd.length === 0) return;
    setSaving(0);
    try {
      const n = await importCompanyExpenses(toAdd.map((p) => p.row), file.name, setSaving);
      toast.success(`${n} expense${n === 1 ? "" : "s"} imported`);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && saving == null) onClose(); }}>
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Import Other Expenses</h3>
            <p className="text-xs text-slate-400">
              Finance's expenses workbook (.xlsx): one sheet per bank account, columns <span className="text-slate-200">Amount · Date · Category · Branch · Memo</span>. Each sheet's name is its statement period and account (<span className="text-slate-200">101-1115 3510</span> = 10/1 – 11/15, account <span className="text-slate-200">3510</span>); the 4-digit account is saved. Negative amounts are spending; positive ones are saved as credits. Blank Branch = Company. Lines already saved are skipped.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving != null} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 bg-slate-800/40 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/70">
            <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
            <span>{file ? file.name : "Choose the workbook…"}</span>
            {reading && <Loader2 className="h-4 w-4 animate-spin" />}
            <input type="file" accept=".xlsx,.xls" className="sr-only" disabled={saving != null} onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ""; }} />
          </label>
          {readError && <p className="mt-3 text-sm text-red-300">{readError}</p>}

          {parsed && (
            <>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-blue-500/15 px-2 py-1 font-semibold text-blue-200">{toAdd.length} to add · {fmtMoney(toAdd.reduce((s, p) => s + p.row.amount, 0))}</span>
                {already > 0 && <span className="rounded-md bg-slate-700/60 px-2 py-1 text-slate-300">{already} already saved — skipped</span>}
                {problems > 0 && <span className="rounded-md bg-red-500/15 px-2 py-1 text-red-200">{problems} missing amount or date — skipped</span>}
                {unplaced > 0 && <span className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-200">{unplaced} branch{unplaced === 1 ? "" : "es"} not recognised — saved as typed</span>}
                {sheetsSkipped.length > 0 && <span className="rounded-md bg-slate-700/60 px-2 py-1 text-slate-300">Sheets without the columns, skipped: {sheetsSkipped.join(", ")}</span>}
              </div>
              {bySheet.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {bySheet.map(([s, v]) => (
                    <span key={s} className="rounded border border-white/10 px-2 py-0.5" title={`Sheet "${s}"`}>
                      Account <span className="font-semibold text-slate-200">{v.account}</span>{v.period ? ` · ${v.period}` : ""}: {v.count} · {fmtMoney(v.amount)}
                    </span>
                  ))}
                </div>
              )}
              <table className="mt-3 w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-left uppercase text-slate-400">
                    <th className="px-2 py-1.5">Account</th>
                    <th className="px-2 py-1.5">Row</th>
                    <th className="px-2 py-1.5">Date</th>
                    <th className="px-2 py-1.5 text-right">Amount</th>
                    <th className="px-2 py-1.5">Category</th>
                    <th className="px-2 py-1.5">Branch</th>
                    <th className="px-2 py-1.5">Memo</th>
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {parsed.map(({ row: r, alreadySaved }) => {
                    const skip = alreadySaved || r.problems.length > 0;
                    return (
                      <tr key={`${r.sheet}|${r.rowNumber}`} className={`border-b border-white/5 ${skip ? "opacity-45" : ""}`}>
                        <td className="whitespace-nowrap px-2 py-1 text-slate-400">{r.account}</td>
                        <td className="px-2 py-1 tabular-nums text-slate-500">{r.rowNumber}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-slate-300">{r.expenseDate ? fmtDay(r.expenseDate) : "—"}</td>
                        <td className={`whitespace-nowrap px-2 py-1 text-right tabular-nums ${r.amount < 0 ? "text-emerald-300" : "text-white"}`}>{fmtMoney(r.amount)}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-slate-200">{r.category}</td>
                        <td className={`whitespace-nowrap px-2 py-1 ${r.branchMatched ? "text-slate-200" : "text-amber-300"}`} title={r.branchTyped ? `Typed: ${r.branchTyped}` : undefined}>
                          {r.branch}{r.branchTyped && r.branchMatched && <span className="ml-1 text-[10px] text-slate-500">(was {r.branchTyped})</span>}
                        </td>
                        <td className="max-w-[16rem] truncate px-2 py-1 text-slate-300" title={r.memo}>{r.memo}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-[10px]">
                          {alreadySaved ? <span className="text-slate-400">Already saved</span> : r.problems.length > 0 ? <span className="text-red-300">{r.problems.join(", ")}</span> : !r.branchMatched ? <span className="text-amber-300">Check branch</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 p-4">
          <button type="button" onClick={onClose} disabled={saving != null} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Cancel</button>
          <button type="button" onClick={() => void save()} disabled={saving != null || toAdd.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
            {saving != null && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving != null ? `Saving ${saving} / ${toAdd.length}…` : `Import ${toAdd.length} expense${toAdd.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
