import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronDown } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const SAMPLE_INFO = {
  uniqueId: "", partNo: "", description: "", vendor: "", location: "",
  onHand: 0, reserved: 0, available: 0, cost: 0,
};
const HISTORY_ROWS = [
  {id:1,date:"2026-05-28",action:"Received",invoiceNo:"INV-001",poNo:"PO-7001",qty:5,balance:5,tech:"M. Patel",notes:""},
  {id:2,date:"2026-05-20",action:"Issued",invoiceNo:"",poNo:"",qty:-1,balance:4,tech:"J. Kim",notes:"TK-001547"},
  {id:3,date:"2026-05-15",action:"Issued",invoiceNo:"",poNo:"",qty:-2,balance:2,tech:"A. Reyes",notes:"TK-001548"},
  {id:4,date:"2026-05-10",action:"Adjusted",invoiceNo:"",poNo:"",qty:1,balance:3,tech:"Admin",notes:"Cycle count correction"},
  {id:5,date:"2026-04-30",action:"Returned",invoiceNo:"INV-002",poNo:"PO-7002",qty:2,balance:5,tech:"S. Brown",notes:""},
];

export function PartHistory({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [uniqueId, setUniqueId] = useState("");
  const [tab, setTab] = useState<"history"|"api">("history");
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRefresh = () => { if(uniqueId.trim()) setHasSearched(true); };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        {/* Search bar */}
        <div className="panel mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unique ID</label>
              <input type="text" value={uniqueId} onChange={e=>setUniqueId(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleRefresh()}
                placeholder="" className="glass-input text-sm py-1.5 px-3 rounded-md w-40"/>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide invisible">Search</label>
              <input type="text" placeholder="Invoice # + (item #)" className="glass-input text-sm py-1.5 px-3 rounded-md w-full"/>
            </div>
            <div className="flex items-end pb-0.5">
              <button onClick={handleRefresh} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4">Search</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>setTab("history")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab==="history"?"bg-blue-600 text-white":"btn"}`}>I/O History</button>
          <button onClick={()=>setTab("api")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab==="api"?"bg-blue-600 text-white":"btn"}`}>API Log</button>
        </div>

        {/* Part Inventory Information collapsible */}
        <div className="panel mb-4">
          <button onClick={()=>setInfoExpanded(o=>!o)} className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-blue-400 transition-colors w-full text-left">
            <span className="text-blue-400">↗</span> Part Inventory Information
            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${infoExpanded?"rotate-180":""}`}/>
          </button>
          {infoExpanded && hasSearched && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              {[["Unique ID", uniqueId||"—"],["Part No","—"],["Description","—"],["Vendor","—"],["Location","—"],["On Hand","0"],["Reserved","0"],["Available","0"]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{k}</p><p className="text-sm font-medium">{v}</p></div>
              ))}
            </div>
          )}
          {infoExpanded && !hasSearched && (
            <p className="mt-4 text-sm text-muted-foreground pt-4 border-t border-white/10">Enter a Unique ID to load inventory information.</p>
          )}
        </div>

        {/* History / API Log content */}
        {tab === "history" && (
          <div className="panel overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 bg-white/5">
                {["#","Date","Action","Invoice #","PO #","Qty","Balance","Technician","Notes"].map(h=>(
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {hasSearched
                  ? HISTORY_ROWS.map((r,idx)=>(
                    <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                      <td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.date}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.action==="Received"?"bg-green-500/20 text-green-300 border border-green-500/30":r.action==="Issued"?"bg-blue-500/20 text-blue-300 border border-blue-500/30":r.action==="Returned"?"bg-purple-500/20 text-purple-300 border border-purple-500/30":"bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"}`}>{r.action}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.invoiceNo||"—"}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.poNo||"—"}</td>
                      <td className={`px-3 py-2.5 text-right font-medium ${r.qty>0?"text-green-400":"text-red-400"}`}>{r.qty>0?"+":""}{r.qty}</td>
                      <td className="px-3 py-2.5 text-right">{r.balance}</td>
                      <td className="px-3 py-2.5 text-xs">{r.tech}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.notes||"—"}</td>
                    </tr>
                  ))
                  : <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Enter a Unique ID to view history.</td></tr>
                }
              </tbody>
            </table>
          </div>
        )}

        {tab === "api" && (
          <div className="panel">
            <p className="text-sm text-muted-foreground text-center py-8">{hasSearched ? "No API log entries found for this item." : "Enter a Unique ID to view API log."}</p>
          </div>
        )}
      </main>
    </div>
  );
}
