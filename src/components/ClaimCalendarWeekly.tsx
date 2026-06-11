import { Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";
import { LOCATIONS } from "@/lib/locations";

interface Props { mod: ModuleDef; sub: SubModuleDef; }

// ── Data ─────────────────────────────────────────────────────────────────────
const TECHS = [
  "A'Dejaun Tyson","Abel Severino","Abraham Im","Alex Myles","Alexxis Henry",
  "Andre Riddle","Andy Oh","Austin Ferguson","Baolin Henry Zhang","Brandon Phillips",
  "Brye'shawn Butler","Carlos Ramirez","Chris Simpson","Christian Andrews","Christian Clark",
  "Cole Mushinsky","Cooper Shaffett","Corey Cage","Damon Ottley","Danny Thornton",
  "Darrin Stewart","Darryel Burdette","David Sims","Deprece Harris","Dominic Holman",
  "Dustin Earls","Dylan Lano","Edward Lindsey","Erick Guzman Juarez","Gabriel Talley",
  "Garrett McCarley","Gerrell Berg","Jacob Rhodes","Javier Camel","Jaylon Yarbrough",
  "Jeff Lucas","Jeremy Clark","Jordan Brown","Jordan Stanley","Joshua Rhinehart",
  "Justin Parker","Justin Robertson","Kevin Khaiphanliane","Kenny Shin","Lance Novak",
  "Leo Sun","Matthew Mccrary","Matt Simmons","Nathan Napora","Percy Smith",
];

const MODELS = ["GFE28GELLDS","WRF757SDHZ","FFTR1835VW","DV45K7600EW","WM3998HBA","GTX33EASKWW","FRUF2020AW","FCRE3083AS","NTF33X5OK","GNE27JYMFFS"];
const CUSTOMERS = ["John Argo","Ethel Brown","Robert Chance","Jane Smith","Carlos Mora","Beth Larsen","Brian Rowe","Neal Market","Rosa Fields","Tom O'Neil"];
const LOCATIONS_LIST = ["Atlanta","Birmingham","Knoxville","Memphis","Nashville","Jacksonville","Raleigh","Columbus","Mobile","Savannah","Chattanooga","Montgomery","New Orleans","Louisville","Dallas","San Antonio","Asheville"];
const BRANDS = ["GFE280GELLDS","ELECTROLUX","ASSURANT SOLUTIONS","SQUARE TRADE","GE","LG","SAMSUNG"];

function genTicketNo(seed: number): string {
  const s = seed * 137 + 400000;
  const r = seed % 6;
  if (r === 0) return `1007${String(s).slice(0,6)}96-10`;
  if (r === 1) return `26000${String(s+100000).slice(0,6)}DF`;
  if (r === 2) return `SA-${3000000 + (seed * 43) % 700000}`;
  if (r === 3) return `5618${String(s).slice(0,6)}BL-1`;
  if (r === 4) return `090${String(s*2).slice(0,9)}38`;
  return `3855${String(s).slice(0,3)}E${seed%9+1}`;
}
function genMiles(seed: number): string { return (3 + (seed * 31) % 117).toFixed(1); }
function pick<T>(arr: T[], i: number): T { return arr[((i % arr.length) + arr.length) % arr.length]; }

function getWeekDates(start: Date): Date[] {
  return Array.from({length:7},(_,i)=>{ const d=new Date(start); d.setDate(d.getDate()+i); return d; });
}
function getMondayOfWeek(d: Date): Date {
  const day = new Date(d); const dow = day.getDay();
  day.setDate(day.getDate() + (dow===0?-6:1-dow)); return day;
}
function fmtDate(d: Date): string { return d.toISOString().slice(0,10); }
function daysSince(d: Date): number { return Math.floor((Date.now()-d.getTime())/(1000*60*60*24)); }

interface TicketEntry {
  ticketNo: string; miles: string; isRed: boolean;
  customer: string; techName: string; completeDate: string;
  model: string; location: string; aging: number; brand: string;
}

function generateWeekData(dates: Date[], location: string) {
  return TECHS.map((tech, ti) => ({
    tech,
    days: dates.map((d, di) => {
      const count = (ti*3 + di*2 + d.getDate()) % 6;
      if (count === 0) return [] as TicketEntry[];
      return Array.from({length: count}, (_, j): TicketEntry => {
        const seed = ti*100 + di*10 + j;
        const completeD = new Date(d);
        completeD.setHours(10 + j*2, 34, 27);
        return {
          ticketNo: genTicketNo(seed),
          miles: genMiles(seed),
          isRed: (seed % 9 === 0),
          customer: pick(CUSTOMERS, seed+3),
          techName: tech,
          completeDate: completeD.toISOString().slice(0,10)+"T00:00:00",
          model: pick(MODELS, seed+1),
          location: location || pick(LOCATIONS_LIST, ti),
          aging: daysSince(d),
          brand: pick(BRANDS, seed),
        };
      });
    }),
  }));
}

// ── Popup ─────────────────────────────────────────────────────────────────────
interface PopupInfo { ticket: TicketEntry; x: number; y: number; }

function TicketPopup({ info, onClose }: { info: PopupInfo; onClose: () => void }) {
  const t = info.ticket;
  return createPortal(
    <div style={{position:"fixed",top:info.y,left:info.x,zIndex:99999,minWidth:320,maxWidth:380}}
         className="bg-white border border-gray-300 rounded shadow-2xl text-sm text-gray-800">
      <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b border-gray-300 rounded-t">
        <span className="font-semibold text-gray-700">{t.ticketNo} (SP)</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="h-4 w-4"/></button>
      </div>
      <div className="grid grid-cols-[130px_1fr] gap-x-2 gap-y-1 px-4 py-3">
        {[
          ["Customer", t.customer],
          ["TechName", t.techName],
          ["Complete Date", t.completeDate.replace("T00:00:00","T00:00:00")],
          ["Model", t.model],
          ["Location", t.location],
          ["Aging", `${t.aging} day(s)`],
        ].map(([label,value])=>(
          <>
            <span key={label+"l"} className="text-gray-500 font-medium">{label}</span>
            <span key={label+"v"} className="text-gray-800 font-semibold">{value}</span>
          </>
        ))}
      </div>
    </div>,
    document.body
  );
}

// ── Location dropdown (portal) ─────────────────────────────────────────────────
const DS: React.CSSProperties = {
  background:"rgb(22,28,52)", border:"1px solid rgba(255,255,255,0.15)",
  borderRadius:6, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:999999,
  position:"fixed", maxHeight:280, overflowY:"auto"
};
const Chev = ({o}:{o:boolean}) => <svg className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${o?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;

export function ClaimCalendarWeekly({ mod, sub }: Props) {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(today));
  const [location, setLocation] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [popup, setPopup] = useState<PopupInfo|null>(null);
  const locBtnRef = useRef<HTMLButtonElement>(null);
  const locListRef = useRef<HTMLDivElement>(null);
  const [locPos, setLocPos] = useState<any>(null);

  const updateLocPos = useCallback(()=>{
    if(!locBtnRef.current) return;
    const b=locBtnRef.current.getBoundingClientRect();
    setLocPos({top:b.bottom+2, left:b.left, width:b.width});
  },[]);

  useLayoutEffect(()=>{ if(locOpen) updateLocPos(); },[locOpen,updateLocPos]);
  useEffect(()=>{
    if(!locOpen) return;
    window.addEventListener("scroll",updateLocPos,true);
    window.addEventListener("resize",updateLocPos);
    return()=>{ window.removeEventListener("scroll",updateLocPos,true); window.removeEventListener("resize",updateLocPos); };
  },[locOpen,updateLocPos]);

  useEffect(()=>{
    const fn=(e:MouseEvent)=>{
      const t=e.target as Node;
      if(locOpen && !locBtnRef.current?.contains(t) && !locListRef.current?.contains(t)) setLocOpen(false);
    };
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[locOpen,popup]);

  const dates = getWeekDates(weekStart);
  const data = generateWeekData(dates, location);
  const prevWeek = ()=>{ const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); };
  const nextWeek = ()=>{ const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); };

  const handleTicketHover = (e: React.MouseEvent, ticket: TicketEntry) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(rect.left, window.innerWidth - 400);
    const y = Math.min(rect.bottom + 4, window.innerHeight - 240);
    setPopup({ticket, x, y});
  };

  const handleTicketClick = (e: React.MouseEvent, ticketNo: string) => {
    e.preventDefault();
    window.open(`/ticket/${encodeURIComponent(ticketNo)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="max-w-[1800px] mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Link to="/home" className="hover:text-foreground">🏠</Link><span>›</span>
        <Link to="/m/$module" params={{module:mod.slug}} className="hover:text-foreground">Claim</Link><span>›</span>
        <span className="text-foreground font-medium">Claim Calendar (Weekly)</span>
      </div>
      <div className="flex items-center gap-3 mb-5">
        <Link to="/m/$module" params={{module:mod.slug}} className="btn p-2 hover:bg-white/15">
          <ChevronLeft className="h-4 w-4"/>
        </Link>
        <h1 className="text-xl font-bold">Claim Calendar (Weekly)</h1>
      </div>

      {/* Filter bar — white/light style like the screenshot */}
      <div className="bg-white border border-gray-200 rounded shadow-sm mb-5 px-4 py-3 flex items-center gap-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Location</span>
        <div className="flex-1">
          <button ref={locBtnRef} onClick={()=>setLocOpen(o=>!o)}
            className="w-full text-sm py-1.5 px-3 rounded border border-gray-300 bg-white text-gray-800 flex items-center justify-between gap-2 hover:border-gray-400">
            <span className={location?"text-gray-800":"text-gray-400"}>{location||""}</span>
            <svg className={`h-3.5 w-3.5 text-gray-500 transition-transform ${locOpen?"rotate-180":""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {locOpen&&locPos&&createPortal(
            <div ref={locListRef} style={{...DS,top:locPos.top,left:locPos.left,width:Math.max(locPos.width,220)}}>
              <button onClick={()=>{setLocation("");setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===""?"bg-blue-600 text-white":"text-slate-300"}`}>— All Locations —</button>
              {LOCATIONS.map((l,i)=><button key={i} onClick={()=>{setLocation(l);setLocOpen(false);}} className={`w-full text-left px-3 py-2 text-sm hover:bg-white/5 ${location===l?"bg-blue-600 text-white":"text-slate-200"}`}>{l}</button>)}
            </div>,
            document.body
          )}
        </div>
        <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded">Show</button>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={prevWeek} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white">
          <ChevronLeft className="h-4 w-4"/>
        </button>
        <input type="date" value={fmtDate(weekStart)} onChange={e=>{const d=new Date(e.target.value);setWeekStart(getMondayOfWeek(d));}}
          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 bg-white"/>
        <span className="text-gray-500 text-sm">~</span>
        <input type="date" value={fmtDate(dates[6])} readOnly
          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-500 bg-gray-50"/>
        <button onClick={nextWeek} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white">
          <ChevronRight className="h-4 w-4"/>
        </button>
      </div>

      {/* Calendar grid — white background, dark header */}
      <div className="border border-gray-300 rounded overflow-x-auto shadow-sm">
        <table className="w-full text-xs border-collapse bg-white">
          <thead>
            <tr className="bg-[#1a2035]">
              <th className="border-r border-gray-600 px-3 py-3 text-left text-white font-semibold min-w-[140px] w-[140px]"></th>
              {dates.map(d=>(
                <th key={fmtDate(d)} className="border-r border-gray-600 last:border-r-0 px-2 py-3 text-center text-white font-semibold min-w-[160px]">
                  {fmtDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(({tech, days}, ti) => (
              <tr key={tech} className={`border-b border-gray-200 ${ti%2===0?"bg-white":"bg-gray-50/50"}`}>
                {/* Tech name cell */}
                <td className="border-r border-gray-200 px-3 py-2 align-top text-xs font-medium text-gray-700 whitespace-nowrap">
                  {tech}
                </td>
                {/* Day cells */}
                {days.map((tickets, di) => (
                  <td key={di} className="border-r border-gray-200 last:border-r-0 px-2 py-2 align-top min-w-[160px]">
                    <div className="flex flex-col gap-0.5">
                      {tickets.map((t, j) => (
                        <div key={j} className="flex items-center gap-1 flex-wrap">
                          {/* Ticket number — clickable, opens popup */}
                          <button
                            onMouseEnter={e=>handleTicketHover(e,t)}
                            onMouseLeave={()=>setPopup(null)}
                            onClick={e=>handleTicketClick(e,t.ticketNo)}
                            className={`font-mono text-xs hover:underline leading-none ${t.isRed?"text-red-500":"text-blue-600"}`}
                          >
                            {t.ticketNo}
                          </button>
                          {/* Miles badge — always green */}
                          <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-semibold bg-green-500 text-white leading-4">
                            {t.miles} mi
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket popup */}
      {popup && <TicketPopup info={popup} onClose={()=>setPopup(null)}/>}

      {/* Bottom status bar like original — shows URL on hover */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 px-3 py-0.5 text-xs text-blue-600 z-[9999] pointer-events-none">
        {popup ? `https://earlyrepair.com/Ticket/TicketDetailSP?TicketNo=${popup.ticket.ticketNo}` : ""}
      </div>
    </main>
  );
}
