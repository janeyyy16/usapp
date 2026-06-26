import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:280, overflowY:"auto" };
const Chev = ({o}:{o:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{top:number;left:number;width:number}|null>(null);
  const r = useCallback(() => { if(!ref.current) return; const b = ref.current.getBoundingClientRect(); setPos({top:b.bottom+2,left:b.left,width:b.width}); }, []);
  useLayoutEffect(() => { if(open) r(); }, [open, r]);
  useEffect(() => { if(!open) return; window.addEventListener("scroll",r,true); window.addEventListener("resize",r); return () => { window.removeEventListener("scroll",r,true); window.removeEventListener("resize",r); }; }, [open, r]);
  return { ref, pos };
}

const DELETION_OPTIONS = ["Delete parts not on physical inventory list","Keep all existing parts","Delete parts with 0 quantity only"];
const TODAY = new Date().toISOString().slice(0,10);
const pad = (n:number) => String(n).padStart(5,"0");
const pick = <T,>(a:T[],i:number) => a[i%a.length];
const PARTS = ["Drain Pump","Door Gasket","Control Board","Thermistor","Heating Element","Compressor","Inverter Board","Door Switch","Ice Maker","Belt Kit"];

interface PhysRow { id:number; partNo:string; description:string; systemQty:number; physicalQty:number; variance:number; }

export function PhysicalPartInventory({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [location, setLocation] = useState(""); const [locOpen, setLocOpen] = useState(false);
  const [inventoryDate, setInventoryDate] = useState(TODAY);
  const [deletionOption, setDeletionOption] = useState(""); const [delOpen, setDelOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [rows, setRows] = useState<PhysRow[]>([]);

  const locD = useP(locOpen); const delD = useP(delOpen);
  const locL = useRef<HTMLDivElement>(null); const delL = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (locOpen && !locD.ref.current?.contains(t) && !locL.current?.contains(t)) setLocOpen(false);
      if (delOpen && !delD.ref.current?.contains(t) && !delL.current?.contains(t)) setDelOpen(false);
    };
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, [locOpen, delOpen]);

  const handleRefresh = () => {
    if (!location) return;
    const generated = Array.from({length:20},(_,i) => {
      const sys = 5+(i*3)%40;
      const phys = sys + (i%3===0?-1:i%5===0?1:0);
      return { id:i+1, partNo:"PT-"+pad(70000+i), description:pick(PARTS,i), systemQty:sys, physicalQty:phys, variance:phys-sys };
    });
    setRows(generated); setHasLoaded(true);
  };

  const updatePhysical = (id:number, val:number) => setRows(r => r.map(row => row.id===id ? {...row, physicalQty:val, variance:val-row.systemQty} : row));

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Location */}
            <div className="flex flex-col gap-1 min-w-[180px] flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location*</label>
              <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={location?"":"text-muted-foreground"}>{location||"Select Location"}</span><Chev o={locOpen}/>
              </button>
              {locOpen && locD.pos && createPortal(
                <div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}>
                  <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— Select —</button>
                  {LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
                </div>, document.body
              )}
            </div>

            {/* Inventory Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inventory Date*</label>
              <input type="date" value={inventoryDate} onChange={e=>setInventoryDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-36"/>
            </div>

            {/* Step buttons */}
            <div className="flex items-end gap-2 pb-0.5">
              <button onClick={handleRefresh} disabled={!location} className={`px-4 py-1.5 rounded-md text-sm font-medium ${location?"bg-blue-600 hover:bg-blue-700 text-white":"bg-white/10 text-muted-foreground cursor-not-allowed"}`}>1. Refresh</button>
              <button disabled={!hasLoaded} className={`px-4 py-1.5 rounded-md text-sm font-medium ${hasLoaded?"bg-blue-600 hover:bg-blue-700 text-white":"bg-white/10 text-muted-foreground cursor-not-allowed"}`}>2. Submit</button>
            </div>

            {/* Deletion option */}
            <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide invisible">Del</label>
              <button ref={delD.ref} onClick={()=>setDelOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={deletionOption?"":"text-muted-foreground"}>{deletionOption||"(choose deletion option)"}</span><Chev o={delOpen}/>
              </button>
              {delOpen && delD.pos && createPortal(
                <div ref={delL} style={{...DS,top:delD.pos.top,left:delD.pos.left,width:Math.max(delD.pos.width,320)}}>
                  <button onClick={()=>{setDeletionOption("");setDelOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${deletionOption===""?"bg-blue-600 text-white":"text-slate-400"}`}>— choose deletion option —</button>
                  {DELETION_OPTIONS.map((d,i)=><button key={i} onClick={()=>{setDeletionOption(d);setDelOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${deletionOption===d?"bg-blue-600 text-white":""}`}>{d}</button>)}
                </div>, document.body
              )}
            </div>

            <div className="flex items-end pb-0.5">
              <button disabled={!hasLoaded||!deletionOption} className={`px-4 py-1.5 rounded-md text-sm font-medium ${hasLoaded&&deletionOption?"bg-slate-600 hover:bg-slate-500 text-white":"bg-white/10 text-muted-foreground cursor-not-allowed"}`}>3. Apply to Inventory</button>
            </div>
          </div>
        </div>

        {hasLoaded ? (
          <>
            <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
            <div className="panel overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 bg-white/5">
                  {["#","Part No","Description","System Qty","Physical Qty","Variance"].map(h=>(
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.map((r,idx) => (
                    <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                      <td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.partNo}</td>
                      <td className="px-3 py-2.5 text-xs">{r.description}</td>
                      <td className="px-3 py-2.5 text-right">{r.systemQty}</td>
                      <td className="px-3 py-2.5 text-right">
                        <input type="number" value={r.physicalQty} min={0} onChange={e=>updatePhysical(r.id,+e.target.value)}
                          className="glass-input text-sm py-0.5 px-1 rounded w-16 text-right"/>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium ${r.variance>0?"text-green-400":r.variance<0?"text-red-400":""}`}>
                        {r.variance===0?"—":r.variance>0?`+${r.variance}`:r.variance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="panel p-8 text-center text-sm text-muted-foreground">Select a location and click <strong>1. Refresh</strong> to load inventory for physical counting.</div>
        )}
      </main>
    </div>
  );
}
