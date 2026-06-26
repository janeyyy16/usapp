import { useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  canChangePartStatus,
  isClaimLocked,
  fireTamperNotification,
} from "@/lib/partGovernance";

const PART_STATUSES = [
  "Need PO", "PO Made", "Part Ready", "CX Home", "Used",
  "Not Used & Stocked", "Hold for next visit", "Claimed", "Back in Stock",
];

interface PartRow {
  id: string;
  partNo: string;
  partDesc: string;
  poNo: string;
  qty: string;
  status: string;
}

const SEED_PARTS: PartRow[] = [
  { id: "1", partNo: "WH01X29615", partDesc: "INNER GASKET", poNo: "PO-7001", qty: "1", status: "Used" },
  { id: "2", partNo: "WR55X31998", partDesc: "CEILING LED", poNo: "PO-7002", qty: "2", status: "Part Ready" },
  { id: "3", partNo: "DA97-20114B", partDesc: "DRAWER ASSEMBLY", poNo: "PO-7003", qty: "1", status: "PO Made" },
];

export function TicketPartTransaction({ ticketStatus, ticketNo }: { ticketStatus: string; ticketNo: string }) {
  const { role, displayName } = useAuth() as any;
  const [parts, setParts] = useState<PartRow[]>(SEED_PARTS);
  const [tamperMsg, setTamperMsg] = useState("");

  const locked = isClaimLocked(ticketStatus);
  const allowed = canChangePartStatus(role, ticketStatus);

  const handleStatusChange = (rowId: string, newStatus: string) => {
    if (!allowed) {
      // Blocked: fire notification to Naveen/Ian/Tina
      const row = parts.find((p) => p.id === rowId);
      fireTamperNotification(displayName ?? role ?? "Unknown user", ticketNo, newStatus);
      setTamperMsg(
        `Status change blocked. This ticket is "${ticketStatus}" — only the Claims Department can change part statuses now. Naveen, Ian, and Tina have been notified.`
      );
      setTimeout(() => setTamperMsg(""), 6000);
      return;
    }
    setParts((prev) => prev.map((p) => (p.id === rowId ? { ...p, status: newStatus } : p)));
  };

  return (
    <div id="section-part-transaction" className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <h4 className="font-semibold text-slate-300">Part Transaction</h4>
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
            <Lock className="h-3 w-3" />
            {allowed ? "Claims-only (you have access)" : "Locked — Claims Dept only"}
          </span>
        )}
      </div>

      {tamperMsg && (
        <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {tamperMsg}
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-3 text-sm text-slate-400">
        {parts.length} distinct record{parts.length !== 1 ? "s" : ""} found
      </div>
      <div className="overflow-x-auto border border-white/10 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-900/50 border-b border-blue-500/30">
              {["ID", "Part No*", "Part Desc", "PO No", "Qty*", "Status*", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-blue-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.map((p, idx) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-400">{p.partNo}</td>
                <td className="px-4 py-3 text-slate-300">{p.partDesc}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{p.poNo}</td>
                <td className="px-4 py-3 text-center text-slate-300">{p.qty}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    disabled={!allowed}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    className={`rounded border px-2 py-1 text-xs focus:outline-none ${
                      !allowed
                        ? "cursor-not-allowed border-white/10 bg-slate-800/50 text-slate-500"
                        : "border-slate-600 bg-slate-800 text-white focus:border-blue-500"
                    }`}
                    title={!allowed ? "Locked — only Claims Department can change status after claim/data close" : ""}
                  >
                    {PART_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={!allowed}
                    className={`text-xs ${allowed ? "text-blue-400 hover:text-blue-300" : "text-slate-600 cursor-not-allowed"}`}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
