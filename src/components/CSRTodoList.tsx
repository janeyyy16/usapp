import React, { useMemo, useState } from "react";
import { ChevronLeft, Clock, AlertCircle, Phone, FileText, Inbox } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getAgentNameForEmail, getBranchForEmail, getRoleForEmail } from "@/lib/roles";
import { generateTodoTickets, type TodoTicket } from "@/lib/csrOps";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const STATE_STYLES: Record<TodoTicket["state"], string> = {
  "Raw - From Customer":  "bg-red-500/15 text-red-300 border-red-500/25",
  "Attended - Note Left": "bg-blue-500/15 text-blue-300 border-blue-500/25",
  "Left Message":         "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  "Callback Needed":      "bg-purple-500/15 text-purple-300 border-purple-500/25",
};
const STATE_ICONS: Record<TodoTicket["state"], React.ReactNode> = {
  "Raw - From Customer":  <Inbox className="h-3.5 w-3.5" />,
  "Attended - Note Left": <FileText className="h-3.5 w-3.5" />,
  "Left Message":         <Phone className="h-3.5 w-3.5" />,
  "Callback Needed":      <Phone className="h-3.5 w-3.5" />,
};

function ageBadge(hours: number) {
  if (hours <= 4)  return { label: `${hours}h`, cls: "text-green-300" };
  if (hours <= 24) return { label: `${hours}h`, cls: "text-yellow-300" };
  const days = Math.floor(hours / 24);
  return { label: `${days}d ${hours % 24}h`, cls: "text-red-300" };
}

export function CSRTodoList({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const { email } = useAuth();
  const role = getRoleForEmail(email);
  const agentName = getAgentNameForEmail(email) || "Anna Dominique";
  const branch = getBranchForEmail(email) || "Nashville";
  const [filter, setFilter] = useState<"all" | TodoTicket["state"]>("all");

  const tickets = useMemo(() => generateTodoTickets(agentName, branch, 18), [agentName, branch]);

  const counts = useMemo(() => ({
    total: tickets.length,
    raw: tickets.filter(t => t.state === "Raw - From Customer").length,
    note: tickets.filter(t => t.state === "Attended - Note Left").length,
    leftMsg: tickets.filter(t => t.state === "Left Message").length,
    callback: tickets.filter(t => t.state === "Callback Needed").length,
    overdue: tickets.filter(t => t.ageHours > 24).length,
  }), [tickets]);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.state === filter);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1100px] mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => window.history.back()} className="btn hover:bg-white/15">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">To-Do List</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {agentName} · {branch} branch · Tickets awaiting scheduling
            </p>
          </div>
        </div>

        {/* Attention banner */}
        <div className="panel p-4 mb-5 mt-4 flex items-center gap-3 border border-yellow-500/20 bg-yellow-500/5">
          <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              {counts.total} ticket{counts.total !== 1 ? "s" : ""} need{counts.total === 1 ? "s" : ""} attention
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              These are raw or partially-handled tickets not yet set to scheduling.
              {counts.overdue > 0 && <span className="text-red-300"> {counts.overdue} over 24h old.</span>}
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ["all", "All", counts.total],
            ["Raw - From Customer", "Raw / Untouched", counts.raw],
            ["Attended - Note Left", "Noted", counts.note],
            ["Left Message", "Left Msg", counts.leftMsg],
            ["Callback Needed", "Callback", counts.callback],
          ] as const).map(([key, label, count]) => (
            <button key={key} onClick={() => setFilter(key as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                filter === key ? "bg-white/15 text-white border-white/20" : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
              }`}>
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === key ? "bg-white/20" : "bg-white/10"}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Ticket list */}
        <div className="panel p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">
              Nothing here — all clear for this filter.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(t => {
                const age = ageBadge(t.ageHours);
                return (
                  <div key={t.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <a href={`/ticket/${encodeURIComponent(t.ticketNo)}`}
                        className="flex-1 min-w-[200px] group cursor-pointer">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${STATE_STYLES[t.state]}`}>
                            {STATE_ICONS[t.state]}{t.state}
                          </span>
                          <span className="font-mono text-sm text-blue-300 group-hover:underline underline-offset-2">{t.ticketNo}</span>
                        </div>
                        <p className="text-sm font-medium mt-1.5 group-hover:text-blue-200 transition-colors">{t.customer} <span className="text-muted-foreground font-normal">· {t.city}</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.reason}</p>
                        <p className="text-[10px] text-blue-400/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to open ticket — add notes, modify status →</p>
                      </a>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-sm font-semibold ${age.cls}`}>{age.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.brand}</p>
                        <button className="mt-2 px-3 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                          Set to Scheduling
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground/60 mt-4 text-center">
          Once a ticket is set to scheduling, it leaves this list and moves into the technician visit workflow.
        </p>
      </main>
    </div>
  );
}
