import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS:React.CSSProperties={background:"rgb(22,28,52)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999999,position:"fixed",maxHeight:260,overflowY:"auto"};
const Chev=({o}:{o:boolean})=><svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open:boolean){const ref=useRef<HTMLButtonElement>(null);const [pos,setPos]=useState<any>(null);const r=useCallback(()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:b.bottom+2,left:b.left,width:b.width});},[]);useLayoutEffect(()=>{if(open)r();},[open,r]);useEffect(()=>{if(!open)return;window.addEventListener("scroll",r,true);window.addEventListener("resize",r);return()=>{window.removeEventListener("scroll",r,true);window.removeEventListener("resize",r);};},[open,r]);return{ref,pos};}

const REPAIR_STATUSES=["CL-Need Cancel","CL-Parts Back Ordered","CL-Ready to Complete","CSR-Acknowledged","CSR-Assigned to ASC","CSR-Left Message for Cx","CSR-Needs Scheduling","OP-Ready for Service","OP-Reschedule Follow up","OP-Update Hold","OP-Waiting for Part","PT-Need PreAuthorization","TR-Need PO","TR-Need Triage"];
const PART_STATUSES=["All","PO Made","Not Used & Stocked","CX Home","Part Ready","Used","Hold for next visit","Not received"];
const TODAY=new Date().toISOString().slice(0,10);
const ds=(o:number)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10);};

export function PartManagement({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [location,setLocation]=useState("");const [locOpen,setLocOpen]=useState(false);
  const [repairStatus,setRepairStatus]=useState("");const [rsOpen,setRsOpen]=useState(false);
  const [partStatus,setPartStatus]=useState("");const [psOpen,setPsOpen]=useState(false);
  const [ticketNo,setTicketNo]=useState("");
  const [receiveDate,setReceiveDate]=useState(false);
  const [startDate,setStartDate]=useState(ds(-1));const [endDate,setEndDate]=useState(TODAY);
  const locD=useP(locOpen);const rsD=useP(rsOpen);const psD=useP(psOpen);
  const locL=useRef<HTMLDivElement>(null);const rsL=useRef<HTMLDivElement>(null);const psL=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{const t=e.target as Node;
    if(locOpen&&!locD.ref.current?.contains(t)&&!locL.current?.contains(t))setLocOpen(false);
    if(rsOpen&&!rsD.ref.current?.contains(t)&&!rsL.current?.contains(t))setRsOpen(false);
    if(psOpen&&!psD.ref.current?.contains(t)&&!psL.current?.contains(t))setPsOpen(false);
  };document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[locOpen,rsOpen,psOpen]);
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 min-w-[160px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location*</label>
          <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={location?"":"text-muted-foreground"}>{location||"Select"}</span><Chev o={locOpen}/></button>
          {locOpen&&locD.pos&&createPortal(<div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}><button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}</div>,document.body)}
        </div>
        <div className="flex flex-col gap-1 min-w-[200px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Repair Status</label>
          <button ref={rsD.ref} onClick={()=>setRsOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={repairStatus?"":"text-muted-foreground"}>{repairStatus||"All Statuses"}</span><Chev o={rsOpen}/></button>
          {rsOpen&&rsD.pos&&createPortal(<div ref={rsL} style={{...DS,top:rsD.pos.top,left:rsD.pos.left,width:rsD.pos.width}}><button onClick={()=>{setRepairStatus("");setRsOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${repairStatus===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>{REPAIR_STATUSES.map((s,i)=><button key={i} onClick={()=>{setRepairStatus(s);setRsOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${repairStatus===s?"bg-blue-600 text-white":""}`}>{s}</button>)}</div>,document.body)}
        </div>
        <div className="flex flex-col gap-1 min-w-[180px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part Status</label>
          <button ref={psD.ref} onClick={()=>setPsOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={partStatus?"":"text-muted-foreground"}>{partStatus||"All"}</span><Chev o={psOpen}/></button>
          {psOpen&&psD.pos&&createPortal(<div ref={psL} style={{...DS,top:psD.pos.top,left:psD.pos.left,width:psD.pos.width}}>{PART_STATUSES.map((s,i)=><button key={i} onClick={()=>{setPartStatus(s==="All"?"":s);setPsOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${(s==="All"?""===partStatus:partStatus===s)?"bg-blue-600 text-white":""}`}>{s}</button>)}</div>,document.body)}
        </div>
        <div className="flex items-end gap-2 pb-0.5"><button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button></div>
      </div>
      <div className="flex flex-wrap items-end gap-3 mt-3">
        <div className="flex flex-col gap-1 min-w-[160px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ticket #</label><input value={ticketNo} onChange={e=>setTicketNo(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
        <div className="flex items-end gap-3 pb-0.5">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={receiveDate} onChange={e=>setReceiveDate(e.target.checked)} className="accent-blue-500"/>Receive Date</label>
          {receiveDate&&<><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/><span className="text-muted-foreground text-xs">~</span><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/></>}
        </div>
      </div>
    </div>
    <div className="panel p-8 text-center text-sm text-muted-foreground">Select a location to load PO & Management data.</div>
    <div className="flex justify-center mt-4"><button className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-8"><Save className="h-3.5 w-3.5"/>Save</button></div>
  </main></div>);}
