import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Printer, Save } from "lucide-react";
import { LOCATIONS, ALL_TECHNICIANS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS:React.CSSProperties={background:"rgb(22,28,52)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999999,position:"fixed",maxHeight:260,overflowY:"auto"};
const Chev=({o}:{o:boolean})=><svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open:boolean){const ref=useRef<HTMLButtonElement>(null);const [pos,setPos]=useState<any>(null);const r=useCallback(()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:b.bottom+2,left:b.left,width:b.width});},[]);useLayoutEffect(()=>{if(open)r();},[open,r]);useEffect(()=>{if(!open)return;window.addEventListener("scroll",r,true);window.addEventListener("resize",r);return()=>{window.removeEventListener("scroll",r,true);window.removeEventListener("resize",r);};},[open,r]);return{ref,pos};}

const ZONES=["Zone A","Zone B","Zone C","Zone D","Zone E"];
const PICKUP_MODES=["Pickup","Collect"];
const TODAY=new Date().toISOString().slice(0,10);

export function PartDailyPickup({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [location,setLocation]=useState("");const [locOpen,setLocOpen]=useState(false);
  const [zone,setZone]=useState("");const [zoneOpen,setZoneOpen]=useState(false);
  const [tech,setTech]=useState("");const [techOpen,setTechOpen]=useState(false);
  const [pickupMode,setPickupMode]=useState("Pickup");const [pmOpen,setPmOpen]=useState(false);
  const [pickupDate,setPickupDate]=useState(TODAY);
  const [notPickedUp,setNotPickedUp]=useState(true);const [pickedUp,setPickedUp]=useState(true);
  const [groupView,setGroupView]=useState(true);const [scanInput,setScanInput]=useState("");
  const locD=useP(locOpen);const zoneD=useP(zoneOpen);const techD=useP(techOpen);const pmD=useP(pmOpen);
  const locL=useRef<HTMLDivElement>(null);const zoneL=useRef<HTMLDivElement>(null);const techL=useRef<HTMLDivElement>(null);const pmL=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{const t=e.target as Node;
    if(locOpen&&!locD.ref.current?.contains(t)&&!locL.current?.contains(t))setLocOpen(false);
    if(zoneOpen&&!zoneD.ref.current?.contains(t)&&!zoneL.current?.contains(t))setZoneOpen(false);
    if(techOpen&&!techD.ref.current?.contains(t)&&!techL.current?.contains(t))setTechOpen(false);
    if(pmOpen&&!pmD.ref.current?.contains(t)&&!pmL.current?.contains(t))setPmOpen(false);
  };document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[locOpen,zoneOpen,techOpen,pmOpen]);

  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[140px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location*</label>
          <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={location?"":"text-muted-foreground"}>{location||"Select"}</span><Chev o={locOpen}/></button>
          {locOpen&&locD.pos&&createPortal(<div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}><button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}</div>,document.body)}
        </div>
        <div className="flex flex-col gap-1 min-w-[120px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone</label>
          <button ref={zoneD.ref} onClick={()=>setZoneOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={zone?"":"text-muted-foreground"}>{zone||"All"}</span><Chev o={zoneOpen}/></button>
          {zoneOpen&&zoneD.pos&&createPortal(<div ref={zoneL} style={{...DS,top:zoneD.pos.top,left:zoneD.pos.left,width:Math.max(zoneD.pos.width,140)}}><button onClick={()=>{setZone("");setZoneOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${zone===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{ZONES.map((z,i)=><button key={i} onClick={()=>{setZone(z);setZoneOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${zone===z?"bg-blue-600 text-white":""}`}>{z}</button>)}</div>,document.body)}
        </div>
        <div className="flex flex-col gap-1 min-w-[160px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technician</label>
          <button ref={techD.ref} onClick={()=>setTechOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={tech?"":"text-muted-foreground"}>{tech||"All"}</span><Chev o={techOpen}/></button>
          {techOpen&&techD.pos&&createPortal(<div ref={techL} style={{...DS,top:techD.pos.top,left:techD.pos.left,width:techD.pos.width}}><button onClick={()=>{setTech("");setTechOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${tech===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{ALL_TECHNICIANS.map((t,i)=><button key={i} onClick={()=>{setTech(t);setTechOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${tech===t?"bg-blue-600 text-white":""}`}>{t}</button>)}</div>,document.body)}
        </div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pickup Date*</label><input type="date" value={pickupDate} onChange={e=>setPickupDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/></div>
        <div className="flex items-end gap-3 pb-0.5">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={notPickedUp} onChange={e=>setNotPickedUp(e.target.checked)} className="accent-blue-500"/>Not Picked up</label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={pickedUp} onChange={e=>setPickedUp(e.target.checked)} className="accent-blue-500"/>Picked up</label>
          <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
          <button className="btn flex items-center gap-2 px-4"><Printer className="h-3.5 w-3.5"/>Print</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={groupView} onChange={e=>setGroupView(e.target.checked)} className="accent-blue-500"/>Group View</label>
        <span className="text-muted-foreground text-sm">›</span>
        <div className="flex items-center gap-1">
          <button ref={pmD.ref} onClick={()=>setPmOpen(o=>!o)} className="glass-input text-sm py-1 px-3 rounded-md flex items-center gap-2"><span>{pickupMode}</span><Chev o={pmOpen}/></button>
          {pmOpen&&pmD.pos&&createPortal(<div ref={pmL} style={{...DS,top:pmD.pos.top,left:pmD.pos.left,width:pmD.pos.width}}>{PICKUP_MODES.map((m,i)=><button key={i} onClick={()=>{setPickupMode(m);setPmOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${pickupMode===m?"bg-blue-600 text-white":""}`}>{m}</button>)}</div>,document.body)}
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase">Scan Parts Here</span>
        <input value={scanInput} onChange={e=>setScanInput(e.target.value)} placeholder="Invoice + (Item) #" className="glass-input text-sm py-1.5 px-3 rounded-md flex-1"/>
        <button className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 text-sm">Add Part</button>
      </div>
    </div>
    <div className="panel p-8 text-center text-sm text-muted-foreground">Select location and date to load pickup data.</div>
    <div className="flex justify-center mt-4"><button className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-8"><Save className="h-3.5 w-3.5"/>Save</button></div>
  </main></div>);}
