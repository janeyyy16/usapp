import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import { ALL_TECHNICIANS, LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const PART_DIST_OPTIONS = ["LG","Encompass","SS","Marcone-162468","Encompass-Birmingham/Montgomery"];
const REPAIR_STATUSES = [
  "CL-Need Cancel","CL-Parts Back Ordered","CL-Ready to Complete",
  "CSR-Acknowledged","CSR-Assigned to ASC","CSR-Left Message for Cx","CSR-Needs Scheduling",
  "OP-Ready for Service","OP-Reschedule Follow up","OP-Update Hold","OP-Waiting for Part",
  "PT-Need PreAuthorization","TR-Need PO","TR-Need Triage",
];
const TODAY = new Date().toISOString().slice(0,10);
const SAMPLE_ORDERS = [
  { ticketNo:"TK-001549", status:"Need PO", partDist:"LG", partNo:"ACQ86576404", description:"Compressor Motor", requestQty:1, availQty:0, eta:"2026-06-05" },
  { ticketNo:"TK-001548", status:"Need PO", partDist:"Encompass", partNo:"WPW10217825", description:"Wire Harness", requestQty:2, availQty:1, eta:"" },
  { ticketNo:"TK-001547", status:"Need PO", partDist:"SS", partNo:"RPS345-78", description:"Pump Assembly", requestQty:1, availQty:0, eta:"2026-06-10" },
  { ticketNo:"TK-001546", status:"Need PO", partDist:"Marcone-162468", partNo:"EVT456-12", description:"Evaporator Coil", requestQty:1, availQty:0, eta:"" },
  { ticketNo:"TK-001545", status:"Need PO", partDist:"LG", partNo:"LG123-456", description:"Door Seal", requestQty:1, availQty:1, eta:"2026-06-08" },
];

const DROP_STYLE: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:260, overflowY:"auto" };

function useDropdown(open: boolean) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{top:number;left:number;width:number}|null>(null);
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 2, left: r.left, width: r.width });
  }, []);
  useLayoutEffect(() => { if (open) reposition(); }, [open, reposition]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => { window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); };
  }, [open, reposition]);
  return { triggerRef, pos };
}

const Chevron = ({open}:{open:boolean}) => (
  <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform flex-shrink-0 ${open?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
);

export function PartOrder({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [location, setLocation] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [partDist, setPartDist] = useState("");
  const [distOpen, setDistOpen] = useState(false);
  const [technician, setTechnician] = useState("");
  const [techOpen, setTechOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(TODAY);
  const [dateMode, setDateMode] = useState<"past"|"noSchedule"|"allNeedPO">("allNeedPO");
  const [includeUnapproved, setIncludeUnapproved] = useState(false);

  const locDrop = useDropdown(locOpen);
  const distDrop = useDropdown(distOpen);
  const techDrop = useDropdown(techOpen);
  const statusDrop = useDropdown(statusOpen);

  const locListRef = useRef<HTMLDivElement>(null);
  const distListRef = useRef<HTMLDivElement>(null);
  const techListRef = useRef<HTMLDivElement>(null);
  const statusListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (locOpen && !locDrop.triggerRef.current?.contains(t) && !locListRef.current?.contains(t)) setLocOpen(false);
      if (distOpen && !distDrop.triggerRef.current?.contains(t) && !distListRef.current?.contains(t)) setDistOpen(false);
      if (techOpen && !techDrop.triggerRef.current?.contains(t) && !techListRef.current?.contains(t)) setTechOpen(false);
      if (statusOpen && !statusDrop.triggerRef.current?.contains(t) && !statusListRef.current?.contains(t)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [locOpen, distOpen, techOpen, statusOpen]);

  const allSelected = selectedStatuses.length === REPAIR_STATUSES.length;
  const toggleStatus = (s: string) => setSelectedStatuses(p => p.includes(s) ? p.filter(x=>x!==s) : [...p, s]);
  const toggleAll = () => setSelectedStatuses(allSelected ? [] : [...REPAIR_STATUSES]);
  const statusDisplay = !selectedStatuses.length ? "" : allSelected ? "All Statuses" : selectedStatuses.length <= 2 ? selectedStatuses.join(", ") : `${selectedStatuses.length} selected`;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></button>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

            {/* Location */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location*</label>
              <button ref={locDrop.triggerRef} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={location?"":"text-muted-foreground"}>{location||"Select Location"}</span><Chevron open={locOpen}/>
              </button>
              {locOpen && locDrop.pos && createPortal(
                <div ref={locListRef} style={{...DROP_STYLE, top:locDrop.pos.top, left:locDrop.pos.left, width:locDrop.pos.width}}>
                  <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— Select Location —</button>
                  {LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
                </div>, document.body
              )}
            </div>

            {/* Part Dist */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part Dist.</label>
              <button ref={distDrop.triggerRef} onClick={()=>setDistOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={partDist?"":"text-muted-foreground"}>{partDist||"All Distributors"}</span><Chevron open={distOpen}/>
              </button>
              {distOpen && distDrop.pos && createPortal(
                <div ref={distListRef} style={{...DROP_STYLE, top:distDrop.pos.top, left:distDrop.pos.left, width:distDrop.pos.width}}>
                  <button onClick={()=>{setPartDist("");setDistOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${partDist===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Distributors —</button>
                  {PART_DIST_OPTIONS.map((d,i)=><button key={i} onClick={()=>{setPartDist(d);setDistOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${partDist===d?"bg-blue-600 text-white":""}`}>{d}</button>)}
                </div>, document.body
              )}
            </div>

            {/* Technician */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technician</label>
              <button ref={techDrop.triggerRef} onClick={()=>setTechOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={technician?"":"text-muted-foreground"}>{technician||"All Technicians"}</span><Chevron open={techOpen}/>
              </button>
              {techOpen && techDrop.pos && createPortal(
                <div ref={techListRef} style={{...DROP_STYLE, top:techDrop.pos.top, left:techDrop.pos.left, width:techDrop.pos.width}}>
                  <button onClick={()=>{setTechnician("");setTechOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${technician===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Technicians —</button>
                  {ALL_TECHNICIANS.map((t,i)=><button key={i} onClick={()=>{setTechnician(t);setTechOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${technician===t?"bg-blue-600 text-white":""}`}>{t}</button>)}
                </div>, document.body
              )}
            </div>

            {/* Repair Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Repair Status</label>
              <button ref={statusDrop.triggerRef} onClick={()=>setStatusOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={statusDisplay?"":"text-muted-foreground truncate"}>{statusDisplay||"Select statuses…"}</span><Chevron open={statusOpen}/>
              </button>
              {statusOpen && statusDrop.pos && createPortal(
                <div ref={statusListRef} style={{...DROP_STYLE, top:statusDrop.pos.top, left:statusDrop.pos.left, width:Math.max(statusDrop.pos.width, 288)}}>
                  <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 cursor-pointer border-b border-white/10 font-medium">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-blue-500"/>[ Select All ]
                  </label>
                  {REPAIR_STATUSES.map(s=>(
                    <label key={s} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 cursor-pointer">
                      <input type="checkbox" checked={selectedStatuses.includes(s)} onChange={()=>toggleStatus(s)} className="accent-blue-500"/>{s}
                    </label>
                  ))}
                </div>, document.body
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Schedule Date*</label>
              <input type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-36"/>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="date-mode" checked={dateMode==="past"} onChange={()=>setDateMode("past")} className="accent-blue-500"/>Past Schedule Date</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="date-mode" checked={dateMode==="noSchedule"} onChange={()=>setDateMode("noSchedule")} className="accent-blue-500"/>No Schedule Date</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="date-mode" checked={dateMode==="allNeedPO"} onChange={()=>setDateMode("allNeedPO")} className="accent-blue-500"/>All Need PO</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={includeUnapproved} onChange={e=>setIncludeUnapproved(e.target.checked)} className="accent-blue-500"/>Include Unapproved Parts</label>
            </div>
            <div className="flex items-center gap-2 ml-auto mt-4">
              <button className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save & PO</button>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium">Warranty Type*:</span> Concession LP, Concession L, Concession P, In warranty, Labor only Wty, Out-of-warranty, Part only Wty, Special Part 5 year, Unknown, Ext Wty, Ext Labor Wty, Ext Part Wty
          </div>
        </div>

        <div className="panel overflow-x-auto p-0">
          <div className="flex items-center justify-end px-4 py-3 border-b border-white/10">
            <button className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save & PO</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Ticket #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Part Dist.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Part No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase" colSpan={2}>ETA on Inventory</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase" colSpan={2}>Action</th>
              </tr>
              <tr className="border-b border-white/10 bg-white/3">
                <th colSpan={5}></th>
                <th className="px-3 py-1.5 text-xs text-muted-foreground text-center border-l border-white/10">Request</th>
                <th className="px-3 py-1.5 text-xs text-muted-foreground text-center border-l border-white/10">Avail.</th>
                <th className="px-3 py-1.5 text-xs text-muted-foreground text-center border-l border-white/10">Reserve</th>
                <th className="px-3 py-1.5 text-xs text-muted-foreground text-center border-l border-white/10">Manual P/O</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ORDERS.map((o,idx)=>(
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2.5 font-mono text-blue-400">{o.ticketNo}</td>
                  <td className="px-4 py-2.5 text-blue-300">{o.status}</td>
                  <td className="px-4 py-2.5">{o.partDist}</td>
                  <td className="px-4 py-2.5 font-mono">{o.partNo}</td>
                  <td className="px-4 py-2.5">{o.description}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{o.requestQty}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{o.availQty}</td>
                  <td className="px-4 py-2.5 text-center"><button onClick={()=>alert(`Reserve: ${o.ticketNo}`)} className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30">Reserve</button></td>
                  <td className="px-4 py-2.5 text-center"><button disabled={!o.eta} onClick={()=>alert(`Manual PO: ${o.ticketNo}`)} className={`px-2 py-1 text-xs rounded ${o.eta?"bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30":"bg-white/5 text-muted-foreground border border-white/10 opacity-40 cursor-not-allowed"}`}>Manual P/O</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
