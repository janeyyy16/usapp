import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { LOCATIONS } from "@/lib/locations";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const ENC_ACCOUNTS = ["Select Account","ENC-001 (US In Home)","ENC-002 (Branch Atlanta)","ENC-003 (Branch Dallas)"];
const LG_ACCOUNTS = ["43195200","43195201","43195202","43195203"];
const SHIP_METHODS = ["Ground","2nd Day Air","Next Day Air","Pickup"];
const US_STATES = ["AL","AR","FL","GA","IL","KY","LA","MO","MS","NC","TN","TX"];

const DROP_STYLE: React.CSSProperties = { background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999, position:"fixed", maxHeight:220, overflowY:"auto" };
const Chev = ({open}:{open:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;

function usePortal(open: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{top:number;left:number;width:number}|null>(null);
  const reposition = useCallback(()=>{ if(!ref.current) return; const r=ref.current.getBoundingClientRect(); setPos({top:r.bottom+2,left:r.left,width:r.width}); },[]);
  useLayoutEffect(()=>{ if(open) reposition(); },[open,reposition]);
  useEffect(()=>{ if(!open) return; window.addEventListener("scroll",reposition,true); window.addEventListener("resize",reposition); return()=>{ window.removeEventListener("scroll",reposition,true); window.removeEventListener("resize",reposition); }; },[open,reposition]);
  return {ref, pos};
}

interface PartRow { partNo: string; description: string; basePN: string; mfgCode: string; qty: number; price: string; coreValue: string; }

export function BulkOrder({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [tab, setTab] = useState<"encompass"|"lg">("encompass");

  // Encompass fields
  const [encAccount, setEncAccount] = useState(""); const [encAccountOpen, setEncAccountOpen] = useState(false);
  const [encLocation, setEncLocation] = useState(""); const [encLocOpen, setEncLocOpen] = useState(false);
  const [encShipMethod, setEncShipMethod] = useState("Ground"); const [encShipOpen, setEncShipOpen] = useState(false);
  const [encAddress, setEncAddress] = useState(""); const [encAddrOpen, setEncAddrOpen] = useState(false);
  const [encPoNo] = useState(`ENC-${new Date().toISOString().slice(2,10).replace(/-/g,"")}-${Math.floor(Math.random()*9000+1000)}`);
  const [encRefNo, setEncRefNo] = useState(""); const [encPickupWH, setEncPickupWH] = useState(false);
  const [encShipName, setEncShipName] = useState("US In Home Services");
  const [encAddr1, setEncAddr1] = useState(""); const [encAddr2, setEncAddr2] = useState("");
  const [encCity, setEncCity] = useState(""); const [encState, setEncState] = useState(""); const [encStateOpen, setEncStateOpen] = useState(false);
  const [encZip, setEncZip] = useState(""); const [encPhone, setEncPhone] = useState("8007793579"); const [encEmail, setEncEmail] = useState("paul@usappliancefix.com");

  // LG fields
  const [lgAccount, setLgAccount] = useState("43195200"); const [lgAccountOpen, setLgAccountOpen] = useState(false);
  const [lgLocation, setLgLocation] = useState(""); const [lgLocOpen, setLgLocOpen] = useState(false);
  const [lgPoNo] = useState(`LG-${new Date().toISOString().slice(2,10).replace(/-/g,"")}-${Math.floor(Math.random()*9000+1000)}`);
  const [lgRefNo, setLgRefNo] = useState(""); const [lgDirectToCx, setLgDirectToCx] = useState(false);
  const [lgAddress, setLgAddress] = useState(""); const [lgAddrOpen, setLgAddrOpen] = useState(false);
  const [lgPhone, setLgPhone] = useState("8007793579"); const [lgMobile, setLgMobile] = useState("");
  const [lgEmail, setLgEmail] = useState("paul@usappliancefix.com");
  const [lgAddr1, setLgAddr1] = useState(""); const [lgAddr2, setLgAddr2] = useState("");
  const [lgCity, setLgCity] = useState(""); const [lgState, setLgState] = useState(""); const [lgStateOpen, setLgStateOpen] = useState(false);
  const [lgZip, setLgZip] = useState("");

  const [parts, setParts] = useState<PartRow[]>([{partNo:"",description:"",basePN:"",mfgCode:"",qty:1,price:"",coreValue:""}]);
  const [searchResult, setSearchResult] = useState("");
  const [pageSize, setPageSize] = useState(50);

  // Portal hooks
  const encAccDrop=usePortal(encAccountOpen); const encLocDrop=usePortal(encLocOpen);
  const encShipDrop=usePortal(encShipOpen); const encAddrDrop=usePortal(encAddrOpen);
  const encStateDrop=usePortal(encStateOpen);
  const lgAccDrop=usePortal(lgAccountOpen); const lgLocDrop=usePortal(lgLocOpen);
  const lgAddrDrop=usePortal(lgAddrOpen); const lgStateDrop=usePortal(lgStateOpen);

  const encAccList=useRef<HTMLDivElement>(null); const encLocList=useRef<HTMLDivElement>(null);
  const encShipList=useRef<HTMLDivElement>(null); const encAddrList=useRef<HTMLDivElement>(null);
  const encStateList=useRef<HTMLDivElement>(null);
  const lgAccList=useRef<HTMLDivElement>(null); const lgLocList=useRef<HTMLDivElement>(null);
  const lgAddrList=useRef<HTMLDivElement>(null); const lgStateList=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{
      const t=e.target as Node;
      const check=(open:boolean,setOpen:(v:boolean)=>void,trigRef:React.RefObject<HTMLButtonElement|null>,listRef:React.RefObject<HTMLDivElement|null>)=>{
        if(open&&!trigRef.current?.contains(t)&&!listRef.current?.contains(t)) setOpen(false);
      };
      check(encAccountOpen,setEncAccountOpen,encAccDrop.ref,encAccList);
      check(encLocOpen,setEncLocOpen,encLocDrop.ref,encLocList);
      check(encShipOpen,setEncShipOpen,encShipDrop.ref,encShipList);
      check(encAddrOpen,setEncAddrOpen,encAddrDrop.ref,encAddrList);
      check(encStateOpen,setEncStateOpen,encStateDrop.ref,encStateList);
      check(lgAccountOpen,setLgAccountOpen,lgAccDrop.ref,lgAccList);
      check(lgLocOpen,setLgLocOpen,lgLocDrop.ref,lgLocList);
      check(lgAddrOpen,setLgAddrOpen,lgAddrDrop.ref,lgAddrList);
      check(lgStateOpen,setLgStateOpen,lgStateDrop.ref,lgStateList);
    };
    document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn);
  },[encAccountOpen,encLocOpen,encShipOpen,encAddrOpen,encStateOpen,lgAccountOpen,lgLocOpen,lgAddrOpen,lgStateOpen]);

  const addPart = () => setParts(p=>[...p,{partNo:"",description:"",basePN:"",mfgCode:"",qty:1,price:"",coreValue:""}]);
  const updatePart = (i:number,k:keyof PartRow,v:string|number) => setParts(p=>p.map((r,idx)=>idx===i?{...r,[k]:v}:r));

  const portal = (open:boolean,listRef:React.RefObject<HTMLDivElement|null>,drop:{pos:{top:number;left:number;width:number}|null},children:React.ReactNode,minW=0) =>
    open&&drop.pos&&createPortal(<div ref={listRef} style={{...DROP_STYLE,top:drop.pos.top,left:drop.pos.left,width:Math.max(drop.pos.width,minW)}}>{children}</div>,document.body);

  const inputCls = "glass-input text-sm py-1.5 px-3 rounded-md w-full";
  const labelCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap";
  const fieldCls = "flex flex-col gap-1";

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={()=>setTab("encompass")} className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab==="encompass"?"bg-blue-600 text-white":"btn"}`}>Encompass</button>
          <button onClick={()=>setTab("lg")} className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab==="lg"?"bg-blue-600 text-white":"btn"}`}>LG</button>
        </div>

        <div className="panel mb-4">
          {tab === "encompass" ? (
            <div className="grid gap-3">
              {/* Row 1: Account + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Encompass Account*</label>
                  <button ref={encAccDrop.ref} onClick={()=>setEncAccountOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span className={encAccount?"":"text-muted-foreground"}>{encAccount||"Select Account"}</span><Chev open={encAccountOpen}/>
                  </button>
                  {portal(encAccountOpen,encAccList,encAccDrop,ENC_ACCOUNTS.map((a,i)=><button key={i} onClick={()=>{setEncAccount(a);setEncAccountOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${encAccount===a?"bg-blue-600 text-white":""}`}>{a}</button>))}
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Location</label>
                  <button ref={encLocDrop.ref} onClick={()=>setEncLocOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span className={encLocation?"":"text-muted-foreground"}>{encLocation||"Select Location"}</span><Chev open={encLocOpen}/>
                  </button>
                  {portal(encLocOpen,encLocList,encLocDrop,[<button key="all" onClick={()=>{setEncLocation("");setEncLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 text-slate-400`}>— Select —</button>,...LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setEncLocation(l);setEncLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${encLocation===l?"bg-blue-600 text-white":""}`}>{l}</button>)])}
                </div>
              </div>
              {/* Row 2: PO No + Reference No + Pickup W/H */}
              <div className="grid grid-cols-3 gap-4">
                <div className={fieldCls}><label className={labelCls}>PO No*</label><input value={encPoNo} readOnly className={`${inputCls} opacity-75`}/></div>
                <div className={fieldCls}><label className={labelCls}>Reference No</label><input value={encRefNo} onChange={e=>setEncRefNo(e.target.value)} className={inputCls}/></div>
                <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={encPickupWH} onChange={e=>setEncPickupWH(e.target.checked)} className="accent-blue-500"/>Pickup W/H</label></div>
              </div>
              {/* Row 3: Ship Method + Address + Submit */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className={fieldCls}>
                  <label className={labelCls}>Ship Method*</label>
                  <button ref={encShipDrop.ref} onClick={()=>setEncShipOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span>{encShipMethod}</span><Chev open={encShipOpen}/>
                  </button>
                  {portal(encShipOpen,encShipList,encShipDrop,SHIP_METHODS.map((m,i)=><button key={i} onClick={()=>{setEncShipMethod(m);setEncShipOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${encShipMethod===m?"bg-blue-600 text-white":""}`}>{m}</button>))}
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Address</label>
                  <button ref={encAddrDrop.ref} onClick={()=>setEncAddrOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span className={encAddress?"":"text-muted-foreground"}>{encAddress||"Select Address"}</span><Chev open={encAddrOpen}/>
                  </button>
                  {portal(encAddrOpen,encAddrList,encAddrDrop,[<button key="none" onClick={()=>{setEncAddress("");setEncAddrOpen(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 text-slate-400">— Select —</button>])}
                </div>
                <div className="flex justify-end"><button className="btn bg-blue-600 hover:bg-blue-700 text-white px-6">Submit</button></div>
              </div>
              {/* Row 4: Ship To Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}><label className={labelCls}>Ship To Name</label><input value={encShipName} onChange={e=>setEncShipName(e.target.value)} className={inputCls}/></div>
              </div>
              {/* Row 5: Ship To address fields */}
              <div className={fieldCls}>
                <label className={labelCls}>Ship To*</label>
                <div className="grid grid-cols-5 gap-2">
                  <input placeholder="(address1)" value={encAddr1} onChange={e=>setEncAddr1(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md col-span-2"/>
                  <input placeholder="(address2)" value={encAddr2} onChange={e=>setEncAddr2(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
                  <input placeholder="(city)" value={encCity} onChange={e=>setEncCity(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
                  <div className="flex gap-1">
                    <button ref={encStateDrop.ref} onClick={()=>setEncStateOpen(o=>!o)} className="glass-input text-sm py-1.5 px-2 rounded-md flex items-center justify-between gap-1 w-20">
                      <span className={encState?"":"text-muted-foreground text-xs"}>{encState||"State"}</span><Chev open={encStateOpen}/>
                    </button>
                    {portal(encStateOpen,encStateList,encStateDrop,US_STATES.map((s,i)=><button key={i} onClick={()=>{setEncState(s);setEncStateOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${encState===s?"bg-blue-600 text-white":""}`}>{s}</button>),80)}
                    <input placeholder="(zip code)" value={encZip} onChange={e=>setEncZip(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md flex-1"/>
                  </div>
                </div>
              </div>
              {/* Row 6: Phone + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}><label className={labelCls}>Phone No</label><input value={encPhone} onChange={e=>setEncPhone(e.target.value)} className={inputCls}/></div>
                <div className={fieldCls}><label className={labelCls}>Email</label><input value={encEmail} onChange={e=>setEncEmail(e.target.value)} className={inputCls}/></div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {/* LG Row 1: Account + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>LG Account*</label>
                  <button ref={lgAccDrop.ref} onClick={()=>setLgAccountOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span>{lgAccount}</span><Chev open={lgAccountOpen}/>
                  </button>
                  {portal(lgAccountOpen,lgAccList,lgAccDrop,LG_ACCOUNTS.map((a,i)=><button key={i} onClick={()=>{setLgAccount(a);setLgAccountOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${lgAccount===a?"bg-blue-600 text-white":""}`}>{a}</button>))}
                </div>
                <div className={fieldCls}>
                  <label className={labelCls}>Location</label>
                  <button ref={lgLocDrop.ref} onClick={()=>setLgLocOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span className={lgLocation?"":"text-muted-foreground"}>{lgLocation||"Select Location"}</span><Chev open={lgLocOpen}/>
                  </button>
                  {portal(lgLocOpen,lgLocList,lgLocDrop,[<button key="all" onClick={()=>{setLgLocation("");setLgLocOpen(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 text-slate-400">— Select —</button>,...LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLgLocation(l);setLgLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${lgLocation===l?"bg-blue-600 text-white":""}`}>{l}</button>)])}
                </div>
              </div>
              {/* LG Row 2: PO No + Reference No + Direct to Cx + Submit */}
              <div className="grid grid-cols-4 gap-4 items-end">
                <div className={fieldCls}><label className={labelCls}>PO No*</label><input value={lgPoNo} readOnly className={`${inputCls} opacity-75`}/></div>
                <div className={fieldCls}><label className={labelCls}>Reference No</label><input value={lgRefNo} onChange={e=>setLgRefNo(e.target.value)} className={inputCls}/></div>
                <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={lgDirectToCx} onChange={e=>setLgDirectToCx(e.target.checked)} className="accent-blue-500"/>Direct to Cx</label></div>
                <div className="flex justify-end"><button className="btn bg-blue-600 hover:bg-blue-700 text-white px-6">Submit</button></div>
              </div>
              {/* LG Row 3: Address */}
              <div className="grid grid-cols-2 gap-4">
                <div className={fieldCls}>
                  <label className={labelCls}>Address</label>
                  <button ref={lgAddrDrop.ref} onClick={()=>setLgAddrOpen(o=>!o)} className={`${inputCls} flex items-center justify-between gap-2`}>
                    <span className={lgAddress?"":"text-muted-foreground"}>{lgAddress||"Select Address"}</span><Chev open={lgAddrOpen}/>
                  </button>
                  {portal(lgAddrOpen,lgAddrList,lgAddrDrop,[<button key="none" onClick={()=>{setLgAddress("");setLgAddrOpen(false);}} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 text-slate-400">— Select —</button>])}
                </div>
              </div>
              {/* LG Row 4: Phone + Mobile + Email Address */}
              <div className="grid grid-cols-3 gap-4">
                <div className={fieldCls}><label className={labelCls}>Phone No</label><input value={lgPhone} onChange={e=>setLgPhone(e.target.value)} className={inputCls}/></div>
                <div className={fieldCls}><label className={labelCls}>&nbsp;</label><input placeholder="(mobile)" value={lgMobile} onChange={e=>setLgMobile(e.target.value)} className={inputCls}/></div>
                <div className={fieldCls}><label className={labelCls}>Email Address</label><input value={lgEmail} onChange={e=>setLgEmail(e.target.value)} className={inputCls}/></div>
              </div>
              {/* LG Row 5: Ship To */}
              <div className={fieldCls}>
                <label className={labelCls}>Ship To*</label>
                <div className="grid grid-cols-5 gap-2">
                  <input placeholder="(address1)" value={lgAddr1} onChange={e=>setLgAddr1(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md col-span-2"/>
                  <input placeholder="(address2)" value={lgAddr2} onChange={e=>setLgAddr2(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
                  <input placeholder="(city)" value={lgCity} onChange={e=>setLgCity(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md"/>
                  <div className="flex gap-1">
                    <button ref={lgStateDrop.ref} onClick={()=>setLgStateOpen(o=>!o)} className="glass-input text-sm py-1.5 px-2 rounded-md flex items-center justify-between gap-1 w-20">
                      <span className={lgState?"":"text-muted-foreground text-xs"}>{lgState||"State"}</span><Chev open={lgStateOpen}/>
                    </button>
                    {portal(lgStateOpen,lgStateList,lgStateDrop,US_STATES.map((s,i)=><button key={i} onClick={()=>{setLgState(s);setLgStateOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${lgState===s?"bg-blue-600 text-white":""}`}>{s}</button>),80)}
                    <input placeholder="(zip code)" value={lgZip} onChange={e=>setLgZip(e.target.value)} className="glass-input text-sm py-1.5 px-2 rounded-md flex-1"/>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Parts table */}
        <div className="panel overflow-x-auto p-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{parts.filter(p=>p.partNo).length}</span> record found</span>
            <div className="flex items-center gap-2">
              <input type="text" value={searchResult} onChange={e=>setSearchResult(e.target.value)} placeholder="search in result" className="glass-input text-sm py-1 px-2 rounded-md w-40"/>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 bg-white/5">
              {tab==="encompass"
                ? ["Part No","Description","BasePN","Mfg Code","Qty","Price","Core Value","Actions"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)
                : ["Part No","Description","Qty","Actions"].map(h=><th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>)
              }
            </tr></thead>
            <tbody>
              {parts.map((p,i)=>(
                <tr key={i} className="border-b border-white/5">
                  <td className="px-3 py-2"><input value={p.partNo} onChange={e=>updatePart(i,"partNo",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-full" style={{borderStyle:"dashed"}}/></td>
                  <td className="px-3 py-2"><input value={p.description} onChange={e=>updatePart(i,"description",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-full" style={{borderStyle:"dashed"}}/></td>
                  {tab==="encompass"&&<><td className="px-3 py-2"><input value={p.basePN} onChange={e=>updatePart(i,"basePN",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-full" style={{borderStyle:"dashed"}}/></td><td className="px-3 py-2"><input value={p.mfgCode} onChange={e=>updatePart(i,"mfgCode",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-24" style={{borderStyle:"dashed"}}/></td></>}
                  <td className="px-3 py-2"><input type="number" value={p.qty} onChange={e=>updatePart(i,"qty",+e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-16 text-right" min={1}/></td>
                  {tab==="encompass"&&<><td className="px-3 py-2"><input value={p.price} onChange={e=>updatePart(i,"price",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-24" style={{borderStyle:"dashed"}}/></td><td className="px-3 py-2"><input value={p.coreValue} onChange={e=>updatePart(i,"coreValue",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-24" style={{borderStyle:"dashed"}}/></td></>}
                  <td className="px-3 py-2 text-right"><button onClick={addPart} className="text-blue-400 hover:text-blue-300 text-xs font-medium">›Add</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {[10,20,50,100,500].map(n=>(
                <button key={n} onClick={()=>setPageSize(n)} className={`px-2 py-0.5 rounded text-xs ${pageSize===n?"bg-blue-600 text-white":"hover:text-foreground"}`}>{n}</button>
              ))}
            </div>
            <span className="text-xs text-blue-400 font-medium">1</span>
          </div>
        </div>
      </main>
    </div>
  );
}
