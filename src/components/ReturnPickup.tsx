import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS:React.CSSProperties={background:"rgb(22,28,52)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999999,position:"fixed",maxHeight:260,overflowY:"auto"};
const Chev=({o}:{o:boolean})=><svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open:boolean){const ref=useRef<HTMLButtonElement>(null);const [pos,setPos]=useState<any>(null);const r=useCallback(()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:b.bottom+2,left:b.left,width:b.width});},[]);useLayoutEffect(()=>{if(open)r();},[open,r]);useEffect(()=>{if(!open)return;window.addEventListener("scroll",r,true);window.addEventListener("resize",r);return()=>{window.removeEventListener("scroll",r,true);window.removeEventListener("resize",r);};},[open,r]);return{ref,pos};}

const BRANCHES=["4930403","6488757","4930404","4930405","4930406","4930407","4930408"];

export function ReturnPickup({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [branch,setBranch]=useState("");const [branchOpen,setBranchOpen]=useState(false);
  const [raNo,setRaNo]=useState("");const [invoiceNo,setInvoiceNo]=useState("");
  const branchD=useP(branchOpen);const branchL=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{const t=e.target as Node;if(branchOpen&&!branchD.ref.current?.contains(t)&&!branchL.current?.contains(t))setBranchOpen(false);};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[branchOpen]);
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[200px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch*</label>
          <button ref={branchD.ref} onClick={()=>setBranchOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={branch?"":"text-muted-foreground"}>{branch||"Select Branch"}</span><Chev o={branchOpen}/></button>
          {branchOpen&&branchD.pos&&createPortal(<div ref={branchL} style={{...DS,top:branchD.pos.top,left:branchD.pos.left,width:branchD.pos.width}}><button onClick={()=>{setBranch("");setBranchOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${branch===""?"bg-blue-600 text-white":"text-slate-400"}`}>— Select —</button>{BRANCHES.map((b,i)=><button key={i} onClick={()=>{setBranch(b);setBranchOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${branch===b?"bg-blue-600 text-white":""}`}>{b}</button>)}</div>,document.body)}
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <button className="btn bg-blue-600 hover:bg-blue-700 text-white px-4">Refresh</button>
          <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 mt-3">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">RA No</label><input value={raNo} onChange={e=>setRaNo(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice No</label><input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
      </div>
    </div>
    <div className="panel p-8 text-center text-sm text-muted-foreground">Select a branch to load return pickup data.</div>
  </main></div>);}
