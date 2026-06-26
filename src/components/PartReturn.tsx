import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Check } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const PROVIDERS = ["Samsung","LG","Whirlpool","GE Appliances","Bosch","Electrolux","Midea","Miele","NSA","Encompass"];
const CORE_PARTS = [
  {id:393,ticketNo:"4172283796",uniqueId:"7181346012000010",partNo:"BN07-01736A",description:"LCD-CSOT",invoiceDate:"",returnQty:1,coreValue:40,partStatus:"Claimed",scheduleDate:"08/17/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:336,ticketNo:"4171861618",uniqueId:"7175654957000020",partNo:"BN44-01056A",description:"DC VSS-PD BOARD",invoiceDate:"",returnQty:1,coreValue:70,partStatus:"Claimed",scheduleDate:"07/17/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:252,ticketNo:"4171548336",uniqueId:"7171782918000050",partNo:"BN44-01056A",description:"DC VSS-PD BOARD",invoiceDate:"",returnQty:1,coreValue:70,partStatus:"Claimed",scheduleDate:"06/21/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:285,ticketNo:"4171583019",uniqueId:"7170837270000010",partNo:"BN44-01170A",description:"DC VSS-POWER BOARD",invoiceDate:"",returnQty:1,coreValue:110,partStatus:"Claimed",scheduleDate:"06/25/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:400,ticketNo:"4172329575",uniqueId:"7181092191000010",partNo:"BN44-01170A",description:"DC VSS-POWER BOARD",invoiceDate:"",returnQty:1,coreValue:110,partStatus:"Claimed",scheduleDate:"08/17/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:249,ticketNo:"4171524828",uniqueId:"7171384525000010",partNo:"BN94-00054G",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:108,partStatus:"Claimed",scheduleDate:"06/30/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:440,ticketNo:"4172505183",uniqueId:"7183263736000020",partNo:"BN94-14156F",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:80,partStatus:"Claimed",scheduleDate:"08/23/2023",technician:"Sean Smith",coreRA:""},
  {id:39212,ticketNo:"R-4175935790",uniqueId:"7223871680000010",partNo:"BN94-15731B",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:84,partStatus:"Claimed",scheduleDate:"05/16/2024",technician:"Christian Newson",coreRA:""},
  {id:386,ticketNo:"4172246461",uniqueId:"7177635275000020",partNo:"BN94-16104Z",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:72,partStatus:"Claimed",scheduleDate:"08/11/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:413,ticketNo:"4172401281",uniqueId:"7180296664000010",partNo:"BN94-16105A",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:49.3,partStatus:"Claimed",scheduleDate:"08/23/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:291,ticketNo:"4171620877",uniqueId:"7173426368000030",partNo:"BN94-16105A",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:49.3,partStatus:"Used",scheduleDate:"06/27/2023",technician:"Nelson Ogutu",coreRA:""},
  {id:242,ticketNo:"4171419136",uniqueId:"7170251158000010",partNo:"BN94-16107B",description:"ASSY PCB MAIN",invoiceDate:"",returnQty:1,coreValue:49.47,partStatus:"Claimed",scheduleDate:"06/27/2023",technician:"Nelson Ogutu",coreRA:""},
];
const REGULAR_PARTS = [
  {id:1,ticketNo:"TK-2026-1000",uniqueId:"UID-10000",partNo:"ACQ86576404",description:"Compressor Motor",invoiceDate:"2026-05-01",returnQty:1,coreValue:0,partStatus:"Claimed",scheduleDate:"05/30/2026",technician:"Nelson Ogutu",coreRA:"RA-0001"},
  {id:2,ticketNo:"TK-2026-1001",uniqueId:"UID-10001",partNo:"WPW10217825",description:"Wire Harness",invoiceDate:"2026-04-28",returnQty:1,coreValue:0,partStatus:"Pending",scheduleDate:"05/29/2026",technician:"Sean Smith",coreRA:""},
  {id:3,ticketNo:"TK-2026-1002",uniqueId:"UID-10002",partNo:"RPS345-78",description:"Pump Assembly",invoiceDate:"2026-04-25",returnQty:2,coreValue:0,partStatus:"Returned",scheduleDate:"05/28/2026",technician:"Christian Newson",coreRA:"RA-0003"},
  {id:4,ticketNo:"TK-2026-1003",uniqueId:"UID-10003",partNo:"EVT456-12",description:"Evaporator Coil",invoiceDate:"2026-04-20",returnQty:1,coreValue:0,partStatus:"Claimed",scheduleDate:"05/27/2026",technician:"Jacob Morehouse",coreRA:""},
  {id:5,ticketNo:"TK-2026-1004",uniqueId:"UID-10004",partNo:"LG123-456",description:"Door Seal",invoiceDate:"2026-04-18",returnQty:1,coreValue:0,partStatus:"Used",scheduleDate:"05/26/2026",technician:"Nelson Ogutu",coreRA:"RA-0005"},
];

const DROP_STYLE: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:260, overflowY:"auto" };
const Chevron = ({open}:{open:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;

function usePortalPos(open: boolean) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{top:number;left:number;width:number}|null>(null);
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 2, left: r.left, width: r.width });
  }, []);
  useLayoutEffect(() => { if (open) reposition(); }, [open, reposition]);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => { window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); };
  }, [open, reposition]);
  return { triggerRef, pos };
}

export function PartReturn({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [tab, setTab] = useState<"return"|"core">("return");
  const [provider, setProvider] = useState("Samsung");
  const [providerOpen, setProviderOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [agingMin, setAgingMin] = useState(0);
  const [agingMax, setAgingMax] = useState(90);
  const [uniqueIdSearch, setUniqueIdSearch] = useState("");
  const [includeReturned, setIncludeReturned] = useState(false);
  const [includeReserved, setIncludeReserved] = useState(false);

  const providerDrop = usePortalPos(providerOpen);
  const locDrop = usePortalPos(locOpen);
  const providerListRef = useRef<HTMLDivElement>(null);
  const locListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as Node;
      if (providerOpen && !providerDrop.triggerRef.current?.contains(t) && !providerListRef.current?.contains(t)) setProviderOpen(false);
      if (locOpen && !locDrop.triggerRef.current?.contains(t) && !locListRef.current?.contains(t)) setLocOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [providerOpen, locOpen]);

  const data = tab === "core" ? CORE_PARTS : REGULAR_PARTS;
  const rows = useMemo(() => data.filter(r => {
    if (uniqueIdSearch && !r.uniqueId.toLowerCase().includes(uniqueIdSearch.toLowerCase()) && !r.ticketNo.toLowerCase().includes(uniqueIdSearch.toLowerCase())) return false;
    return true;
  }), [data, uniqueIdSearch]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module/$submodule" params={{ module: "dashboard", submodule: "parts-dashboard" }} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Part Provider */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part Provider*</label>
              <button ref={providerDrop.triggerRef} onClick={()=>setProviderOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span>{provider}</span><Chevron open={providerOpen}/>
              </button>
              {providerOpen && providerDrop.pos && createPortal(
                <div ref={providerListRef} style={{...DROP_STYLE, top:providerDrop.pos.top, left:providerDrop.pos.left, width:providerDrop.pos.width}}>
                  {PROVIDERS.map((p,i)=><button key={i} onClick={()=>{setProvider(p);setProviderOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${provider===p?"bg-blue-600 text-white":""}`}>{p}</button>)}
                </div>, document.body
              )}
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
              <button ref={locDrop.triggerRef} onClick={()=>setLocOpen(o=>!o)} className="glass-input w-full text-sm py-1.5 px-3 rounded-md flex items-center justify-between gap-2">
                <span className={location?"":"text-muted-foreground"}>{location||"All Locations"}</span><Chevron open={locOpen}/>
              </button>
              {locOpen && locDrop.pos && createPortal(
                <div ref={locListRef} style={{...DROP_STYLE, top:locDrop.pos.top, left:locDrop.pos.left, width:locDrop.pos.width}}>
                  <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-400"}`}>— All Locations —</button>
                  {LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":""}`}>{l}</button>)}
                </div>, document.body
              )}
            </div>

            {/* Aging */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aging</label>
              <div className="flex items-center gap-2">
                <input type="number" value={agingMin} onChange={e=>setAgingMin(+e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-16 text-center"/>
                <span className="text-muted-foreground text-xs">~</span>
                <input type="number" value={agingMax} onChange={e=>setAgingMax(+e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md w-16 text-center"/>
              </div>
            </div>

            <div className="flex items-end gap-2 pb-0.5">
              <button className="btn flex items-center gap-2 px-4"><Check className="h-3.5 w-3.5"/>Verify</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unique ID / Invoice No</label>
              <input type="text" value={uniqueIdSearch} onChange={e=>setUniqueIdSearch(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
            </div>
            <div className="flex items-end gap-4 pb-0.5">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={includeReturned} onChange={e=>setIncludeReturned(e.target.checked)} className="accent-blue-500"/>Include Returned</label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer"><input type="checkbox" checked={includeReserved} onChange={e=>setIncludeReserved(e.target.checked)} className="accent-blue-500"/>Include Reserved</label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button onClick={()=>setTab("return")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab==="return"?"bg-blue-600 text-white":"btn"}`}>Part Return</button>
          <button onClick={()=>setTab("core")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab==="core"?"bg-blue-600 text-white":"btn"}`}>Core Part Return</button>
        </div>

        <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              {["ID","Ticket No.","Unique ID","Part #","Description","Invoice Date","Return Qty","Core Value","Part Status","Schedule Date","Technician","Core RA #","Actions"].map(h=>(
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.length===0
                ? <tr><td colSpan={13} className="px-4 py-12 text-center text-muted-foreground">No records found.</td></tr>
                : rows.map((r,idx)=>(
                  <tr key={r.id} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.id}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.ticketNo}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.uniqueId}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.partNo}</td>
                    <td className="px-3 py-2.5 text-xs">{r.description}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{r.invoiceDate||"—"}</td>
                    <td className="px-3 py-2.5 text-center">{r.returnQty}</td>
                    <td className="px-3 py-2.5 text-right">{r.coreValue>0?r.coreValue.toFixed(2):"—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.partStatus==="Claimed"?"bg-green-500/20 text-green-300 border border-green-500/30":r.partStatus==="Used"?"bg-blue-500/20 text-blue-300 border border-blue-500/30":r.partStatus==="Pending"?"bg-yellow-500/20 text-yellow-300 border border-yellow-500/30":r.partStatus==="Returned"?"bg-purple-500/20 text-purple-300 border border-purple-500/30":"bg-white/10 text-muted-foreground border border-white/15"}`}>{r.partStatus}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{r.scheduleDate}</td>
                    <td className="px-3 py-2.5">{r.technician}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{r.coreRA||"—"}</td>
                    <td className="px-3 py-2.5"><button className="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30">Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
