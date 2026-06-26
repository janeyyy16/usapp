import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS:React.CSSProperties={background:"rgb(22,28,52)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999999,position:"fixed",maxHeight:260,overflowY:"auto"};
const Chev=({o}:{o:boolean})=><svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open:boolean){const ref=useRef<HTMLButtonElement>(null);const [pos,setPos]=useState<any>(null);const r=useCallback(()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:b.bottom+2,left:b.left,width:b.width});},[]);useLayoutEffect(()=>{if(open)r();},[open,r]);useEffect(()=>{if(!open)return;window.addEventListener("scroll",r,true);window.addEventListener("resize",r);return()=>{window.removeEventListener("scroll",r,true);window.removeEventListener("resize",r);};},[open,r]);return{ref,pos};}

const SCAN_TYPES=["Replace Whole Parts","Partial Replace","Review Only"];

export function PartLotScan({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [location,setLocation]=useState("");const [locOpen,setLocOpen]=useState(false);
  const [lotType,setLotType]=useState<"lotno"|"review"|"defect"|"pnn">("lotno");
  const [lotNo,setLotNo]=useState("");
  const [scanType,setScanType]=useState("Replace Whole Parts");const [stOpen,setStOpen]=useState(false);
  const locD=useP(locOpen);const stD=useP(stOpen);
  const locL=useRef<HTMLDivElement>(null);const stL=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{const t=e.target as Node;
    if(locOpen&&!locD.ref.current?.contains(t)&&!locL.current?.contains(t))setLocOpen(false);
    if(stOpen&&!stD.ref.current?.contains(t)&&!stL.current?.contains(t))setStOpen(false);
  };document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[locOpen,stOpen]);
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4"><div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 min-w-[160px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
        <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={location?"":"text-muted-foreground"}>{location||"All"}</span><Chev o={locOpen}/></button>
        {locOpen&&locD.pos&&createPortal(<div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}><button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}</div>,document.body)}
      </div>
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lot Type</label>
        <div className="flex items-center gap-4 py-1.5">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="lot-type" checked={lotType==="lotno"} onChange={()=>setLotType("lotno")} className="accent-blue-500"/>
            {lotType==="lotno"?<input value={lotNo} onChange={e=>setLotNo(e.target.value)} placeholder="(lot no)" className="glass-input text-sm py-0.5 px-2 rounded w-24"/>:<span className="text-muted-foreground text-xs">(lot no)</span>}
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="lot-type" checked={lotType==="review"} onChange={()=>setLotType("review")} className="accent-blue-500"/>Review Lot</label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="lot-type" checked={lotType==="defect"} onChange={()=>setLotType("defect")} className="accent-blue-500"/>Defect Lot</label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="radio" name="lot-type" checked={lotType==="pnn"} onChange={()=>setLotType("pnn")} className="accent-blue-500"/>PNN Lot</label>
        </div>
      </div>
      <div className="flex flex-col gap-1 min-w-[180px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scan Type</label>
        <button ref={stD.ref} onClick={()=>setStOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span>{scanType}</span><Chev o={stOpen}/></button>
        {stOpen&&stD.pos&&createPortal(<div ref={stL} style={{...DS,top:stD.pos.top,left:stD.pos.left,width:stD.pos.width}}>{SCAN_TYPES.map((s,i)=><button key={i} onClick={()=>{setScanType(s);setStOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${scanType===s?"bg-blue-600 text-white":""}`}>{s}</button>)}</div>,document.body)}
      </div>
      <button className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 mb-0.5"><Save className="h-3.5 w-3.5"/>Save</button>
    </div></div>
    <div className="panel p-8 text-center text-sm text-muted-foreground">Select a location and lot type to begin scanning.</div>
  </main></div>);}
