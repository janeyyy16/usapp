import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const TODAY=new Date().toISOString().slice(0,10);
interface TriageRow{ticketNo:string;parts:{partNo:string;qty:number}[];}
const emptyRow=():TriageRow=>({ticketNo:"",parts:Array.from({length:10},()=>({partNo:"",qty:1}))});

export function PartTriage({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [requestDate,setRequestDate]=useState(TODAY);
  const [rows,setRows]=useState<TriageRow[]>([emptyRow()]);
  const [pageSize,setPageSize]=useState(50);const [search,setSearch]=useState("");
  const addRow=()=>setRows(r=>[...r,emptyRow()]);
  const update=(ri:number,pi:number,field:"partNo"|"qty",val:string|number)=>{setRows(r=>r.map((row,i)=>i!==ri?row:{...row,parts:row.parts.map((p,j)=>j!==pi?p:{...p,[field]:val})}));};
  const updateTicket=(ri:number,val:string)=>setRows(r=>r.map((row,i)=>i!==ri?row:{...row,ticketNo:val}));
  return(<div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1800px] mx-auto w-full px-6 py-8">
    <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>
    <div className="panel mb-4"><div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Request Date</label><input type="date" value={requestDate} onChange={e=>setRequestDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-36"/></div>
      <div className="flex items-end gap-2 pb-0.5 ml-auto">
        <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
      </div>
    </div></div>
    <div className="panel overflow-x-auto p-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="text-xs text-muted-foreground">* Import File Format: TicketNo + PartNo1 + Qty1 + PartNo2 + Qty2 + ... + PartNo10 + Qty10</div>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.filter(r=>r.ticketNo).length}</span> record found</span>
        <div className="flex items-center gap-2">
          <button className="btn text-xs px-3 py-1">Import</button>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search in result" className="glass-input text-sm py-1 px-2 rounded-md w-36"/>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/10 bg-white/5">
            <th className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Ticket No</th>
            {Array.from({length:10},(_,i)=><><th key={`p${i}`} className="px-2 py-2 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Part{i+1}</th><th key={`q${i}`} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Qty{i+1}</th></>)}
            <th className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
            <th className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((row,ri)=><tr key={ri} className="border-b border-white/5">
              <td className="px-2 py-1.5"><input value={row.ticketNo} onChange={e=>updateTicket(ri,e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-24" style={{borderStyle:"dashed"}}/></td>
              {row.parts.map((p,pi)=><><td key={`p${pi}`} className="px-2 py-1.5"><input value={p.partNo} onChange={e=>update(ri,pi,"partNo",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-20" style={{borderStyle:"dashed"}}/></td><td key={`q${pi}`} className="px-2 py-1.5 text-center"><input type="number" value={p.qty} onChange={e=>update(ri,pi,"qty",+e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-10 text-right" min={1}/></td></>)}
              <td className="px-2 py-1.5 text-center text-muted-foreground text-xs">—</td>
              <td className="px-2 py-1.5 text-center"><button onClick={addRow} className="text-blue-400 hover:text-blue-300 text-xs">›Add</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{[10,25,50,100].map(n=><button key={n} onClick={()=>setPageSize(n)} className={`px-2 py-0.5 rounded ${pageSize===n?"bg-blue-600 text-white":"hover:text-foreground"}`}>{n}</button>)}</div>
        <span className="text-xs text-blue-400 font-medium">1</span>
      </div>
    </div>
  </main></div>);}
