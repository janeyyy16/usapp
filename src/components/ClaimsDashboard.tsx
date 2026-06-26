import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ClipboardCheck, Clock, AlertTriangle, CheckCircle, Users, FileText, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import {
  CLAIMS_DAILY,
  CLAIMS_BY_BRAND,
  CLAIMS_PENDING,
  CLAIMS_PREAUTH_AGING,
  CLAIMS_STAFF,
  CLAIMS_SUMMARY,
  CLAIMS_DATA_CLOSED,
} from "@/lib/claimsDashboardData";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const COLORS = ["#3b82f6", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#facc15", "#22d3ee", "#60a5fa", "#f87171", "#4ade80", "#c084fc", "#fbbf24", "#2dd4bf", "#818cf8", "#fb7185"];

function Kpi({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-center">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div>
    </div>
  );
}

function Panel({ title, icon: Icon, children, className = "" }: { title: string; icon?: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-slate-900/50 p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-blue-400" />}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function ClaimsDashboard({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const latest = CLAIMS_DAILY[CLAIMS_DAILY.length - 1];
  const totalRemaining = useMemo(() => CLAIMS_PENDING.reduce((s, p) => s + p.count, 0), []);
  const totalBrand = useMemo(() => CLAIMS_BY_BRAND.reduce((s, b) => s + b.count, 0), []);

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-[1400px] px-6 py-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Link to="/m/$module" params={{ module: "dashboard" }} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Claims Dashboard</h1>
            <p className="text-xs text-slate-400">Latest: {latest.date} · {CLAIMS_SUMMARY.staffActive} staff active · {CLAIMS_SUMMARY.inTraining} in training</p>
          </div>
        </div>

        {/* KPI row */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Completed Today" value={CLAIMS_SUMMARY.completedToday} accent="text-blue-400" />
          <Kpi label="Remaining" value={CLAIMS_SUMMARY.remaining} accent="text-amber-400" />
          <Kpi label="Pre-Auth Pending" value={CLAIMS_SUMMARY.preAuthPending} accent="text-rose-400" />
          <Kpi label="Data Closed" value={CLAIMS_SUMMARY.dataClosedHandled} accent="text-green-400" />
          <Kpi label="Staff Active" value={CLAIMS_SUMMARY.staffActive} accent="text-violet-400" />
          <Kpi label="In Training" value={CLAIMS_SUMMARY.inTraining} accent="text-cyan-400" />
        </div>

        {/* Row 1: trend line + brand donut */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Panel title="Claims Completed vs Remaining" icon={ClipboardCheck} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={CLAIMS_DAILY} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="remaining" name="Remaining" stroke="#fb923c" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Claims by Brand" icon={FileText}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={CLAIMS_BY_BRAND} dataKey="count" nameKey="brand" cx="50%" cy="45%" innerRadius={45} outerRadius={85} paddingAngle={2}>
                  {CLAIMS_BY_BRAND.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Row 2: pending breakdown + preauth aging + data closed */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Panel title="Remaining by Category" icon={Clock}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CLAIMS_PENDING} layout="vertical" margin={{ left: 30, right: 10 }}>
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fill: "#94a3b8", fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="count" fill="#fb923c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Pre-Authorization Aging" icon={AlertTriangle}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CLAIMS_PREAUTH_AGING} margin={{ left: -10, right: 10 }}>
                <XAxis dataKey="bucket" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {CLAIMS_PREAUTH_AGING.map((_, i) => <Cell key={i} fill={["#34d399", "#facc15", "#f87171"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Data Closed (Electrolux)" icon={ShieldCheck}>
            <div className="flex h-[220px] flex-col items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">{CLAIMS_DATA_CLOSED.handled}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">Handled</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-amber-400">{CLAIMS_DATA_CLOSED.moved}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">Moved</div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Staff performance table */}
        <Panel title={`Staff Performance — ${latest.date}`} icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 font-semibold">Staff</th>
                  <th className="px-3 py-2 font-semibold">Start Date</th>
                  <th className="px-3 py-2 font-semibold text-center">Hours</th>
                  <th className="px-3 py-2 font-semibold text-center">Completed</th>
                  <th className="px-3 py-2 font-semibold">Brands Covered</th>
                  <th className="px-3 py-2 font-semibold text-center">Warnings</th>
                  <th className="px-3 py-2 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {CLAIMS_STAFF.map((s, i) => (
                  <tr key={s.name} className={`border-b border-white/5 ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                    <td className="px-3 py-2.5 font-medium text-white">{s.name}</td>
                    <td className="px-3 py-2.5 text-slate-400">{s.startDate}</td>
                    <td className="px-3 py-2.5 text-center text-slate-300">{s.hours}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 font-semibold text-blue-300">{s.completed}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{s.brandsCovered}</td>
                    <td className="px-3 py-2.5 text-center">
                      {s.warnings > 0
                        ? <span className="rounded bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">{s.warnings}</span>
                        : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{s.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </div>
  );
}
