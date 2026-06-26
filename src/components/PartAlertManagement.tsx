import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

interface AlertRow{partNo:string;alertMessage:string;}

export function PartAlertManagement({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [rows,setRows]=useState<AlertRow[]>([{partNo:"",alertMessage:""}]);
  const [search,setSearch]=useState("");const [pageSize,setPageSize]=useState(50);
  const addRow=()=>setRows(r=>[...r,{partNo:"",alertMessage:""}]);
  const update=(i:number,k:keyof AlertRow,v:string)=>setRows(r=>r.map((row,idx)=>idx!==i?row:{...row,[k]:v}));
  const filtered=rows.filter(r=>!search||(r.partNo.toLowerCase().includes(search.toLowerCase())||r.alertMessage.toLowerCase().includes(search.toLowerCase())));
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel overflow-x-auto p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{filtered.filter(r=>r.partNo).length}</span> record found</span>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search in result" className="glass-input text-sm py-1 px-2 rounded-md w-36"/>
          <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
        </div>
      </div>
      <table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5">
        <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part No*</th>
        <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alert Message*</th>
        <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
      </tr></thead>
      <tbody>{filtered.map((r,i)=><tr key={i} className="border-b border-white/5">
        <td className="px-3 py-2"><input value={r.partNo} onChange={e=>update(i,"partNo",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-36" style={{borderStyle:"dashed"}}/></td>
        <td className="px-3 py-2"><input value={r.alertMessage} onChange={e=>update(i,"alertMessage",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-full" style={{borderStyle:"dashed"}}/></td>
        <td className="px-3 py-2 text-center"><button onClick={addRow} className="text-blue-400 hover:text-blue-300 text-xs">›Add</button></td>
      </tr>)}</tbody></table>
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{[10,20,50,100,500].map(n=><button key={n} onClick={()=>setPageSize(n)} className={`px-2 py-0.5 rounded ${pageSize===n?"bg-blue-600 text-white":"hover:text-foreground"}`}>{n}</button>)}</div>
        <span className="text-xs text-blue-400 font-medium">1</span>
      </div>
    </div>
  </main></div>);}
