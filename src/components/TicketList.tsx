import { useState, useMemo, useEffect, useCallback } from "react";
import { lookupZip } from "@/lib/zipCoverage";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Clock, History, X, User, Columns3, Filter, Search } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import { LOCATIONS, mergeLocationOptions } from "@/lib/locations";
import { 
  TICKET_SOURCES, 
  REPAIR_STATUS_OPTIONS, 
  type Ticket 
} from "@/lib/ticketData";
import { getCompanyTickets } from "@/lib/supabase/tickets";
import { ServicePowerSyncButton } from "@/components/ServicePowerSyncButton";

// Use the centralized Ticket interface
interface TicketItem extends Ticket {}

// All toggleable columns in the ticket list table. `key` is used for the
// visibility map + localStorage; `label` is the header text.
const TICKET_COLUMNS = [
  { key: "ticketNo", label: "Ticket No" },
  { key: "warranty", label: "Wty" },
  { key: "ticketSource", label: "Ticket Source" },
  { key: "customer", label: "Cx Name" },
  { key: "city", label: "City" },
  { key: "location", label: "Loc" },
  { key: "product", label: "Product" },
  { key: "model", label: "Model" },
  { key: "internalNote", label: "Internal Note" },
  { key: "repair", label: "Repair" },
  { key: "technician", label: "Technician" },
  { key: "customerPref", label: "Cx Prefer" },
  { key: "schedule", label: "Schedule" },
  { key: "status", label: "Status" },
  { key: "phone", label: "Phone" },
  { key: "redo", label: "Redo" },
  { key: "aging", label: "Aging" },
  { key: "statusSpend", label: "Status Spend" },
  { key: "calls", label: "Calls" },
  { key: "partOrder", label: "Part Order" },
  { key: "posting", label: "Posting" },
] as const;

type TicketColumnKey = (typeof TICKET_COLUMNS)[number]["key"];

const COLUMN_VISIBILITY_KEY = "ahs:ticket-list:visible-columns";

function loadVisibleColumns(): Record<string, boolean> {
  const allVisible = Object.fromEntries(TICKET_COLUMNS.map((c) => [c.key, true]));
  try {
    const raw = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (!raw) return allVisible;
    const saved = JSON.parse(raw) as Record<string, boolean>;
    // Merge so newly added columns default to visible.
    return { ...allVisible, ...saved };
  } catch {
    return allVisible;
  }
}

// Use centralized TICKET_SOURCES and REPAIR_STATUS_OPTIONS from ticketData.ts
const LOCATION_STORAGE_KEY = "ahs:location-management:locations";
const STATUS_LOG_KEY = "ahs:ticket:status-log";
const TICKET_VISITS_KEY = "ahs:ticket:visits"; // Track who visited which tickets

// Compact acronym for the Wty column (mirrors ticket detail header ribbon).
//   In warranty -> IW, Out-of-warranty -> OOW, Service Contract -> SC, etc.
// If the value already looks like a short acronym (<= 4 upper-case chars) we
// pass it through unchanged.
function warrantyAcronym(value: string | null | undefined): string {
  const v = (value || "").trim();
  if (!v) return "";
  if (v.length <= 4 && v === v.toUpperCase()) return v;
  const lower = v.toLowerCase();
  if (lower === "in warranty") return "IW";
  if (lower.includes("out of warranty") || lower.includes("out-of-warranty")) return "OOW";
  if (lower === "concession l") return "CL";
  if (lower === "concession lp") return "CLP";
  if (lower === "concession p") return "CP";
  if (lower.includes("ext labor")) return "ELW";
  if (lower.includes("ext part")) return "EPW";
  if (lower.includes("ext wty")) return "EW";
  if (lower.includes("labor only")) return "LOW";
  if (lower.includes("part only")) return "POW";
  if (lower.includes("special part")) return "SP5";
  if (lower.includes("service contract")) return "SC";
  if (lower === "unknown") return "UNK";
  return v.toUpperCase();
}

// Per-status color for the Status cell in the ticket list. Falls back to the
// default blue for any status not listed here. Matching is case-insensitive
// and trims whitespace so minor formatting differences still color correctly.
function statusColorClass(status: string): string {
  const key = (status || "").trim().toLowerCase();
  const map: Record<string, string> = {
    "op-waiting for part": "text-yellow-400",
    "op-ready for service": "text-blue-400",
    "csr-left message for cx": "text-green-400",
    "cl-ready to complete": "text-red-400",
    "cl-parts back ordered": "text-slate-100", // "black" — use near-white on dark UI for legibility
  };
  return map[key] ?? "text-blue-300";
}

interface StatusLogEntry {
  ticketNo: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string; // ISO string
  note?: string;
}

interface TicketVisit {
  ticketNo: string;
  visitedBy: string;
  visitedAt: string; // ISO string
}

// Best-effort product/appliance label for a ticket. Uses an explicit
// productType when present, otherwise infers a common appliance from the
// model string (e.g. "dryer", "washer", "refrigerator").
function productLabel(ticket: { productType?: string; model?: string }): string {
  const explicit = (ticket.productType || "").trim();
  if (explicit) return explicit;
  const model = (ticket.model || "").toLowerCase();
  const guesses: Array<[RegExp, string]> = [
    [/dryer/, "Dryer"],
    [/washer|washing/, "Washer"],
    [/refrig|fridge/, "Refrigerator"],
    [/freezer/, "Freezer"],
    [/dishwash/, "Dishwasher"],
    [/range|stove|oven|cooktop/, "Range/Oven"],
    [/microwave/, "Microwave"],
    [/ice\s*maker/, "Ice Maker"],
    [/disposal/, "Disposal"],
    [/water\s*heater/, "Water Heater"],
  ];
  for (const [re, label] of guesses) {
    if (re.test(model)) return label;
  }
  return "—";
}

function loadStatusLog(): StatusLogEntry[] {
  try { return JSON.parse(localStorage.getItem(STATUS_LOG_KEY) || "[]"); }
  catch { return []; }
}

function saveStatusLog(log: StatusLogEntry[]) {
  try { localStorage.setItem(STATUS_LOG_KEY, JSON.stringify(log)); } catch {}
}

function loadTicketVisits(): TicketVisit[] {
  try { return JSON.parse(localStorage.getItem(TICKET_VISITS_KEY) || "[]"); }
  catch { return []; }
}

function saveTicketVisits(visits: TicketVisit[]) {
  try { localStorage.setItem(TICKET_VISITS_KEY, JSON.stringify(visits)); } catch {}
}

function markTicketAsVisited(ticketNo: string, userName: string): void {
  const visits = loadTicketVisits();
  // Check if this user already visited this ticket
  const existingVisit = visits.find(v => v.ticketNo === ticketNo && v.visitedBy === userName);
  if (!existingVisit) {
    visits.push({ ticketNo, visitedBy: userName, visitedAt: new Date().toISOString() });
    saveTicketVisits(visits);
  }
}

function getTicketVisitors(ticketNo: string): string[] {
  const visits = loadTicketVisits();
  return [...new Set(visits.filter(v => v.ticketNo === ticketNo).map(v => v.visitedBy))];
}

function daysAgo(isoString: string): number {
  const d = new Date(isoString);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// Days since a ticket was created (total time the ticket has been open).
// Accepts ISO, MM/DD/YY and MM/DD/YYYY formats.
function daysSinceCreated(created: string | undefined): number {
  if (!created) return 0;
  const raw = String(created).trim();
  let createdDate: Date | null = null;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const mm = parseInt(slash[1], 10) - 1;
    const dd = parseInt(slash[2], 10);
    let yy = parseInt(slash[3], 10);
    if (yy < 100) yy += 2000;
    createdDate = new Date(yy, mm, dd);
  } else {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) createdDate = parsed;
  }
  if (!createdDate || isNaN(createdDate.getTime())) return 0;
  const ms = Date.now() - createdDate.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function loadSavedLocations(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { rows?: Array<{ location?: string }> };
    return Array.isArray(parsed.rows)
      ? parsed.rows.map((row) => row.location?.trim()).filter((value): value is string => Boolean(value))
      : [];
  } catch {
    return [];
  }
}

function parseTicketDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return "";
  const [, month, day, year] = match;
  return `20${year}-${month}-${day}`;
}

function isWithinDateRange(value: string, startDate: string, endDate: string) {
  const normalized = parseTicketDate(value);
  if (!normalized) return false;
  if (startDate && normalized < startDate) return false;
  if (endDate && normalized > endDate) return false;
  return true;
}

// ── Per-column filter dropdown (funnel → search + Select All + checkboxes) ──
function ColumnFilter({
  field, label, options, selected, onChange,
}: {
  field: string;
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visible = useMemo(
    () => options.filter((o) => !search || o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );
  // selected empty = ALL selected (no filter applied)
  const allChecked = selected.size === 0 || selected.size === options.length;
  const active = selected.size > 0 && selected.size < options.length;

  const toggle = (opt: string) => {
    const base = selected.size === 0 ? new Set(options) : new Set(selected);
    if (base.has(opt)) base.delete(opt); else base.add(opt);
    onChange(base.size === options.length ? new Set() : base);
  };
  const toggleAll = () => {
    if (allChecked) onChange(new Set(["__none__"]));
    else onChange(new Set());
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById(`colfilter-${field}`);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, field]);

  return (
    <span id={`colfilter-${field}`} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`ml-1 inline-grid h-4 w-4 place-items-center rounded ${active ? "text-blue-200" : "text-blue-400/60"} hover:text-white`}
        title={`Filter by ${label}`}
      >
        <Filter className="h-3 w-3" fill={active ? "currentColor" : "none"} />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 w-60 rounded-lg border border-white/15 bg-slate-900 shadow-2xl p-2 text-left normal-case">
          <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Filter by {label}</div>
          <div className="relative mb-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded border border-white/15 bg-slate-800 pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            <label className="flex items-center gap-2 px-1 py-1 text-xs text-white cursor-pointer hover:bg-white/5 rounded">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-blue-500 h-3.5 w-3.5" />
              <span className="font-semibold">(Select All)</span>
            </label>
            {visible.map((opt) => {
              const checked = selected.size === 0 || selected.size === options.length || selected.has(opt);
              return (
                <label key={opt} className="flex items-center gap-2 px-1 py-1 text-xs text-slate-200 cursor-pointer hover:bg-white/5 rounded">
                  <input type="checkbox" checked={checked} onChange={() => toggle(opt)} className="accent-blue-500 h-3.5 w-3.5" />
                  <span className="truncate">{opt || "(blank)"}</span>
                </label>
              );
            })}
            {visible.length === 0 && <div className="px-1 py-2 text-xs text-slate-500">No matches</div>}
          </div>
        </div>
      )}
    </span>
  );
}

export function TicketList({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  // Load tickets from Supabase (company-scoped via RLS).
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const reloadTickets = useCallback(async () => {
    try {
      setTicketsLoading(true);
      const rows = await getCompanyTickets();
      setTickets(rows as TicketItem[]);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setTicketsLoading(true);
        const rows = await getCompanyTickets();
        if (!cancelled) setTickets(rows as TicketItem[]);
      } catch (err) {
        console.error("Failed to load tickets:", err);
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setTicketsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const SAMPLE_TICKETS: TicketItem[] = tickets;
  const { email, allowedLocations } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [repairStatusFilter, setRepairStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [ticketSourceFilter, setTicketSourceFilter] = useState("");
  // Per-column checkbox filters: field -> Set of selected values (empty = all)
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const setColFilter = (field: string, next: Set<string>) =>
    setColFilters((prev) => ({ ...prev, [field]: next }));
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [statusLog, setStatusLog] = useState<StatusLogEntry[]>([]);
  // Column visibility (persisted). `visibleColumns[key] === false` hides a column.
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    typeof window !== "undefined"
      ? loadVisibleColumns()
      : Object.fromEntries(TICKET_COLUMNS.map((c) => [c.key, true]))
  );
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const isColVisible = (key: TicketColumnKey) => visibleColumns[key] !== false;
  const toggleColumn = (key: TicketColumnKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: prev[key] === false };
      try { localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const showAllColumns = () => {
    const all = Object.fromEntries(TICKET_COLUMNS.map((c) => [c.key, true]));
    setVisibleColumns(all);
    try { localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  };
  const [agingModal, setAgingModal] = useState<{ ticketNo: string; status: string } | null>(null);
  const [changeNoteInput, setChangeNoteInput] = useState("");
  const [changeByInput, setChangeByInput] = useState("");
  const [visitedTickets, setVisitedTickets] = useState<Set<string>>(new Set());


  useEffect(() => { setStatusLog(loadStatusLog()); }, []);
  useEffect(() => { 
    // Load visited tickets from localStorage whenever component mounts
    const visits = loadTicketVisits();
    const visited = new Set(visits.map(v => v.ticketNo));
    setVisitedTickets(visited);
    
    // Also listen for storage changes from other tabs/windows
    const handleStorageChange = () => {
      const updatedVisits = loadTicketVisits();
      const updatedVisited = new Set(updatedVisits.map(v => v.ticketNo));
      setVisitedTickets(updatedVisited);
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const logStatusChange = useCallback((ticketNo: string, fromStatus: string, toStatus: string) => {
    const entry: StatusLogEntry = {
      ticketNo,
      fromStatus,
      toStatus,
      changedBy: changeByInput.trim() || "System",
      changedAt: new Date().toISOString(),
      note: changeNoteInput.trim() || undefined,
    };
    const updated = [entry, ...statusLog];
    setStatusLog(updated);
    saveStatusLog(updated);
    setChangeNoteInput("");
  }, [statusLog, changeByInput, changeNoteInput]);

  const ticketAgingDays = useCallback((ticket: { ticketNo: string; aging: number; statusChangedAt?: string }) => {
    // Find most recent status change for this ticket
    const lastChange = statusLog
      .filter(l => l.ticketNo === ticket.ticketNo)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt))[0];
    if (lastChange) return daysAgo(lastChange.changedAt);
    // If statusChangedAt recorded on the ticket itself
    if (ticket.statusChangedAt) return daysAgo(ticket.statusChangedAt);
    // Fallback to seed data aging
    return ticket.aging;
  }, [statusLog]);

  const ticketStatusLog = useCallback((ticketNo: string) => {
    return statusLog.filter(l => l.ticketNo === ticketNo).sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  }, [statusLog]);

  const locationOptions = useMemo(
    () => mergeLocationOptions(LOCATIONS, loadSavedLocations(), SAMPLE_TICKETS.map((ticket) => ticket.location)),
    [],
  );
  const ticketSourceOptions = useMemo(() => Array.from(new Set(SAMPLE_TICKETS.map((ticket) => ticket.ticketSource || "").filter(Boolean))).sort((a, b) => a.localeCompare(b)), []);

  // Value extractor for any filterable column.
  const colValue = useCallback((ticket: any, field: string): string => {
    switch (field) {
      case "ticketSource": return ticket.ticketSource || ticket.manufacturer || "";
      case "warranty": return ticket.warranty || "";
      case "customer": return ticket.customer || "";
      case "city": return ticket.city || "";
      case "location": return ticket.location || "";
      case "product": return (ticket.productType || ticket.product || "");
      case "technician": return ticket.technician || "";
      case "status": return ticket.status || "";
      case "customerPref": return ticket.customerPref || "";
      case "redo": return ticket.redo || "";
      case "partOrder": return ticket.partOrder || "";
      default: return (ticket[field] ?? "").toString();
    }
  }, []);

  // Build option lists for each filterable column from the data.
  const FILTERABLE = ["ticketSource","warranty","customer","city","location","product","technician","customerPref","schedule","status","redo","partOrder"];
  const columnOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of FILTERABLE) {
      map[f] = Array.from(new Set(SAMPLE_TICKETS.map((t) => colValue(t, f)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }
    return map;
  }, [SAMPLE_TICKETS, colValue]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return SAMPLE_TICKETS.filter((ticket) => {
      // Work-plan location restriction: if allowedLocations is set (non-null),
      // only show tickets whose location is in the allowed set.
      const matchesAccess = !allowedLocations || !Array.isArray(allowedLocations) || allowedLocations.includes(ticket.location);
      const matchesSearch = !query || [ticket.ticketNo, ticket.customer, ticket.city, ticket.phone, ticket.model, ticket.location, ticket.status, ticket.ticketSource || ""].some((value) => (value ?? "").toString().toLowerCase().includes(query));
      const matchesRepairStatus = !repairStatusFilter || ticket.status === repairStatusFilter;
      const matchesDate = (!startDateFilter && !endDateFilter) || isWithinDateRange(ticket.schedule, startDateFilter, endDateFilter);
      const matchesLocation = !locationFilter || ticket.location === locationFilter;
      const matchesSource = !ticketSourceFilter || (ticket.ticketSource || "") === ticketSourceFilter;
      // Per-column checkbox filters
      const matchesColumns = Object.entries(colFilters).every(([field, sel]) => {
        if (!sel || sel.size === 0) return true; // empty = all
        if (sel.has("__none__")) return false;   // explicit none
        return sel.has(colValue(ticket, field));
      });
      return matchesAccess && matchesSearch && matchesRepairStatus && matchesDate && matchesLocation && matchesSource && matchesColumns;
    });
  }, [endDateFilter, locationFilter, repairStatusFilter, searchQuery, startDateFilter, ticketSourceFilter, tickets, allowedLocations, colFilters, colValue]);

  const toggleItemSelection = (ticketNo: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(ticketNo)) {
      newSelected.delete(ticketNo);
    } else {
      newSelected.add(ticketNo);
    }
    setSelectedItems(newSelected);
  };

  const toggleAllItems = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.ticketNo)));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1900px] mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/m/$module" params={{ module: mod.slug }} className="btn hover:bg-white/15">
              <ChevronLeft className="h-4 w-4" /> {mod.label}
            </Link>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">{sub.title}</h1>
          <p className="text-lg text-muted-foreground">{sub.description}</p>
        </div>

        <div className="mb-6">
          <ServicePowerSyncButton onSynced={reloadTickets} />
        </div>

        <div className="panel">
          <div className="mb-6 space-y-3">
            <div className="grid gap-3 lg:grid-cols-3">
              <input
                type="text"
                placeholder="ticket, zip code, address, name, etc" onKeyDown={(e)=>{if(e.key==="Enter"&&(e.target as HTMLInputElement).value.length===5){const z=lookupZip((e.target as HTMLInputElement).value);if(z)console.log("Zip",e.target,"→",z.location);}}}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input w-full"
                aria-label="Search tickets"
              />
              <select aria-label="Repair status filter" value={repairStatusFilter} onChange={(e) => setRepairStatusFilter(e.target.value)} className="glass-input w-full">
                <option value="">All Repair Status</option>
                {REPAIR_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select aria-label="Location filter" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="glass-input w-full">
                <option value="">All Locations</option>
                {locationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              <input aria-label="Start date" type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="glass-input w-full" />
              <input aria-label="End date" type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="glass-input w-full" />
              <select aria-label="Ticket source filter" value={ticketSourceFilter} onChange={(e) => setTicketSourceFilter(e.target.value)} className="glass-input w-full">
                <option value="">All Ticket Sources</option>
                {ticketSourceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            {/* Column visibility filter */}
            <div className="relative flex justify-end">
              <button
                type="button"
                onClick={() => setColumnsMenuOpen((open) => !open)}
                className="btn hover:bg-white/15 inline-flex items-center gap-2"
                aria-haspopup="true"
                aria-expanded={columnsMenuOpen}
              >
                <Columns3 className="h-4 w-4" /> Columns
                <span className="text-xs text-muted-foreground">
                  ({TICKET_COLUMNS.filter((c) => isColVisible(c.key)).length}/{TICKET_COLUMNS.length})
                </span>
              </button>
              {columnsMenuOpen && (
                <>
                  {/* click-away overlay */}
                  <div className="fixed inset-0 z-40" onClick={() => setColumnsMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-white/15 bg-slate-900 p-2 shadow-2xl">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Show columns</span>
                      <button type="button" onClick={showAllColumns} className="text-xs text-blue-400 hover:text-blue-300">Show all</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {TICKET_COLUMNS.map((col) => (
                        <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={isColVisible(col.key)}
                            onChange={() => toggleColumn(col.key)}
                          />
                          <span className="text-slate-200">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ticket Table */}
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-[11px] leading-tight table-fixed">
              <thead>
                <tr className="bg-blue-900/50 border-b border-blue-500/30">
                  <th className="px-2 py-1.5 text-center font-semibold text-blue-300">✓</th>
                  {isColVisible("ticketNo") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Ticket No</th>}
                  {isColVisible("warranty") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Wty<ColumnFilter field="warranty" label="Wty" options={columnOptions["warranty"] || []} selected={colFilters["warranty"] || new Set()} onChange={(n) => setColFilter("warranty", n)} /></span></th>}
                  {isColVisible("ticketSource") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Ticket Source<ColumnFilter field="ticketSource" label="Ticket Source" options={columnOptions["ticketSource"] || []} selected={colFilters["ticketSource"] || new Set()} onChange={(n) => setColFilter("ticketSource", n)} /></span></th>}
                  {isColVisible("customer") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Cx Name<ColumnFilter field="customer" label="Cx Name" options={columnOptions["customer"] || []} selected={colFilters["customer"] || new Set()} onChange={(n) => setColFilter("customer", n)} /></span></th>}
                  {isColVisible("city") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">City<ColumnFilter field="city" label="City" options={columnOptions["city"] || []} selected={colFilters["city"] || new Set()} onChange={(n) => setColFilter("city", n)} /></span></th>}
                  {isColVisible("location") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Loc<ColumnFilter field="location" label="Loc" options={columnOptions["location"] || []} selected={colFilters["location"] || new Set()} onChange={(n) => setColFilter("location", n)} /></span></th>}
                  {isColVisible("product") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Product<ColumnFilter field="product" label="Product" options={columnOptions["product"] || []} selected={colFilters["product"] || new Set()} onChange={(n) => setColFilter("product", n)} /></span></th>}
                  {isColVisible("model") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Model</th>}
                  {isColVisible("internalNote") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Internal Note</th>}
                  {isColVisible("repair") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Repair</th>}
                  {isColVisible("technician") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Technician<ColumnFilter field="technician" label="Technician" options={columnOptions["technician"] || []} selected={colFilters["technician"] || new Set()} onChange={(n) => setColFilter("technician", n)} /></span></th>}
                  {isColVisible("customerPref") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Cx Prefer<ColumnFilter field="customerPref" label="Cx Prefer" options={columnOptions["customerPref"] || []} selected={colFilters["customerPref"] || new Set()} onChange={(n) => setColFilter("customerPref", n)} /></span></th>}
                  {isColVisible("schedule") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Schedule</th>}
                  {isColVisible("status") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Status<ColumnFilter field="status" label="Status" options={columnOptions["status"] || []} selected={colFilters["status"] || new Set()} onChange={(n) => setColFilter("status", n)} /></span></th>}
                  {isColVisible("phone") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Phone</th>}
                  {isColVisible("redo") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Redo<ColumnFilter field="redo" label="Redo" options={columnOptions["redo"] || []} selected={colFilters["redo"] || new Set()} onChange={(n) => setColFilter("redo", n)} /></span></th>}
                  {isColVisible("aging") && <th className="px-2 py-1.5 text-center font-semibold text-blue-300">Aging</th>}
                  {isColVisible("statusSpend") && <th className="px-2 py-1.5 text-center font-semibold text-blue-300">Status Spend</th>}
                  {isColVisible("calls") && <th className="px-2 py-1.5 text-center font-semibold text-blue-300">Calls</th>}
                  {isColVisible("partOrder") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300"><span className="inline-flex items-center">Part Order<ColumnFilter field="partOrder" label="Part Order" options={columnOptions["partOrder"] || []} selected={colFilters["partOrder"] || new Set()} onChange={(n) => setColFilter("partOrder", n)} /></span></th>}
                  {isColVisible("posting") && <th className="px-2 py-1.5 text-left font-semibold text-blue-300 truncate">Posting</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((ticket) => (
                  <tr key={ticket.ticketNo} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-2 py-1.5 text-center font-bold text-green-400 w-12" title={visitedTickets.has(ticket.ticketNo) ? `Visited by: ${getTicketVisitors(ticket.ticketNo).join(", ")}` : "Not visited"}>
                      {visitedTickets.has(ticket.ticketNo) ? "✓" : ""}
                    </td>
                    {isColVisible("ticketNo") && (
                    <td className="px-2 py-1.5 font-mono text-blue-400 font-semibold">
                      <a
                        href={`/ticket/${ticket.ticketNo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          console.log("Ticket clicked, email:", email);
                          if (email) {
                            console.log("Marking ticket as visited:", ticket.ticketNo, email);
                            markTicketAsVisited(ticket.ticketNo, email);
                            setVisitedTickets(prev => {
                              const newSet = new Set([...prev, ticket.ticketNo]);
                              console.log("Updated visitedTickets:", newSet);
                              return newSet;
                            });
                          } else {
                            console.warn("No email available");
                          }
                        }}
                        className="hover:text-blue-300 hover:underline transition cursor-pointer"
                      >
                        {ticket.ticketNo}
                      </a>
                    </td>
                    )}
                    {isColVisible("warranty") && <td className="px-2 py-1.5 text-slate-300 truncate">{warrantyAcronym(ticket.warranty)}</td>}
                    {isColVisible("ticketSource") && <td className="px-2 py-1.5 text-slate-300 max-w-[110px] truncate" title={ticket.ticketSource || ticket.manufacturer}>{ticket.ticketSource || ticket.manufacturer}</td>}
                    {isColVisible("customer") && <td className="px-2 py-1.5 text-slate-300 max-w-[120px] truncate" title={ticket.customer}>{ticket.customer}</td>}
                    {isColVisible("city") && <td className="px-2 py-1.5 text-slate-300 max-w-[90px] truncate" title={ticket.city}>{ticket.city}</td>}
                    {isColVisible("location") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.location}</td>}
                    {isColVisible("product") && <td className="px-2 py-1.5 text-slate-300 max-w-[120px] truncate" title={productLabel(ticket)}>{productLabel(ticket)}</td>}
                    {isColVisible("model") && <td className="px-2 py-1.5 font-mono text-[11px] text-slate-300 max-w-[90px] truncate" title={ticket.model}>{ticket.model}</td>}
                    {isColVisible("internalNote") && (
                    <td className="px-2 py-1.5 text-slate-400 text-xs max-w-xs truncate" title={ticket.internalNote}>
                      {ticket.internalNote || "—"}
                    </td>
                    )}
                    {isColVisible("repair") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.diagnosed}</td>}
                    {isColVisible("technician") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.technician || "—"}</td>}
                    {isColVisible("customerPref") && <td className="px-2 py-1.5 text-center text-slate-300 truncate">{ticket.customerPref}</td>}
                    {isColVisible("schedule") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.schedule}</td>}
                    {isColVisible("status") && <td className={`px-2 py-1.5 font-semibold text-xs max-w-[130px] truncate ${statusColorClass(ticket.status)}`} title={ticket.status}>{ticket.status}</td>}
                    {isColVisible("phone") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.phone}</td>}
                    {isColVisible("redo") && <td className="px-2 py-1.5 text-center text-slate-300 truncate">{ticket.redo}</td>}
                    {isColVisible("aging") && (
                    <td className="px-2 py-1.5 text-center">
                      {(() => {
                        const days = daysSinceCreated(ticket.created);
                        const color = days <= 3 ? "text-green-400" : days <= 7 ? "text-yellow-400" : days <= 14 ? "text-orange-400" : "text-red-400";
                        return <span className={`font-bold text-sm ${color}`}>{days}d</span>;
                      })()}
                    </td>
                    )}
                    {isColVisible("statusSpend") && (
                    <td className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => setAgingModal({ ticketNo: ticket.ticketNo, status: ticket.status })}
                        title="View status change log"
                        className="group flex flex-col items-center gap-0.5 mx-auto hover:opacity-80 transition-opacity"
                      >
                        {(() => {
                          const days = ticketAgingDays(ticket);
                          const color = days <= 3 ? "text-green-400" : days <= 7 ? "text-yellow-400" : days <= 14 ? "text-orange-400" : "text-red-400";
                          return (
                            <>
                              <span className={`font-bold text-sm ${color}`}>{days}d</span>
                              <History className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                            </>
                          );
                        })()}
                      </button>
                    </td>
                    )}
                    {isColVisible("calls") && <td className="px-2 py-1.5 text-center text-slate-300 truncate">{ticket.calls}</td>}
                    {isColVisible("partOrder") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.partOrder}</td>}
                    {isColVisible("posting") && <td className="px-2 py-1.5 text-slate-300 truncate">{ticket.created}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No tickets found matching "{searchQuery}"</p>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredItems.length} of {SAMPLE_TICKETS.length} tickets ({selectedItems.size} selected)
          </div>
        </div>

        {/* ── Status Change Log Modal ── */}
        {agingModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setAgingModal(null)}>
            <div className="bg-slate-900 border border-white/15 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="font-semibold">Status Change Log</span>
                  <span className="text-xs text-muted-foreground font-mono">{agingModal.ticketNo}</span>
                </div>
                <button onClick={() => setAgingModal(null)} className="text-white/30 hover:text-white/70 transition-colors"><X className="h-5 w-5" /></button>
              </div>

              {/* Current status + aging */}
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Current Status</p>
                  <p className="text-sm font-semibold text-blue-300">{agingModal.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Days in Status</p>
                  {(() => {
                    const lastChange = statusLog.filter(l => l.ticketNo === agingModal.ticketNo).sort((a, b) => b.changedAt.localeCompare(a.changedAt))[0];
                    const days = lastChange ? daysAgo(lastChange.changedAt) : null;
                    const color = days === null ? "text-muted-foreground" : days <= 3 ? "text-green-400" : days <= 7 ? "text-yellow-400" : days <= 14 ? "text-orange-400" : "text-red-400";
                    return <p className={`text-2xl font-bold ${color}`}>{days !== null ? `${days}d` : "—"}</p>;
                  })()}
                </div>
              </div>

              {/* Log entries */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {ticketStatusLog(agingModal.ticketNo).length === 0
                  ? <div className="px-5 py-8 text-center text-muted-foreground text-sm">No status changes recorded yet.<br /><span className="text-xs opacity-60">Use the form below to log a change.</span></div>
                  : ticketStatusLog(agingModal.ticketNo).map((entry, i) => (
                    <div key={i} className="px-5 py-3 hover:bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/20 line-through opacity-60">{entry.fromStatus}</span>
                          <span className="text-white/30 text-xs">→</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">{entry.toStatus}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmtTimestamp(entry.changedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />{entry.changedBy}
                        {entry.note && <span className="ml-2 text-white/40 italic">"{entry.note}"</span>}
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Add new entry */}
              <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02] rounded-b-xl">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Log Status Change</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input value={changeByInput} onChange={e => setChangeByInput(e.target.value)} placeholder="Your name…"
                      className="glass-input text-sm py-1.5 px-3 rounded-md flex-1" />
                    <input value={changeNoteInput} onChange={e => setChangeNoteInput(e.target.value)} placeholder="Note (optional)…"
                      className="glass-input text-sm py-1.5 px-3 rounded-md flex-1" />
                  </div>
                  <button
                    onClick={() => {
                      const prev = ticketStatusLog(agingModal.ticketNo)[0]?.toStatus || agingModal.status;
                      logStatusChange(agingModal.ticketNo, prev, agingModal.status);
                    }}
                    className="w-full py-1.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <Clock className="h-3.5 w-3.5" />Record Status Change Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}