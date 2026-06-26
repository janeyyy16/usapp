import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const BRANCH_OPTIONS = ["4930403","6488757","4930404","4930405","4930406","4930407","4930408"];
const pad = (n: number, len = 4) => String(n).padStart(len, "0");
const dateStr = (offset: number) => { const d = new Date(); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); };
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const VENDORS = ["Encompass","Marcone","LG","Samsung","Whirlpool","GE","Electrolux","NSA"];
const PART_DESCS = ["Compressor Motor","Wire Harness","Pump Assembly","Control Board","Door Gasket","Heating Element","Ice Maker","Thermistor"];
const STATUSES_PO = ["Open","Partial","Closed","Cancelled"];
const ALL_ROWS = Array.from({length:30},(_,i)=>({
  id:i+1, poNo:"PO-"+pad(7000+i), poDate:dateStr(-(i%30)-1),
  location:pick(LOCATIONS,i+1), branch:pick(BRANCH_OPTIONS,i),
  ticketNo:i%3===0?"TK-2026-"+pad(1000+i):"",
  partNo:"PT-"+pad(70000+i), description:pick(PART_DESCS,i), vendor:pick(VENDORS,i),
  qty:1+(i%6), unitCost:40+(i*23)%500, total:(1+(i%6))*(40+(i*23)%500),
  eta:i%4===0?"":dateStr(5+(i%14)), status:pick(STATUSES_PO,i), deliveryNotReady:i%3!==0,
}));

const DROP_STYLE: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:260, overflowY:"auto" };
const Chevron = ({open}:{open:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;

function usePortalPos(open: boolean) {
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

export function PoStatus({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [location, setLocation] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [branch, setBranch] = useState("");
  const [branchOpen, setBranchOpen] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [startDate, setStartDate] = useState(dateStr(-7));
  const [endDate, setEndDate] = useState(dateStr(0));
  const [deliveryNotReadyOnly, setDeliveryNotReadyOnly] = useState(true);

  const locDrop = usePortalPos(locOpen);
  const branchDrop = usePortalPos(branchOpen);
  const locListRef = useRef<HTMLDivElement>(null);
  const branchListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (locOpen && !locDrop.triggerRef.current?.contains(t) && !locListRef.current?.contains(t)) setLocOpen(false);
      if (branchOpen && !branchDrop.triggerRef.current?.contains(t) && !branchListRef.current?.contains(t)) setBranchOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [locOpen, branchOpen]);

  const STATUS_CHIP: Record<string,string> = {
    Open:"bg-blue-500/20 text-blue-300 border border-blue-500/30",
    Partial:"bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    Closed:"bg-green-500/20 text-green-300 border border-green-500/30",
    Cancelled:"bg-red-500/20 text-red-300 border border-red-500/30",
  };

  const rows = useMemo(() => {
    let r = ALL_ROWS;
    if (location) r = r.filter(x=>x.location===location);
    if (branch) r = r.filter(x=>x.branch===branch);
    if (ticketNo) r = r.filter(x=>x.ticketNo.includes(ticketNo));
    if (poNo) r = r.filter(x=>x.poNo.includes(poNo));
    if (startDate) r = r.filter(x=>x.poDate>=startDate);
    if (endDate) r = r.filter(x=>x.poDate<=endDate);
    if (deliveryNotReadyOnly) r = r.filter(x=>x.deliveryNotReady);
    return r;
  }, [location, branch, ticketNo, poNo, startDate, endDate, deliveryNotReadyOnly]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module/$submodule" params={{ module: "dashboard", submodule: "parts-dashboard" }} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-5">
          <div className="flex flex-wrap items-end gap-3">
            {/* Location */}
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
              <button ref={locDrop.triggerRef} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={location?"":"text-muted-foreground"}>{location||"All Locations"}</span><Chevron open={locOpen}/>
              </button>
              {locOpen && locDrop.pos && createPortal(
                <div ref={locListRef} style={{...DROP_STYLE, top:locDrop.pos.top, left:locDrop.pos.left, width:locDrop.pos.width}}>
                  <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Locations —</button>
                  {LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
                </div>, document.body
              )}
            </div>

            {/* P/O Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">P/O Date</label>
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/>
                <span className="text-muted-foreground text-xs">~</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/>
              </div>
            </div>

            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={deliveryNotReadyOnly} onChange={e=>setDeliveryNotReadyOnly(e.target.checked)} className="accent-blue-500"/>Delivery not ready parts only (No-Invoice)
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 mt-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">P/O No</label>
              <input type="text" value={poNo} onChange={e=>setPoNo(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
            </div>

            {/* Branch */}
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
              <button ref={branchDrop.triggerRef} onClick={()=>setBranchOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={branch?"":"text-muted-foreground"}>{branch||"All Branches"}</span><Chevron open={branchOpen}/>
              </button>
              {branchOpen && branchDrop.pos && createPortal(
                <div ref={branchListRef} style={{...DROP_STYLE, top:branchDrop.pos.top, left:branchDrop.pos.left, width:branchDrop.pos.width}}>
                  <button onClick={()=>{setBranch("");setBranchOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${branch===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Branches —</button>
                  {BRANCH_OPTIONS.map((b,i)=><button key={i} onClick={()=>{setBranch(b);setBranchOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${branch===b?"bg-blue-600 text-white":""}`}>{b}</button>)}
                </div>, document.body
              )}
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ticket No</label>
              <input type="text" value={ticketNo} onChange={e=>setTicketNo(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
            </div>
          </div>
        </div>

        <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              {["#","PO No","PO Date","Location","Branch","Ticket No","Part No","Description","Vendor","Qty","Unit Cost","Total","ETA","Status"].map(h=>(
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.length===0
                ? <tr><td colSpan={14} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
                : rows.map((r,idx)=>(
                  <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                    <td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.poNo}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.poDate}</td>
                    <td className="px-3 py-2.5">{r.location}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.branch}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.ticketNo||"—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.partNo}</td>
                    <td className="px-3 py-2.5 text-xs">{r.description}</td>
                    <td className="px-3 py-2.5 text-xs">{r.vendor}</td>
                    <td className="px-3 py-2.5 text-right">{r.qty}</td>
                    <td className="px-3 py-2.5 text-right">${r.unitCost.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-medium">${r.total.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.eta||"—"}</td>
                    <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_CHIP[r.status]||""}`}>{r.status}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
