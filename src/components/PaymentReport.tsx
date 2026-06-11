import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { exportToCSV } from "@/lib/csvExport";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import { LOCATIONS } from "@/lib/locations";
import { ALL_TECHNICIANS } from "@/lib/locations";

interface Props { mod: ModuleDef; sub: SubModuleDef; }

const DS: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:280, overflowY:"auto" };
const Chev = ({o}:{o:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function usePortalPos(open:boolean){ const ref=useRef<HTMLButtonElement>(null); const [pos,setPos]=useState<any>(null); const r=useCallback(()=>{ if(!ref.current)return; const b=ref.current.getBoundingClientRect(); setPos({top:b.bottom+2,left:b.left,width:b.width}); },[]); useLayoutEffect(()=>{if(open)r();},[open,r]); useEffect(()=>{if(!open)return; window.addEventListener("scroll",r,true); window.addEventListener("resize",r); return()=>{ window.removeEventListener("scroll",r,true); window.removeEventListener("resize",r); };},[open,r]); return{ref,pos}; }

const PAYROLL_DATES = ["(custom)","05/13/2026 ~ 05/26/2026","04/28/2026 ~ 05/12/2026","04/11/2026 ~ 04/27/2026","03/27/2026 ~ 04/10/2026","03/11/2026 ~ 03/26/2026","02/25/2026 ~ 03/10/2026","02/11/2026 ~ 02/24/2026","01/28/2026 ~ 02/10/2026","01/13/2026 ~ 01/27/2026"];
const PAY_STATUSES = ["On-Hold","Not Paid","Paid","Payment Not Needed"];
const PRODUCTS = ["Refrigerator","Dryer","Washer","Range/Oven","Dishwasher","Microwave"];
const WTY = ["IW","OOW","SC"];
const STATUSES_ROW = ["CL-Claimed","CL-Completed","OP-Ready for Service","CL-Need Cancel"];
const pick = <T,>(a:T[], i:number) => a[i%a.length];
const pad = (n:number, l=6) => String(n).padStart(l,"0");
const ds = (o:number) => { const d=new Date(); d.setDate(d.getDate()+o); return d.toISOString().slice(0,10); };

function makeRows(count=60) {
  const locs = LOCATIONS.filter(l=>l&&l!=="Philippines");
  return Array.from({length:count},(_,i)=>({
    id:i+1, selected:false,
    ticketNo: i%3===0?`26000${pad(700000+i)}DF`:i%3===1?`1007${pad(300000+i,6)}${i%2===0?"15-10":"57-11"}`:`SA-${3000000+(i*43)%700000}`,
    location: pick(locs,i),
    wty: pick(WTY,i),
    productCategory: pick(PRODUCTS,i),
    status: pick(STATUSES_ROW,i),
    completeDate: ds(-(i%15)),
    cancelDate: i%4===0?ds(-(i%10)):"",
    redo: i%8===0?"Y":"",
    technician: pick(ALL_TECHNICIANS,i),
    labor: 0, diagnose: 0, parts: 0, shipping: 0, extraMile: 0,
    claim: i%5===0?parseFloat((50+(i*17)%400).toFixed(2)):0,
    billing: 0, comp: 0, otherTotal: i%5===0?parseFloat((50+(i*17)%400).toFixed(2)):0,
    tax: 0, compAmt: 0,
    commissionPct: "",
    commission: parseFloat((0).toFixed(2)),
    comment: "",
    payStatus: pick(PAY_STATUSES, i),
  }));
}
const ALL_ROWS = makeRows(60);

const CHIP: Record<string,string> = {
  "Paid":"text-green-400","Not Paid":"text-yellow-400","On-Hold":"text-orange-400","Payment Not Needed":"text-muted-foreground",
};

function PortalSelect({label,options,value,onChange}:{label:string;options:string[];value:string;onChange:(v:string)=>void}){
  const [open,setOpen]=useState(false);
  const d=usePortalPos(open); const listRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{ const fn=(e:MouseEvent)=>{ const t=e.target as Node; if(open&&!d.ref.current?.contains(t)&&!listRef.current?.contains(t))setOpen(false); }; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[open]);
  return(
    <>
      <button ref={d.ref} onClick={()=>setOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2 min-w-[140px]">
        <span className={value?"":"text-muted-foreground"}>{value||`All ${label}`}</span><Chev o={open}/>
      </button>
      {open&&d.pos&&createPortal(<div ref={listRef} style={{...DS,top:d.pos.top,left:d.pos.left,width:Math.max(d.pos.width,180)}}>
        <button onClick={()=>{onChange("");setOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${value===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All —</button>
        {options.map((o,i)=><button key={i} onClick={()=>{onChange(o);setOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${value===o?"bg-blue-600 text-white":""}`}>{o}</button>)}
      </div>,document.body)}
    </>
  );
}

// Inline pay status dropdown in the table (not a portal — simple native select styled)
function PayStatusDropdown({value,onChange}:{value:string;onChange:(v:string)=>void}){
  return(
    <select value={value} onChange={e=>onChange(e.target.value)}
      className={`text-xs py-0.5 px-2 rounded border border-white/20 bg-transparent focus:outline-none ${CHIP[value]||""}`}>
      {PAY_STATUSES.map(s=><option key={s} value={s} className="bg-slate-900 text-foreground">{s}</option>)}
    </select>
  );
}

export function PaymentReport({ mod, sub }: Props) {
  const [location,setLocation]=useState("");
  const [locOpen,setLocOpen]=useState(false);
  const [tech,setTech]=useState("");
  const [payrollDate,setPayrollDate]=useState("(custom)");
  const [startDate,setStartDate]=useState(ds(-1));
  const [endDate,setEndDate]=useState(ds(0));
  const [techPaidFilter,setTechPaidFilter]=useState(false);
  const [cancelledFilter,setCancelledFilter]=useState(false);
  const [search,setSearch]=useState("");
  const [rows,setRows]=useState(ALL_ROWS);
  const [pageSize,setPageSize]=useState(50);

  const locD=usePortalPos(locOpen); const locL=useRef<HTMLDivElement>(null);
  const techD=usePortalPos(!!tech); 

  useEffect(()=>{ const fn=(e:MouseEvent)=>{ const t=e.target as Node; if(locOpen&&!locD.ref.current?.contains(t)&&!locL.current?.contains(t))setLocOpen(false); }; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[locOpen]);

  const filtered=useMemo(()=>{
    let r=rows;
    if(location) r=r.filter(x=>x.location===location);
    if(tech) r=r.filter(x=>x.technician===tech);
    if(startDate) r=r.filter(x=>x.completeDate>=startDate);
    if(endDate) r=r.filter(x=>x.completeDate<=endDate);
    if(techPaidFilter) r=r.filter(x=>x.payStatus==="Paid");
    if(cancelledFilter) r=r.filter(x=>x.status==="CL-Need Cancel");
    if(search) r=r.filter(x=>x.ticketNo.toLowerCase().includes(search.toLowerCase())||x.technician.toLowerCase().includes(search.toLowerCase())||x.location.toLowerCase().includes(search.toLowerCase()));
    return r.slice(0,pageSize);
  },[rows,location,tech,startDate,endDate,techPaidFilter,cancelledFilter,search,pageSize]);

  const updatePayStatus=(id:number,val:string)=>setRows(r=>r.map(row=>row.id===id?{...row,payStatus:val}:row));
  const updateComment=(id:number,val:string)=>setRows(r=>r.map(row=>row.id===id?{...row,comment:val}:row));

  // Totals row
  const totals = {
    labor: filtered.reduce((s,r)=>s+r.labor,0),
    diagnose: filtered.reduce((s,r)=>s+r.diagnose,0),
    parts: filtered.reduce((s,r)=>s+r.parts,0),
    shipping: filtered.reduce((s,r)=>s+r.shipping,0),
    extraMile: filtered.reduce((s,r)=>s+r.extraMile,0),
    claim: filtered.reduce((s,r)=>s+r.claim,0),
    billing: filtered.reduce((s,r)=>s+r.billing,0),
    comp: filtered.reduce((s,r)=>s+r.comp,0),
    otherTotal: filtered.reduce((s,r)=>s+r.otherTotal,0),
    tax: filtered.reduce((s,r)=>s+r.tax,0),
    compAmt: filtered.reduce((s,r)=>s+r.compAmt,0),
    commission: filtered.reduce((s,r)=>s+r.commission,0),
  };

  const handleExportCSV=()=>{
    exportToCSV("payment_report",
      ["Ticket No","Location","Wty","Product","Status","Complete","Technician","Labor","Diagnose","Parts","Shipping","Extra Mile","Other Total","Tax","Commission","Pay Status"],
      filtered.map(r=>[r.ticketNo,r.location,r.wty,r.productCategory,r.status,r.completeDate,r.technician,r.labor,r.diagnose,r.parts,r.shipping,r.extraMile,r.otherTotal,r.tax,r.commission,r.payStatus])
    );
  };

  const fmt=(n:number)=>`$${n.toFixed(2)}`;

  return(
    <main className="max-w-[1900px] mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Link to="/home" className="hover:text-foreground">🏠</Link><span>›</span>
        <Link to="/m/$module" params={{module:mod.slug}} className="hover:text-foreground">Claim</Link><span>›</span>
        <span className="text-foreground font-medium">Payment Report</span>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <Link to="/m/$module" params={{module:mod.slug}} className="btn p-2 hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
        <h1 className="text-xl font-bold">Payment Report</h1>
      </div>

      {/* Filters */}
      <div className="panel mb-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Location */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
            <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
              <span className={location?"":"text-muted-foreground"}>{location||"All Locations"}</span><Chev o={locOpen}/>
            </button>
            {locOpen&&locD.pos&&createPortal(<div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}>
              <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Locations —</button>
              {LOCATIONS.filter(l=>l&&l!=="Philippines").map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
            </div>,document.body)}
          </div>
          {/* Technician */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technician</label>
            <PortalSelect label="Technician" options={ALL_TECHNICIANS} value={tech} onChange={setTech}/>
          </div>
          {/* Payroll Date */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payroll Date</label>
            <select value={payrollDate} onChange={e=>setPayrollDate(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md">
              {PAYROLL_DATES.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* Complete Date range */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Complete Date</label>
            <div className="flex items-center gap-1.5">
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32"/>
              <span className="text-muted-foreground text-xs">~</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32"/>
            </div>
          </div>
          {/* Checkboxes */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground invisible uppercase tracking-wide">Options</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={techPaidFilter} onChange={e=>setTechPaidFilter(e.target.checked)} className="accent-blue-500"/>Tech Paid</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={cancelledFilter} onChange={e=>setCancelledFilter(e.target.checked)} className="accent-blue-500"/>Cancelled</label>
            </div>
          </div>
          <button className="btn px-4 py-1.5 text-sm font-medium mb-0.5">Refresh</button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">*Note: On-Hold means the bill claim is not approved yet. When it is approved, it goes to Not-Paid status automatically.</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{filtered.length}</span> distinct records found</span>
        <div className="flex items-center gap-2">
          <button className="btn text-xs px-2 py-1">Sync Ticket (SS)</button>
          <span className="cursor-pointer text-muted-foreground">🖨</span><span className="cursor-pointer text-muted-foreground">⬇</span><span className="cursor-pointer text-muted-foreground">▽</span><span className="cursor-pointer text-muted-foreground">⚙</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search in result" className="glass-input text-xs py-1 px-2 rounded-md w-36"/>
          <button onClick={handleExportCSV} title="Download CSV" className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-2 py-3 w-8"><input type="checkbox" className="accent-blue-500"/></th>
              {["Ticket No","Location","Wty","P. Category","Status","Complete","Cancel","Redo","Technician","Labor","Diagnose","Parts","Shipping","Extra Mile"].map(h=>(
                <th key={h} className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
              {/* Other grouped header */}
              <th className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground uppercase" colSpan={4}>Other</th>
              {["Tax","Comp.","Commission %","Commission","Comment","(Tech Paid)"].map(h=>(
                <th key={h} className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
            <tr className="border-b border-white/10 bg-white/3">
              <th colSpan={18}></th>
              {["Claim","Billing","Comp.","Total"].map(h=>(
                <th key={h} className="px-2 py-1 text-center text-xs text-muted-foreground border-l border-white/5">{h}</th>
              ))}
              <th colSpan={6}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0
              ?<tr><td colSpan={26} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
              :filtered.map((r,idx)=>(
                <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                  <td className="px-2 py-2"><input type="checkbox" className="accent-blue-500"/></td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <Link to="/ticket/$ticketNo" params={{ticketNo:r.ticketNo}} className="font-mono text-blue-400 hover:text-blue-300 hover:underline text-xs">{r.ticketNo}</Link>
                  </td>
                  <td className="px-2 py-2">{r.location}</td>
                  <td className="px-2 py-2 text-center">{r.wty}</td>
                  <td className="px-2 py-2">{r.productCategory}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.status}</td>
                  <td className="px-2 py-2 text-muted-foreground whitespace-nowrap">{r.completeDate}</td>
                  <td className="px-2 py-2 text-muted-foreground">{r.cancelDate}</td>
                  <td className="px-2 py-2 text-center">{r.redo}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.technician}</td>
                  {[r.labor,r.diagnose,r.parts,r.shipping,r.extraMile].map((v,i)=>(
                    <td key={i} className="px-2 py-2 text-right text-muted-foreground">{fmt(v)}</td>
                  ))}
                  {/* Other sub-cols */}
                  <td className="px-2 py-2 text-right border-l border-white/5">{r.claim>0?<span className="text-blue-400">{fmt(r.claim)}</span>:fmt(r.claim)}</td>
                  <td className="px-2 py-2 text-right">{fmt(r.billing)}</td>
                  <td className="px-2 py-2 text-right">{fmt(r.comp)}</td>
                  <td className="px-2 py-2 text-right">{r.otherTotal>0?<span className="text-blue-400">{fmt(r.otherTotal)}</span>:fmt(r.otherTotal)}</td>
                  <td className="px-2 py-2 text-right">{fmt(r.tax)}</td>
                  <td className="px-2 py-2 text-right">{fmt(r.compAmt)}</td>
                  <td className="px-2 py-2"><input className="glass-input text-xs py-0.5 px-1 rounded w-14" placeholder="%"/></td>
                  <td className="px-2 py-2 text-right">{fmt(r.commission)}</td>
                  <td className="px-2 py-2"><input value={r.comment} onChange={e=>updateComment(r.id,e.target.value)} className="glass-input text-xs py-0.5 px-1 rounded w-20"/></td>
                  <td className="px-2 py-2"><PayStatusDropdown value={r.payStatus} onChange={v=>updatePayStatus(r.id,v)}/></td>
                </tr>
              ))
            }
            {/* Totals row */}
            {filtered.length>0&&(
              <tr className="bg-yellow-500/10 border-t border-yellow-500/30">
                <td className="px-2 py-2 font-bold text-yellow-300 text-xs" colSpan={10}>Total: {filtered.length}</td>
                {[totals.labor,totals.diagnose,totals.parts,totals.shipping,totals.extraMile].map((v,i)=>(
                  <td key={i} className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(v)}</td>
                ))}
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs border-l border-white/5">{fmt(totals.claim)}</td>
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(totals.billing)}</td>
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(totals.comp)}</td>
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(totals.otherTotal)}</td>
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(totals.tax)}</td>
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(totals.compAmt)}</td>
                <td></td>
                <td className="px-2 py-2 text-right text-yellow-300 font-semibold text-xs">{fmt(totals.commission)}</td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        {[10,20,50,100,500].map(n=>(
          <button key={n} onClick={()=>setPageSize(n)} className={`px-2 py-0.5 rounded ${pageSize===n?"bg-blue-600 text-white":"hover:text-foreground"}`}>{n}</button>
        ))}
      </div>
    </main>
  );
}
