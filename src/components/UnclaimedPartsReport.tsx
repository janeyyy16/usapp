import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { exportToCSV } from "@/lib/csvExport";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import { LOCATIONS } from "@/lib/locations";

interface Props { mod: ModuleDef; sub: SubModuleDef; }

const DS: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:280, overflowY:"auto" };
const Chev = ({o}:{o:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
function usePortalPos(open:boolean){ const ref=useRef<HTMLButtonElement>(null); const [pos,setPos]=useState<any>(null); const r=useCallback(()=>{ if(!ref.current)return; const b=ref.current.getBoundingClientRect(); setPos({top:b.bottom+2,left:b.left,width:b.width}); },[]); useLayoutEffect(()=>{if(open)r();},[open,r]); useEffect(()=>{if(!open)return; window.addEventListener("scroll",r,true); window.addEventListener("resize",r); return()=>{ window.removeEventListener("scroll",r,true); window.removeEventListener("resize",r); };},[open,r]); return{ref,pos}; }

const pick = <T,>(a:T[], i:number) => a[i%a.length];
const ds = (o:number) => { const d=new Date(); d.setDate(d.getDate()+o); return d.toISOString().slice(0,10); };

// Data matching screenshot structure: grouped by ticket, multiple parts per ticket
const PART_NOS = ["EAU63743302","DD33-01002B","DD93-01013A","DD97-00403E","DC96-00887C","WP35001191","DE47-20037A","DG32-00002B","DG92-01232A","DG96-00602B","5303305677","W11752185","W11780105","WE03X25285","WE04X25280","BW27X50046","WB1X371D","WB23X5340","DA97-13718A","DC97-22283B"];
const PART_STATUSES = ["Used","Hold for next vist","Cancelled","Part Ready","Need PO","Returned"];
const BRANDS = ["SNWV44E2BCC6-2","051258874134","056922074131","097803174137","1006848523","26000691818DF","3852878E1","SA-2915053","SA-3223622"];
const LOCS = ["Atlanta","Birmingham","Knoxville","Memphis","Nashville","Jacksonville","Raleigh","Columbus","Mobile","Savannah","Chattanooga","Montgomery","New Orleans","Louisville","Dallas"];

function genUniqueId(ticketNo:string, partNo:string, idx:number):string {
  return `${ticketNo}-${idx+1}-${partNo}`;
}

interface PartRow { partNo:string; uniqueId:string; qty:number; partStatus:string; totalPrice:number; creditAmt:number; }
interface TicketGroup { location:string; ticketNo:string; claimed:string; parts:PartRow[]; }

function makeGroups():TicketGroup[] {
  return Array.from({length:18},(_,i)=>{
    const loc = pick(LOCS,i);
    const ticketNo = pick(BRANDS,i);
    const claimed = ds(-(i*3)%30);
    const partCount = (i%3)+1;
    const parts:PartRow[] = Array.from({length:partCount},(_,j)=>{
      const partNo = pick(PART_NOS, i*3+j);
      return {
        partNo,
        uniqueId: genUniqueId(ticketNo, partNo, j),
        qty: 1,
        partStatus: pick(PART_STATUSES, i+j),
        totalPrice: j===0&&i%4===0?parseFloat((48.82+(i*17)%400).toFixed(2)):j===0&&i%3===0?parseFloat((240.61+(i*11)%200).toFixed(2)):0,
        creditAmt: 0,
      };
    });
    return {location:loc, ticketNo, claimed, parts};
  });
}
const ALL_GROUPS = makeGroups();

export function UnclaimedPartsReport({ mod, sub }: Props) {
  const [location,setLocation]=useState("Atlanta");
  const [locOpen,setLocOpen]=useState(false);
  const [startDate,setStartDate]=useState(ds(-30));
  const [endDate,setEndDate]=useState(ds(0));
  const [search,setSearch]=useState("");
  const [pageSize,setPageSize]=useState(50);

  const locD=usePortalPos(locOpen); const locL=useRef<HTMLDivElement>(null);
  useEffect(()=>{ const fn=(e:MouseEvent)=>{ const t=e.target as Node; if(locOpen&&!locD.ref.current?.contains(t)&&!locL.current?.contains(t))setLocOpen(false); }; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[locOpen]);

  const filtered = useMemo(()=>{
    let g=ALL_GROUPS;
    if(location) g=g.filter(x=>x.location===location);
    if(startDate) g=g.filter(x=>x.claimed>=startDate);
    if(endDate) g=g.filter(x=>x.claimed<=endDate);
    if(search) g=g.filter(x=>x.ticketNo.toLowerCase().includes(search.toLowerCase())||x.parts.some(p=>p.partNo.toLowerCase().includes(search.toLowerCase())));
    return g.slice(0,pageSize);
  },[location,startDate,endDate,search,pageSize]);

  const totalPartRows = filtered.reduce((s,g)=>s+g.parts.length,0);

  const handleExportCSV=()=>{
    const rows = filtered.flatMap(g=>g.parts.map(p=>[g.location,g.ticketNo,g.claimed,p.partNo,p.uniqueId,p.qty,p.partStatus,p.totalPrice,p.creditAmt]));
    exportToCSV("unclaimed_parts_report",["Location","Ticket No","Claimed","Part No","Unique ID","Qty","Part Status","Total Price","Credit Amt"],rows);
  };

  return(
    <main className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Link to="/home" className="hover:text-foreground">🏠</Link><span>›</span>
        <Link to="/m/$module" params={{module:mod.slug}} className="hover:text-foreground">Claim</Link><span>›</span>
        <span className="text-foreground font-medium">Unclaimed Parts Report</span>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <Link to="/m/$module" params={{module:mod.slug}} className="btn p-2 hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
        <h1 className="text-xl font-bold">Unclaimed Parts Report</h1>
      </div>

      {/* Filters */}
      <div className="panel mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[160px] flex-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
            <button ref={locD.ref} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
              <span className={location?"":"text-muted-foreground"}>{location||"All Locations"}</span><Chev o={locOpen}/>
            </button>
            {locOpen&&locD.pos&&createPortal(<div ref={locL} style={{...DS,top:locD.pos.top,left:locD.pos.left,width:locD.pos.width}}>
              <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Locations —</button>
              {LOCATIONS.filter(l=>l&&l!=="Philippines").map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
            </div>,document.body)}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Claim Date</label>
            <div className="flex items-center gap-1.5">
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32"/>
              <span className="text-muted-foreground text-xs">~</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-32"/>
            </div>
          </div>
          <button className="btn px-4 py-1.5 text-sm font-medium mb-0.5">Refresh</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{totalPartRows}</span> records found</span>
        <div className="flex items-center gap-2">
          <span className="cursor-pointer text-muted-foreground">⬇</span>
          <span className="cursor-pointer text-muted-foreground">⚙</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search in result" className="glass-input text-xs py-1 px-2 rounded-md w-36"/>
          <button onClick={handleExportCSV} title="Download CSV" className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      {/* Table — grouped by ticket, multiple part rows */}
      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {["Location","Ticket No","Claimed","Part No","Unique ID","Qty","Part Status","Total Price","Credit Amt."].map(h=>(
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0
              ?<tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
              :filtered.map((g,gi)=>(
                g.parts.map((p,pi)=>(
                  <tr key={`${gi}-${pi}`} className={`border-b border-white/5 hover:bg-white/5 ${gi%2!==0?"bg-white/[0.02]":""}`}>
                    {/* Location, Ticket No, Claimed — only show on first part row of each ticket */}
                    <td className="px-3 py-2.5">{pi===0?g.location:""}</td>
                    <td className="px-3 py-2.5">
                      {pi===0?(
                        <Link to="/ticket/$ticketNo" params={{ticketNo:g.ticketNo}} className="font-mono text-blue-400 hover:text-blue-300 hover:underline">{g.ticketNo}</Link>
                      ):""}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{pi===0?g.claimed:""}</td>
                    {/* Part columns — always shown */}
                    <td className="px-3 py-2.5 font-mono text-xs">{p.partNo}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.uniqueId}</td>
                    <td className="px-3 py-2.5 text-center">{p.qty}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.partStatus}</td>
                    <td className="px-3 py-2.5 text-right">{p.totalPrice>0?<span className="text-green-400">${p.totalPrice.toFixed(2)}</span>:"$0.00"}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">${p.creditAmt.toFixed(2)}</td>
                  </tr>
                ))
              ))
            }
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
