import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const DS: React.CSSProperties={background:"rgb(22,28,52)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.5)",zIndex:999999,position:"fixed",maxHeight:260,overflowY:"auto"};
const Chev=({o}:{o:boolean})=><svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function useP(open:boolean){const ref=useRef<HTMLButtonElement>(null);const [pos,setPos]=useState<any>(null);const r=useCallback(()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:b.bottom+2,left:b.left,width:b.width});},[]);useLayoutEffect(()=>{if(open)r();},[open,r]);useEffect(()=>{if(!open)return;window.addEventListener("scroll",r,true);window.addEventListener("resize",r);return()=>{window.removeEventListener("scroll",r,true);window.removeEventListener("resize",r);};},[open,r]);return{ref,pos};}

const ACCOUNTS=["ENC-272467","ENC-273746","LG-43195200","MCN-162468","SS-4930403"];
const ds=(o:number)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10);};
const pad=(n:number)=>String(n).padStart(6,"0");
const STATUSES=["Paid","Unpaid","Partial"];
const pick=<T,>(a:T[],i:number)=>a[i%a.length];
const ALL=Array.from({length:30},(_,i)=>({id:i+1,invoiceNo:"INV-"+pad(100000+i),accountNo:pick(ACCOUNTS,i),invoiceDate:ds(-(i%10)-1),amount:100+(i*87)%3000,status:pick(STATUSES,i),items:1+(i%8)}));

export function InvoiceList({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [account,setAccount]=useState("");const [accOpen,setAccOpen]=useState(false);
  const [startDate,setStartDate]=useState(ds(-3));const [endDate,setEndDate]=useState(ds(0));
  const [invoiceNo,setInvoiceNo]=useState("");
  const accD=useP(accOpen);const accL=useRef<HTMLDivElement>(null);
  useEffect(()=>{const fn=(e:MouseEvent)=>{const t=e.target as Node;if(accOpen&&!accD.ref.current?.contains(t)&&!accL.current?.contains(t))setAccOpen(false);};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);},[accOpen]);
  const rows=useMemo(()=>{let r=ALL;if(account)r=r.filter(x=>x.accountNo===account);if(startDate)r=r.filter(x=>x.invoiceDate>=startDate);if(endDate)r=r.filter(x=>x.invoiceDate<=endDate);if(invoiceNo)r=r.filter(x=>x.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase()));return r;},[account,startDate,endDate,invoiceNo]);
  const CHIP:Record<string,string>={Paid:"bg-green-500/20 text-green-300 border border-green-500/30",Unpaid:"bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",Partial:"bg-blue-500/20 text-blue-300 border border-blue-500/30"};
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4"><div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 min-w-[180px] flex-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account No*</label>
        <button ref={accD.ref} onClick={()=>setAccOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2"><span className={account?"":"text-muted-foreground"}>{account||"Select Account"}</span><Chev o={accOpen}/></button>
        {accOpen&&accD.pos&&createPortal(<div ref={accL} style={{...DS,top:accD.pos.top,left:accD.pos.left,width:accD.pos.width}}><button onClick={()=>{setAccount("");setAccOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${account===""?"bg-blue-600 text-white":"text-slate-400"}`}>— Select —</button>{ACCOUNTS.map((a,i)=><button key={i} onClick={()=>{setAccount(a);setAccOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${account===a?"bg-blue-600 text-white":""}`}>{a}</button>)}</div>,document.body)}
      </div>
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice Date</label>
        <div className="flex items-center gap-2"><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/><span className="text-muted-foreground text-xs">~</span><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/></div></div>
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice No</label><input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
    </div></div>
    <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
    <div className="panel overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5">{["#","Invoice No","Account No","Invoice Date","Items","Amount","Status"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
    <tbody>{rows.length===0?<tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>:rows.map((r,idx)=><tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}><td className="px-3 py-2.5 text-muted-foreground">{idx+1}</td><td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.invoiceNo}</td><td className="px-3 py-2.5 font-mono text-xs">{r.accountNo}</td><td className="px-3 py-2.5 text-xs text-muted-foreground">{r.invoiceDate}</td><td className="px-3 py-2.5 text-right">{r.items}</td><td className="px-3 py-2.5 text-right font-medium">${r.amount.toFixed(2)}</td><td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${CHIP[r.status]||""}`}>{r.status}</span></td></tr>)}</tbody></table></div>
  </main></div>);}
