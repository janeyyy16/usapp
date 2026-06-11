import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const ds=(o:number)=>{const d=new Date();d.setDate(d.getDate()+o);return d.toISOString().slice(0,10);};
const VENDORS=["Encompass","LG","Marcone","Samsung","Reliable Parts"];
const pick=<T,>(a:T[],i:number)=>a[i%a.length];
const pad=(n:number)=>String(n).padStart(6,"0");
const ALL=Array.from({length:20},(_,i)=>({id:i+1,poNo:"PO-"+pad(7000+i),vendor:pick(VENDORS,i),poDate:ds(-(i%30)-1),totalParts:5+(i%20),returnedParts:i%10,pendingParts:(5+(i%20))-(i%10),totalValue:200+(i*73)%3000}));

export function PartReturnSummary({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [startDate,setStartDate]=useState("2026-05-01");const [endDate,setEndDate]=useState("2026-05-31");
  const rows=useMemo(()=>ALL.filter(r=>(!startDate||r.poDate>=startDate)&&(!endDate||r.poDate<=endDate)),[startDate,endDate]);
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4"><div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">P/O Date</label>
        <div className="flex items-center gap-2"><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/><span className="text-muted-foreground text-xs">~</span><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32.5"/></div></div>
    </div></div>
    <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
    <div className="panel overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5">{["#","PO No","Vendor","PO Date","Total Parts","Returned","Pending","Total Value"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${i%2!==0?"bg-white/[0.02]":""}`}><td className="px-3 py-2.5 text-muted-foreground">{i+1}</td><td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.poNo}</td><td className="px-3 py-2.5">{r.vendor}</td><td className="px-3 py-2.5 text-muted-foreground text-xs">{r.poDate}</td><td className="px-3 py-2.5 text-right">{r.totalParts}</td><td className="px-3 py-2.5 text-right text-green-400">{r.returnedParts}</td><td className="px-3 py-2.5 text-right text-yellow-400">{r.pendingParts}</td><td className="px-3 py-2.5 text-right font-medium">${r.totalValue.toFixed(2)}</td></tr>)}</tbody></table></div>
  </main></div>);}
