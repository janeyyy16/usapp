import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const RESULTS=[
  {partNo:"DA61-06796A",description:"Ice Maker Assembly",modelCode:"RF28R7351SR",basePN:"DA61-06796A",mfgCode:"SAM",price:189.99,coreValue:0,availability:"In Stock"},
  {partNo:"ACQ86576404",description:"Compressor Motor",modelCode:"LFX31945ST",basePN:"ACQ86576404",mfgCode:"LGE",price:312.50,coreValue:45,availability:"In Stock"},
  {partNo:"WPW10217825",description:"Wire Harness Main",modelCode:"WMH31017FS",basePN:"WPW10217825",mfgCode:"WHP",price:87.25,coreValue:0,availability:"Backorder"},
];

export function PartResearch({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [serialNo,setSerialNo]=useState("");const [modelCode,setModelCode]=useState("");const [partNo,setPartNo]=useState("");
  const [hasSearched,setHasSearched]=useState(false);
  const rows=hasSearched?RESULTS.filter(r=>{if(modelCode&&!r.modelCode.toLowerCase().includes(modelCode.toLowerCase()))return false;if(partNo&&!r.partNo.toLowerCase().includes(partNo.toLowerCase()))return false;return true;}):[];
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4"><div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serial No</label><input value={serialNo} onChange={e=>setSerialNo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setHasSearched(true)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model Code</label><input value={modelCode} onChange={e=>setModelCode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setHasSearched(true)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part No</label><input value={partNo} onChange={e=>setPartNo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setHasSearched(true)} className="glass-input text-sm py-1.5 px-3 rounded-md"/></div>
      <button onClick={()=>setHasSearched(true)} className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 mb-0.5">Search</button>
    </div></div>
    {hasSearched&&<><div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
    <div className="panel overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5">{["Part No","Description","Model Code","Base PN","Mfg Code","Price","Core Value","Availability"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
    <tbody>{rows.length===0?<tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No parts found.</td></tr>:rows.map((r,i)=><tr key={i} className={`border-b border-white/5 hover:bg-white/5 ${i%2!==0?"bg-white/[0.02]":""}`}><td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.partNo}</td><td className="px-3 py-2.5 text-xs">{r.description}</td><td className="px-3 py-2.5 font-mono text-xs">{r.modelCode}</td><td className="px-3 py-2.5 font-mono text-xs">{r.basePN}</td><td className="px-3 py-2.5 text-xs">{r.mfgCode}</td><td className="px-3 py-2.5 text-right">${r.price.toFixed(2)}</td><td className="px-3 py-2.5 text-right">{r.coreValue>0?`$${r.coreValue.toFixed(2)}`:"—"}</td><td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.availability==="In Stock"?"bg-green-500/20 text-green-300 border border-green-500/30":"bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"}`}>{r.availability}</span></td></tr>)}</tbody></table></div></>}
    {!hasSearched&&<div className="panel p-8 text-center text-sm text-muted-foreground">Enter Serial No, Model Code, or Part No and press Enter or click Search.</div>}
  </main></div>);}
