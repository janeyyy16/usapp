import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const VENDORS = ["Encompass","LG","Marcone","Reliable Parts","Samsung","Others"];
const BRANCH_OPTIONS = ["4930403","6488757","4930404","4930405","4930406","4930407","4930408"];
const PARTS_LIST = ["Drain Pump","Door Gasket","Control Board","Thermistor","Heating Element","Compressor","Inverter Board","Door Switch","Ice Maker","Belt Kit"];

const pad = (n: number) => String(n).padStart(5,"0");
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const ALL_ROWS = Array.from({length:50},(_,i)=>({
  id:i+1, uniqueId:"UID-"+pad(10000+i), partNo:"PT-"+pad(70000+i),
  description:pick(PARTS_LIST,i), vendor:pick(VENDORS,i),
  location:pick(LOCATIONS,i+1), branch:pick(BRANCH_OPTIONS,i),
  onHand:(i*3)%40, reserved:i%5, available:((i*3)%40)-(i%5),
  reorder:5, cost:25+(i*11)%400,
}));

const DROP_STYLE: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:260, overflowY:"auto" };
const Chev = ({open}:{open:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;

function usePortal(open: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{top:number;left:number;width:number}|null>(null);
  const reposition = useCallback(()=>{ if(!ref.current) return; const r=ref.current.getBoundingClientRect(); setPos({top:r.bottom+2,left:r.left,width:r.width}); },[]);
  useLayoutEffect(()=>{ if(open) reposition(); },[open,reposition]);
  useEffect(()=>{ if(!open) return; window.addEventListener("scroll",reposition,true); window.addEventListener("resize",reposition); return()=>{ window.removeEventListener("scroll",reposition,true); window.removeEventListener("resize",reposition); }; },[open,reposition]);
  return {ref, pos};
}

export function PartInventory({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [location, setLocation] = useState(""); const [locOpen, setLocOpen] = useState(false);
  const [vendor, setVendor] = useState(""); const [vendorOpen, setVendorOpen] = useState(false);
  const [branch, setBranch] = useState(""); const [branchOpen, setBranchOpen] = useState(false);
  const [search, setSearch] = useState(""); const [uniqueId, setUniqueId] = useState("");

  const locDrop = usePortal(locOpen); const vendorDrop = usePortal(vendorOpen); const branchDrop = usePortal(branchOpen);
  const locListRef = useRef<HTMLDivElement>(null); const vendorListRef = useRef<HTMLDivElement>(null); const branchListRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{
      const t=e.target as Node;
      if(locOpen&&!locDrop.ref.current?.contains(t)&&!locListRef.current?.contains(t)) setLocOpen(false);
      if(vendorOpen&&!vendorDrop.ref.current?.contains(t)&&!vendorListRef.current?.contains(t)) setVendorOpen(false);
      if(branchOpen&&!branchDrop.ref.current?.contains(t)&&!branchListRef.current?.contains(t)) setBranchOpen(false);
    };
    document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn);
  },[locOpen,vendorOpen,branchOpen]);

  const rows = useMemo(()=>{
    let r=ALL_ROWS;
    if(location) r=r.filter(x=>x.location===location);
    if(vendor) r=r.filter(x=>x.vendor===vendor);
    if(branch) r=r.filter(x=>x.branch===branch);
    if(search) r=r.filter(x=>x.partNo.toLowerCase().includes(search.toLowerCase())||x.description.toLowerCase().includes(search.toLowerCase())||x.uniqueId.toLowerCase().includes(search.toLowerCase()));
    if(uniqueId) r=r.filter(x=>x.uniqueId.toLowerCase().includes(uniqueId.toLowerCase()));
    return r;
  },[location,vendor,branch,search,uniqueId]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></button>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-4">
          <div className="flex flex-wrap items-end gap-3">
            {/* Location */}
            <div className="flex flex-col gap-1 min-w-[160px] flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
              <button ref={locDrop.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={location?"":"text-muted-foreground"}>{location||"All Locations"}</span><Chev open={locOpen}/>
              </button>
              {locOpen&&locDrop.pos&&createPortal(<div ref={locListRef} style={{...DROP_STYLE,top:locDrop.pos.top,left:locDrop.pos.left,width:locDrop.pos.width}}>
                <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Locations —</button>
                {LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
              </div>,document.body)}
            </div>

            {/* Vendor */}
            <div className="flex flex-col gap-1 min-w-[160px] flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vendor</label>
              <button ref={vendorDrop.ref} onClick={()=>setVendorOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={vendor?"":"text-muted-foreground"}>{vendor||"All Vendors"}</span><Chev open={vendorOpen}/>
              </button>
              {vendorOpen&&vendorDrop.pos&&createPortal(<div ref={vendorListRef} style={{...DROP_STYLE,top:vendorDrop.pos.top,left:vendorDrop.pos.left,width:vendorDrop.pos.width}}>
                <button onClick={()=>{setVendor("");setVendorOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${vendor===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Vendors —</button>
                {VENDORS.map((v,i)=><button key={i} onClick={()=>{setVendor(v);setVendorOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${vendor===v?"bg-blue-600 text-white":""}`}>{v}</button>)}
              </div>,document.body)}
            </div>

            {/* Branch */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
              <button ref={branchDrop.ref} onClick={()=>setBranchOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={branch?"":"text-muted-foreground"}>{branch||"All"}</span><Chev open={branchOpen}/>
              </button>
              {branchOpen&&branchDrop.pos&&createPortal(<div ref={branchListRef} style={{...DROP_STYLE,top:branchDrop.pos.top,left:branchDrop.pos.left,width:Math.max(branchDrop.pos.width,160)}}>
                <button onClick={()=>{setBranch("");setBranchOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${branch===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Branches —</button>
                {BRANCH_OPTIONS.map((b,i)=><button key={i} onClick={()=>{setBranch(b);setBranchOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${branch===b?"bg-blue-600 text-white":""}`}>{b}</button>)}
              </div>,document.body)}
            </div>

            {/* Search (slow) */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Search (slow)</label>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="(id, part #, po #, ticket #)" className="glass-input text-sm py-1.5 px-3 rounded-md"/>
            </div>

            {/* Unique ID */}
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unique ID</label>
              <input type="text" value={uniqueId} onChange={e=>setUniqueId(e.target.value)} placeholder="(unique id)" className="glass-input text-sm py-1.5 px-3 rounded-md"/>
            </div>

            <div className="flex items-end gap-2 pb-0.5">
              <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
            <p>*Note 1: Do you want import Encompass parts that is ordered at Encompass web site? Refresh your inventory using Encompass P/O #| button.</p>
            <p>*Note 2: Do you want import LG parts that is ordered at GSFS system? Refresh your inventory using LG P/O #| button.</p>
            <p>*Note 3: Do you want import Marcone parts that is ordered at Marcone web site? Refresh your inventory using Marcone P/O #| button.</p>
            <p>*Note 4: Do you want import Samsung parts that is ordered at GSPN system? Refresh your inventory using Samsung P/O #| button.</p>
          </div>
        </div>

        <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              {["#","Unique ID","Part No","Description","Vendor","Location","Branch","On Hand","Reserved","Available","Reorder","Cost"].map(h=>(
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.length===0
                ? <tr><td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
                : rows.map((r,idx)=>(
                  <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                    <td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.uniqueId}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.partNo}</td>
                    <td className="px-3 py-2.5 text-xs">{r.description}</td>
                    <td className="px-3 py-2.5 text-xs">{r.vendor}</td>
                    <td className="px-3 py-2.5 text-xs">{r.location}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.branch}</td>
                    <td className="px-3 py-2.5 text-right">{r.onHand}</td>
                    <td className="px-3 py-2.5 text-right text-yellow-400">{r.reserved}</td>
                    <td className="px-3 py-2.5 text-right text-green-400">{r.available}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{r.reorder}</td>
                    <td className="px-3 py-2.5 text-right">${r.cost.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
