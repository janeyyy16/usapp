import { useMemo, useState } from "react";
import { ChevronLeft, Users, Phone, AlertTriangle, Clock, CheckCircle, XCircle, TrendingUp, CalendarDays, MessageSquareOff } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { csrReportData } from "@/lib/reportData";
import { useAuth } from "@/lib/auth";
import { getTeamForEmail } from "@/lib/roles";
import { generateMistakeRecords, generateAttendance, filterByMonth, TEAM_LEADERS, type MistakeRecord } from "@/lib/csrOps";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const ALL_DATES = Object.keys(csrReportData).sort();
const fmtDate = (s: string) => { const c = s.replace(/^0/, ""); return c.length === 3 ? `${c[0]}/${c.slice(1)}/26` : `${c.slice(0, -2)}/${c.slice(-2)}/26`; };

const STATUS_STYLES: Record<string, string> = {
  "Approved":         "bg-green-500/15 text-green-300 border-green-500/25",
  "Rejected":         "bg-red-500/15 text-red-300 border-red-500/25",
  "Pending Manager":  "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  "Pending Lead":     "bg-orange-500/15 text-orange-300 border-orange-500/25",
  "Pending Senior":   "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

export function CSRTeamLeaderDashboard({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const { email } = useAuth();
  const team = getTeamForEmail(email) || "TEAM DANIELA";
  const teamLabel = team.replace("TEAM ", "");
  const tlName = TEAM_LEADERS[team] || "Team Leader";

  const latestDate = ALL_DATES[ALL_DATES.length - 1];
  const teamAgents: any[] = useMemo(() =>
    ((csrReportData as any)[latestDate]?.agents || []).filter((a: any) => a.team === team),
    [latestDate, team]);

  // Month filter for mistakes
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-US", { month: "long", year: "numeric" }) };
    });
  }, []);
  const [month, setMonth] = useState<string>("all");

  // Generate mistakes for all team agents
  const allMistakes = useMemo(() => {
    const recs: MistakeRecord[] = [];
    teamAgents.forEach((a: any) => {
      recs.push(...generateMistakeRecords(a.name, team, 3 + Math.floor(Math.random() * 0) + (a.name.length % 4)));
    });
    return recs;
  }, [teamAgents, team]);

  const filteredMistakes = useMemo(() =>
    month === "all" ? allMistakes : filterByMonth(allMistakes, month),
    [allMistakes, month]);

  // Attendance per agent (current view)
  const attendance = useMemo(() =>
    teamAgents.map((a: any) => generateAttendance(a.name, team, 1)[0]),
    [teamAgents, team]);

  // Team totals
  const totals = useMemo(() => teamAgents.reduce((acc, a) => ({
    agents: acc.agents + 1,
    gh: acc.gh + (a.gh || 0),
    handled: acc.handled + (a.total || 0),
    schedule: acc.schedule + (a.schedule || 0),
    attempt: acc.attempt + (a.attempt || 0),
    update: acc.update + (a.update || 0),
  }), { agents: 0, gh: 0, handled: 0, schedule: 0, attempt: 0, update: 0 }), [teamAgents]);

  // End-of-day KPIs (dummy but role-relevant)
  const leftMessageCount = useMemo(() => teamAgents.reduce((s, a) => s + Math.max(0, Math.floor((a.attempt || 0) * 0.04)), 0), [teamAgents]);
  const needsSchedulingOverday = useMemo(() => teamAgents.reduce((s, a) => s + Math.max(0, Math.floor((a.gh || 0) * 0.02)), 0), [teamAgents]);

  // Per-agent performance table data
  const perAgent = useMemo(() => teamAgents.map((a: any) => {
    const agentMistakes = filteredMistakes.filter(m => m.agent === a.name);
    const att = attendance.find(x => x.agent === a.name);
    return {
      name: a.name,
      handled: a.total || 0,
      updated: a.update || 0,
      attempts: a.attempt || 0,
      schedule: a.schedule || 0,
      mistakes: agentMistakes.length,
      pendingWarnings: agentMistakes.filter(m => m.isWarning && m.status.startsWith("Pending")).length,
      approvedWarnings: agentMistakes.filter(m => m.isWarning && m.status === "Approved").length,
      late: att?.late || 0,
      absent: att?.absent || 0,
    };
  }).sort((a, b) => b.handled - a.handled), [teamAgents, filteredMistakes, attendance]);

  const mistakeStats = useMemo(() => ({
    total: filteredMistakes.length,
    warnings: filteredMistakes.filter(m => m.isWarning).length,
    pending: filteredMistakes.filter(m => m.isWarning && m.status.startsWith("Pending")).length,
    approved: filteredMistakes.filter(m => m.isWarning && m.status === "Approved").length,
    rejected: filteredMistakes.filter(m => m.isWarning && m.status === "Rejected").length,
  }), [filteredMistakes]);

  const chartData = useMemo(() => perAgent.map(a => ({ name: a.name.split(" ")[0], handled: a.handled, attempts: a.attempts })), [perAgent]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => window.history.back()} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4" /></button>
          <div>
            <h1 className="text-2xl font-bold">Team Leader Dashboard — {teamLabel}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{tlName} · {totals.agents} agents · Latest: {fmtDate(latestDate)}</p>
          </div>
        </div>

        {/* End-of-day KPI alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 mt-4">
          <div className={`panel p-4 flex items-center gap-3 border ${leftMessageCount === 0 ? "border-green-500/25 bg-green-500/5" : "border-red-500/25 bg-red-500/5"}`}>
            <MessageSquareOff className={`h-6 w-6 shrink-0 ${leftMessageCount === 0 ? "text-green-400" : "text-red-400"}`} />
            <div>
              <p className="text-sm font-semibold">CSR Left Message <span className="text-muted-foreground font-normal">(must be 0 by EOD)</span></p>
              <p className={`text-2xl font-bold ${leftMessageCount === 0 ? "text-green-300" : "text-red-300"}`}>{leftMessageCount}</p>
            </div>
          </div>
          <div className={`panel p-4 flex items-center gap-3 border ${needsSchedulingOverday === 0 ? "border-green-500/25 bg-green-500/5" : "border-red-500/25 bg-red-500/5"}`}>
            <Clock className={`h-6 w-6 shrink-0 ${needsSchedulingOverday === 0 ? "text-green-400" : "text-red-400"}`} />
            <div>
              <p className="text-sm font-semibold">Needs Scheduling &gt;1 day <span className="text-muted-foreground font-normal">(must be 0 for the day)</span></p>
              <p className={`text-2xl font-bold ${needsSchedulingOverday === 0 ? "text-green-300" : "text-red-300"}`}>{needsSchedulingOverday}</p>
            </div>
          </div>
        </div>

        {/* Team KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Agents", value: totals.agents, color: "text-white", icon: <Users className="h-4 w-4" /> },
            { label: "Handled", value: totals.handled, color: "text-blue-300", icon: <TrendingUp className="h-4 w-4" /> },
            { label: "Updated", value: totals.update, color: "text-cyan-300", icon: <TrendingUp className="h-4 w-4" /> },
            { label: "Call Attempts", value: totals.attempt, color: "text-purple-300", icon: <Phone className="h-4 w-4" /> },
            { label: "Scheduled", value: totals.schedule, color: "text-green-300", icon: <CalendarDays className="h-4 w-4" /> },
            { label: "Total GH", value: totals.gh, color: "text-yellow-300", icon: <TrendingUp className="h-4 w-4" /> },
          ].map(k => (
            <div key={k.label} className="panel p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{k.icon}<span className="text-[10px] uppercase tracking-wide">{k.label}</span></div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value || "—"}</p>
            </div>
          ))}
        </div>

        {/* Per-agent performance chart */}
        <div className="panel p-4 mb-5">
          <p className="text-sm font-semibold mb-4">Handled vs Call Attempts — per agent</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-15} textAnchor="end" height={42} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="handled" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Handled" />
              <Bar dataKey="attempts" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Call Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mistake / warning summary with month filter */}
        <div className="panel p-0 overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
            <span className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-400" />Mistakes &amp; Warnings</span>
            <select value={month} onChange={e => setMonth(e.target.value)} className="glass-input text-sm py-1 px-2 rounded-md">
              <option value="all">All time</option>
              {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4">
            {[
              { label: "Total Mistakes", value: mistakeStats.total, color: "text-white" },
              { label: "Warnings", value: mistakeStats.warnings, color: "text-orange-300" },
              { label: "Pending Approval", value: mistakeStats.pending, color: "text-yellow-300" },
              { label: "Approved", value: mistakeStats.approved, color: "text-green-300" },
              { label: "Rejected", value: mistakeStats.rejected, color: "text-red-300" },
            ].map(k => (
              <div key={k.label} className="text-center panel p-3">
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Per-agent detail table */}
        <div className="panel p-0 overflow-hidden mb-5">
          <div className="px-4 py-3 border-b border-white/10 font-semibold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" />Per-Agent Performance{month !== "all" && <span className="text-xs text-muted-foreground">· {monthOptions.find(m => m.value === month)?.label}</span>}</div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              {["Agent", "Handled", "Updated", "Attempts", "Scheduled", "Mistakes", "Pending W.", "Approved W.", "Late", "Absent"].map(h =>
                <th key={h} className="px-3 py-2 text-left text-xs text-muted-foreground uppercase whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {perAgent.map((a, i) => (
                <tr key={a.name} className={`border-b border-white/5 hover:bg-white/5 ${i % 2 !== 0 ? "bg-white/[0.02]" : ""}`}>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{a.name}</td>
                  <td className="px-3 py-2 text-blue-300">{a.handled}</td>
                  <td className="px-3 py-2 text-cyan-300">{a.updated}</td>
                  <td className="px-3 py-2 text-purple-300">{a.attempts}</td>
                  <td className="px-3 py-2 text-green-300">{a.schedule}</td>
                  <td className="px-3 py-2">{a.mistakes || "—"}</td>
                  <td className="px-3 py-2">{a.pendingWarnings > 0 ? <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">{a.pendingWarnings}</span> : "—"}</td>
                  <td className="px-3 py-2">{a.approvedWarnings > 0 ? <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30">{a.approvedWarnings}</span> : "—"}</td>
                  <td className="px-3 py-2 text-yellow-300">{a.late || "—"}</td>
                  <td className="px-3 py-2 text-red-300">{a.absent || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Warnings issued by this TL — tracking their progress through approval */}
        <div className="panel p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
            <span className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-400" />Warnings I've Issued <span className="text-xs text-muted-foreground">· tracked through Raul → Lou → Aleena</span></span>
            <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors">+ Issue Warning</button>
          </div>
          <div className="divide-y divide-white/5">
            {filteredMistakes.filter(m => m.isWarning).slice(0, 12).map(m => (
              <div key={m.id} className="px-4 py-3 hover:bg-white/[0.02]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{m.agent}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] border ${STATUS_STYLES[m.status]}`}>{m.status}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${m.severity === "High" ? "bg-red-500/15 text-red-300" : m.severity === "Medium" ? "bg-yellow-500/15 text-yellow-300" : "bg-white/10 text-muted-foreground"}`}>{m.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{m.date} · {m.category} — {m.description}</p>
                {/* Approval chain: Raul → Lou → Aleena */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {m.approvals.map((ap, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-[10px]">
                      {ap.decision === "approved" ? <CheckCircle className="h-3 w-3 text-green-400" /> : ap.decision === "rejected" ? <XCircle className="h-3 w-3 text-red-400" /> : <Clock className="h-3 w-3 text-yellow-400" />}
                      <span className={ap.decision === "approved" ? "text-green-300" : ap.decision === "rejected" ? "text-red-300" : "text-muted-foreground"}>{ap.stage}</span>
                      {idx < m.approvals.length - 1 && <span className="text-white/20 ml-1">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
