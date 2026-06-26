import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS:React.CSSProperties={background:"rgb(22,28,52)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999999,position:"fixed",maxHeight:260,overflowY:"auto"};
const Chev=({o}:{o:boolean})=><svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open:boolean){const ref=useRef<HTMLButtonElement>(null);const [pos,setPos]=useState<any>(null);const r=useCallback(()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:b.bottom+2,left:b.left,width:b.width});},[]);useLayoutEffect(()=>{if(open)r();},[open,r]);useEffect(()=>{if(!open)return;window.addEventListener("scroll",r,true);window.addEventListener("resize",r);return()=>{window.removeEventListener("scroll",r,true);window.removeEventListener("resize",r);};},[open,r]);return{ref,pos};}

const DATE_TYPES=["Recieve Date","PO Date"];
const TODAY=new Date().toISOString().slice(0,10);
const ds=(o:number)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10);};
const pad=(n:number)=>String(n).padStart(5,"0");
const pick=<T,>(a:T[],i:number)=>a[i%a.length];
const PARTS=["Drain Pump","Door Gasket","Control Board","Thermistor","Heating Element","Compressor","Inverter Board","Door Switch"];
const STATUSES=["Reserved","Returned","Adjusted","Used"];
const ALL=Array.from({length:25},(_,i)=>({id:i+1,uniqueId:"UID-"+pad(10000+i),partNo:"PT-"+pad(70000+i),description:pick(PARTS,i),location:pick(LOCATIONS.slice(1),i),receiveDate:ds(-(i%30)),status:pick(STATUSES,i),ticketNo:i%3===0?"TK-2026-"+pad(1000+i):""}));

export function PartFootprint({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [location,setLocation]=useState("");const [locOpen,setLocOpen]=useState(false);
  const [dateType,setDateType]=useState("Recieve Date");const [dtOpen,setDtOpen]=useState(false);
  const [startDate,setStartDate]=useState(ds(-1));const [endDate,setEndDate]=useState(TODAY);
  const [partNo,setPartNo]=useState("");const [uniqueId,setUniqueId]=useState("");
  const locD=useP(locOpen);const dtD=useP(dtOpen);
  const locL=useRef<HTMLDivElement>(null);const dtL=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{const t=e.target as Node;
    if(locOpen&&!locD.ref.current?.contains(t)&&!locL.current?.contains(t))setLocOpen(false);
    if(dtOpen&&!dtD.ref.current?.contains(t)&&!dtL.current?.contains(t))setDtOpen(false);
  };document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[locOpen,dtOpen]);
  const rows=ALL.filter(r=>{if(location&&r.location!==location)return false;if(partNo&&!r.partNo.toLowerCase().includes(partNo.toLowerCase()))return false;if(uniqueId&&!r.uniqueId.toLowerCase().includes(uniqueId.toLowerCase()))return false;return true;});
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[160px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
          <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={location?"":"text-muted-foreground"}>{location||"All Locations"}</span><Chev o={locOpen}/></button>
          {locOpen&&locD.pos&&createPortal(<div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}><button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}</div>,document.body)}
        </div>
        <div className="flex flex-col gap-1 min-w-[130px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date Type</label>
          <button ref={dtD.ref} onClick={()=>setDtOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span>{dateType}</span><Chev o={dtOpen}/></button>
          {dtOpen&&dtD.pos&&createPortal(<div ref={dtL} style={{...DS,top:dtD.pos.top,left:dtD.pos.left,width:dtD.pos.width}}>{DATE_TYPES.map((d,i)=><button key={i} onClick={()=>{setDateType(d);setDtOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${dateType===d?"bg-blue-600 text-white":""}`}>{d}</button>)}</div>,document.body)}
        </div>
        <div className="flex items-center gap-2 mt-4"><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/><span className="text-muted-foreground text-xs">~</span><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/></div>
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part No</label><input value={partNo} onChange={e=>setPartNo(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unique ID</label><input value={uniqueId} onChange={e=>setUniqueId(e.target.value)} placeholder="Invoice # + (item #)" className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
      </div>
    </div>
    <div className="panel mb-4 py-2 px-4 text-xs text-muted-foreground space-y-0.5">
      <p>*Note 1: Part Footprint shows the current status of a part after receiving. Shows reserved, returned and adjusted (except physical inventory) status only.</p>
      <p>*Note 2: If a part was received, but not reserved, not returned, not adjusted yet, then the parts won't be shown in this page.</p>
    </div>
    <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
    <div className="panel overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5">{["#","Unique ID","Part No","Description","Location","Receive Date","Status","Ticket No"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,idx)=><tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}><td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td><td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.uniqueId}</td><td className="px-3 py-2.5 font-mono text-xs">{r.partNo}</td><td className="px-3 py-2.5 text-xs">{r.description}</td><td className="px-3 py-2.5 text-xs">{r.location}</td><td className="px-3 py-2.5 text-xs text-muted-foreground">{r.receiveDate}</td><td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status==="Reserved"?"bg-blue-500/20 text-blue-300 border border-blue-500/30":r.status==="Returned"?"bg-purple-500/20 text-purple-300 border border-purple-500/30":r.status==="Used"?"bg-green-500/20 text-green-300 border border-green-500/30":"bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"}`}>{r.status}</span></td><td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.ticketNo||"—"}</td></tr>)}</tbody></table></div>
  </main></div>);}
