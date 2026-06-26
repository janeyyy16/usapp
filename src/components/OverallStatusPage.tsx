import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Printer, Download, Search } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  MONTHLY_STATS, DAILY_STATS, STAT_LINES,
  PENDING_BY_STATUS, PENDING_BY_LOCATION, CSR_ACTIVITY,
  TECH_RANKING, LOCATION_RANKING, ALL_LOCATIONS_FILTER,
  type RankingRow,
} from "@/lib/overallStatusData";

function Donut({ data, title }: { data: { name: string; value: number; color: string }[]; title: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="mb-2 text-center text-lg font-semibold">{title}</p>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={1}
            label={(entry) => `${entry.value}`}
            labelLine={false}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
            formatter={(value: any, name: any) => [value, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground max-h-24 overflow-y-auto">
        {data.slice(0, 30).map((d, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function RankingTable({ title, rows, label }: { title: string; rows: RankingRow[]; label: string }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"rank" | "thirtyDay" | "tenDay">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let r = rows.filter((row) => !q || row.name.toLowerCase().includes(q) || row.office.toLowerCase().includes(q));
    r = [...r].sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return r;
  }, [rows, search, sortKey, sortDir]);

  const toggleSort = (key: "rank" | "thirtyDay" | "tenDay") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "rank" ? "asc" : "desc"); }
  };

  return (
    <section className="panel">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} records out of {rows.length} found</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" title="Print"><Printer className="h-4 w-4" /></button>
          <button className="btn" title="Export"><Download className="h-4 w-4" /></button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search in result"
              className="glass-input pl-8 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto border border-white/10 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-900/50 border-b border-blue-500/30">
              <th className="px-3 py-2 text-left font-semibold text-blue-300 cursor-pointer" onClick={() => toggleSort("rank")}>Rank{sortKey === "rank" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</th>
              <th className="px-3 py-2 text-left font-semibold text-blue-300">{label}</th>
              <th className="px-3 py-2 text-left font-semibold text-blue-300">Office</th>
              <th className="px-3 py-2 text-right font-semibold text-blue-300 cursor-pointer" onClick={() => toggleSort("thirtyDay")}>30 Day{sortKey === "thirtyDay" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</th>
              <th className="px-3 py-2 text-right font-semibold text-blue-300 cursor-pointer" onClick={() => toggleSort("tenDay")}>10 Day{sortKey === "tenDay" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.rank} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-2 text-slate-400">{row.rank}</td>
                <td className="px-3 py-2 text-slate-200 font-medium">{row.name}</td>
                <td className="px-3 py-2 text-slate-300">{row.office}</td>
                <td className="px-3 py-2 text-right text-emerald-300">{row.thirtyDay != null ? row.thirtyDay.toFixed(2) : "—"}</td>
                <td className="px-3 py-2 text-right text-sky-300">{row.tenDay != null ? row.tenDay.toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function OverallStatusPage({ mod }: { mod: ModuleDef; sub: SubModuleDef; companyId: string | null; }) {
  const [statType, setStatType] = useState<"monthly" | "daily">("monthly");
  const [location, setLocation] = useState("ALL");
  const [startDate, setStartDate] = useState("2026-05-27");
  const [endDate, setEndDate] = useState("2026-06-25");

  const statData = statType === "monthly" ? MONTHLY_STATS : DAILY_STATS;
  const activeLines = statType === "monthly" ? STAT_LINES : STAT_LINES.filter((l) => l.key !== "Centricity");

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{ module: mod.slug }} className="btn hover:bg-white/15">
            <ChevronLeft className="h-4 w-4" /> {mod.label}
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-display font-bold underline">Overall Status</h1>
        </div>

        {/* Filters */}
        <div className="panel mb-4">
          <div className="flex flex-wrap items-end justify-end gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="glass-input mt-1 w-48">
                {ALL_LOCATIONS_FILTER.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass-input mt-1" />
            </div>
            <span className="pb-2 text-muted-foreground">~</span>
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-muted-foreground sr-only">End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="glass-input mt-1" />
            </div>
            <button className="btn btn-primary">Refresh</button>
          </div>
        </div>

        {/* Ticket Statistics line chart */}
        <section className="panel mb-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Ticket Statistics ({statType === "monthly" ? "Monthly" : "Daily"})</h2>
            <div className="flex gap-2">
              <button className={`btn ${statType === "monthly" ? "btn-primary" : ""}`} onClick={() => setStatType("monthly")}>Monthly</button>
              <button className={`btn ${statType === "daily" ? "btn-primary" : ""}`} onClick={() => setStatType("daily")}>Daily</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={statData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-foreground)" }} />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              <Legend />
              {activeLines.map((line) => (
                <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={line.key === "TOTAL" ? 3 : 1.5} dot={{ r: 2 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* Three donuts */}
        <section className="grid gap-4 mb-4 lg:grid-cols-3">
          <Donut data={PENDING_BY_STATUS} title="Pending Tickets by Status" />
          <Donut data={PENDING_BY_LOCATION} title="Pending Tickets by Location" />
          <Donut data={CSR_ACTIVITY} title="CSR Activity" />
        </section>

        {/* Ranking tables */}
        <RankingTable title="Tech Ranking Report" rows={TECH_RANKING} label="Tech Name" />
        <RankingTable title="Location Ranking Report" rows={LOCATION_RANKING} label="Office" />
      </main>
    </div>
  );
}
