import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  AlertTriangle, Save, CheckCircle, Clock, FileText,
  BarChart2, Ticket, TrendingUp, Phone, MessageSquare,
  User, Mail, MapPin, CalendarDays, BadgeCheck, Edit3, X, Download,
} from "lucide-react";
import { csrReportData } from "@/lib/reportData";

/* ─────────────── constants ─────────────── */
const TEAM_COLORS: Record<string, string> = {
  "TEAM DANIELA": "#3b82f6", "TEAM ROBYN": "#34d399",
  "TEAM ROCHELLE": "#a78bfa", "TEAM SHANE": "#fb923c",
};
const POSITION_MAP: Record<string, string> = {
  "Assistant": "Senior Customer Service Representative",
  "Associate": "Customer Service Representative",
  "Training": "CSR Trainee", "Team Training": "CSR Trainee",
};
const TEAM_LEADERS = ["Daniela", "Robyn", "Rochelle", "Shane"];

/* ─────────────── dummy-data seed helpers ─────────────── */
function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return Math.abs(s) / 0xffffffff; };
}

const FIRST_NAMES = ["Robert","Maria","John","Anna","Jose","Mary","Michael","Elizabeth","David","Jennifer","James","Linda","Carlos","Patricia","Daniel","Barbara","Joseph","Susan","Charles","Jessica"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin"];
const BRANDS      = ["GE","GE","GE","ASSURANT","SQT","ELECTROLUX","MIDEA","AIG","HISENSE","NSA"];
const CITIES      = ["NASHVILLE","ATLANTA","RICHMOND","MEMPHIS","JACKSON","BIRMINGHAM","MOBILE","SAVANNAH","KNOXVILLE","RALEIGH","COLUMBUS","MONTGOMERY","HUNTSVILLE","CHATTANOOGA","DESTIN"];
const ISSUES      = ["Unit not cooling","Washing machine not spinning","Dishwasher not draining","Dryer not heating","Refrigerator making noise","Oven not igniting","AC not working","Ice maker broken","Washer leaking","Stove burner not lighting","Freezer frosting over","Microwave not heating"];
const RESOLUTIONS = ["Scheduled technician","Rescheduled - cx unavailable","Parts ordered, pending","Technician dispatched","Cx declined service","Escalated to supervisor","Claim filed","Callback requested","Left voicemail","Updated cx on status","Closed - resolved","Warranty verified"];
const CALL_NOTES  = ["Cx confirmed appointment","No answer - tried 3x","Cx requested morning slot","Parts ETA given","Cx very satisfied","Language barrier - conf call needed","Cx rescheduled","Left detailed VM","Cx confirmed receipt of tech","Follow-up scheduled","","","",""];

const TICKET_STATUSES: Array<{s:string;w:number}> = [
  {s:"CSR-Left Message for Cx",w:4},{s:"CSR-Assigned to ASC",w:3},{s:"CSR-Needs Scheduling",w:3},
  {s:"CSR-Acknowledged",w:2},{s:"CSR-Pending Callback",w:2},{s:"OP-Waiting for Part",w:2},
  {s:"CL-Claimed",w:2},{s:"TR-Need Triage",w:1},{s:"CSR-Resolved",w:1},{s:"Completed",w:2},
];
const CALL_TYPES   = ["Scheduled","Scheduled","Attempted","Attempted","Cx Updated","Inbound","Follow-up"];
const CALL_STATUSES= [{s:"Connected",w:5},{s:"No Answer",w:3},{s:"Left VM",w:3},{s:"Busy",w:1},{s:"Wrong Number",w:1}];

function weightedPick<T extends {w:number}>(arr: T[], r: number): T {
  const total = arr.reduce((s,a)=>s+a.w,0);
  let t = r * total;
  for (const a of arr) { t -= a.w; if (t<=0) return a; }
  return arr[arr.length-1];
}
function pick<T>(arr: T[], r: number): T { const idx = Math.min(Math.floor(r * arr.length), arr.length - 1); return arr[idx]; }

function fmtTicketNo(_seed: number, rng: ()=>number): string {
  const r = rng();
  if (r < 0.4) return "SA-" + String(Math.floor(rng() * 9000000) + 1000000);
  if (r < 0.65) return "HAP" + String(Math.floor(rng() * 900000000) + 100000000);
  if (r < 0.8) return String(Math.floor(rng() * 9000000000) + 1000000000) + (rng() < 0.4 ? "DF" : "");
  return String(Math.floor(rng() * 9000000000) + 1000000000) + (rng() < 0.3 ? "BL" : "");
}

function generateCallLog(name: string, count: number) {
  const rng = seededRand(name.split("").reduce((s,c)=>s+c.charCodeAt(0),0) + 1001);
  const today = new Date();
  return Array.from({length: count}, (_, i) => {
    const daysAgo = Math.floor(rng() * 30);
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().slice(0,10);
    const hour = 8 + Math.floor(rng() * 9);
    const min  = Math.floor(rng() * 60);
    const timeStr = `${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
    const st = weightedPick(CALL_STATUSES, rng());
    const callMin = st.s === "Connected" ? 1 + Math.floor(rng() * 8) : 0;
    const callSec = st.s === "Connected" ? Math.floor(rng() * 60) : Math.floor(rng() * 30);
    const fn = pick(FIRST_NAMES, rng()); const ln = pick(LAST_NAMES, rng());
    return {
      id: `c-${name}-${i}`,
      date: dateStr, time: timeStr,
      ticketNo: fmtTicketNo(Math.floor(rng()*999999), rng),
      customerName: `${fn} ${ln}`,
      city: pick(CITIES, rng()),
      brand: pick(BRANDS, rng()),
      callType: pick(CALL_TYPES, rng()) as "Scheduled"|"Attempted"|"Cx Updated"|"Inbound"|"Follow-up",
      status: st.s as "Connected"|"No Answer"|"Left VM"|"Busy"|"Wrong Number",
      durationMin: callMin, durationSec: callSec,
      notes: pick(CALL_NOTES, rng()),
    };
  }).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
}

function generateTicketLog(name: string, count: number) {
  const rng = seededRand(name.split("").reduce((s,c)=>s+c.charCodeAt(0),0) + 2002);
  const today = new Date();
  return Array.from({length: count}, (_, i) => {
    const daysAgo = Math.floor(rng() * 30);
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().slice(0,10);
    const hour = 8 + Math.floor(rng() * 9);
    const min  = Math.floor(rng() * 60);
    const timeStr = `${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
    const fn = pick(FIRST_NAMES, rng()); const ln = pick(LAST_NAMES, rng());
    const st = weightedPick(TICKET_STATUSES, rng());
    return {
      id: `t-${name}-${i}`,
      date: dateStr, time: timeStr,
      ticketNo: fmtTicketNo(Math.floor(rng()*999999), rng),
      customerName: `${fn} ${ln}`,
      city: pick(CITIES, rng()),
      brand: pick(BRANDS, rng()),
      status: st.s,
      issue: pick(ISSUES, rng()),
      resolution: pick(RESOLUTIONS, rng()),
      notes: pick(CALL_NOTES, rng()),
    };
  }).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
}

/* ─────────────── data helpers ─────────────── */
const fmtDate = (s: string) => { const c = s.trim().replace(/^0/,""); return c.length===3?`${c[0]}/${c.slice(1)}/26`:`${c.slice(0,-2)}/${c.slice(-2)}/26`; };

function parseMistakeBadges(raw: string): string[] {
  if (!raw||raw==="null") return [];
  const s=raw.trim();
  if (/^EXT\s/i.test(s)) return [s];
  if (s.length>20&&!/\d\/\d/.test(s)) return [s];
  const norm=s.replace(/\s*\/\s*/g," / ").replace(/\s+/g," ").trim();
  const tokens:string[]=[];
  for (const part of norm.split(" / ").map(p=>p.trim()).filter(Boolean)) {
    const re=/(\d+\s+)?(\d{1,2}\/\d{1,2})/g; let li=0,m:RegExpExecArray|null; const sub:string[]=[];
    while((m=re.exec(part))!==null){sub.push(m[1]?`${m[1].trim()} · ${m[2]}`:m[2]);li=m.index+m[0].length;}
    if(!sub.length)tokens.push(part); else{tokens.push(...sub);const t=part.slice(li).trim();if(t)tokens.push(t);}
  }
  return tokens.length?tokens:[s];
}

function getMistakeHistory(name:string){
  const out:Array<{dateKey:string;dateLabel:string;mistake:string;badges:string[];warning:number|null;team:string}>=[];
  for(const [dk,dd] of Object.entries(csrReportData as Record<string,any>)){
    const a=(dd.agents||[]).find((a:any)=>a.name===name);
    if(a&&a.mistake&&a.mistake!=="null") out.push({dateKey:dk,dateLabel:fmtDate(dk),mistake:a.mistake,badges:parseMistakeBadges(a.mistake),warning:a.warning??null,team:a.team||""});
  }
  return out.sort((a,b)=>a.dateKey.localeCompare(b.dateKey));
}

function getAllRecords(name:string){
  const out:Array<{dateKey:string;dateLabel:string;gh:number;schedule:number;attempt:number;update:number;task:string|null;warning:number;hasMistake:boolean}>=[];
  for(const [dk,dd] of Object.entries(csrReportData as Record<string,any>)){
    const a=(dd.agents||[]).find((a:any)=>a.name===name);
    if(a) out.push({dateKey:dk,dateLabel:fmtDate(dk),gh:a.gh||0,schedule:a.schedule||0,attempt:a.attempt||0,update:a.update||0,task:a.task||null,warning:a.warning||0,hasMistake:!!(a.mistake&&a.mistake!=="null")});
  }
  return out.sort((a,b)=>a.dateKey.localeCompare(b.dateKey));
}

function getLatest(name:string){
  const dates=Object.keys(csrReportData).sort();
  for(let i=dates.length-1;i>=0;i--){
    const a=(csrReportData as any)[dates[i]]?.agents?.find((a:any)=>a.name===name);
    if(a) return{...a,dateKey:dates[i],dateLabel:fmtDate(dates[i])};
  }
  return null;
}
function getTodayStats(name:string){
  const dates=Object.keys(csrReportData).sort();
  const a=(csrReportData as any)[dates[dates.length-1]]?.agents?.find((a:any)=>a.name===name);
  if(!a) return{claimed:0,completed:0,remaining:0,schedule:0,attempt:0,update:0};
  return{claimed:a.total||0,completed:a.schedule||0,remaining:Math.max(0,(a.gh||0)-(a.total||0)),schedule:a.schedule||0,attempt:a.attempt||0,update:a.update||0};
}
function decodeId(id:string){return decodeURIComponent(id).replace(/_/g," ");}

/* ─────────────── storage keys ─────────────── */
const SK  = (n:string)=>`csr_mistake_notes_${n.replace(/\s+/g,"_")}`;
const PK  = (n:string)=>`csr_personal_info_${n.replace(/\s+/g,"_")}`;
const CK  = (n:string)=>`csr_manual_counts_${n.replace(/\s+/g,"_")}`;

/* ─────────────── interfaces ─────────────── */
interface NoteEntry{id:string;author:string;role:"Manager"|"Team Leader"|"HR";type:"Verbal Warning"|"Written Warning"|"Disciplinary Action"|"Note"|"Resolved"|"Warning"|"Mistake";text:string;createdAt:string;}
interface PersonalInfo{position:string;email:string;phone:string;address:string;emergencyContact:string;emergencyPhone:string;hireDate:string;employeeId:string;notes:string;}

const NOTE_STYLES:Record<string,string>={
  "Verbal Warning":"bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
  "Written Warning":"bg-orange-500/15 text-orange-300 border-orange-500/25",
  "Disciplinary Action":"bg-red-500/15 text-red-300 border-red-500/25",
  "Note":"bg-blue-500/15 text-blue-300 border-blue-500/25",
  "Resolved":"bg-green-500/15 text-green-300 border-green-500/25",
  "Warning":"bg-red-500/15 text-red-300 border-red-500/25",
  "Mistake":"bg-orange-500/15 text-orange-300 border-orange-500/25",
};

const fmtDt=(iso:string)=>new Date(iso).toLocaleString("en-US",{month:"2-digit",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});

function StatCard({label,value,color}:{label:string;value:number|string;color:string}){
  const [b,t]=color.split("|");
  return(
    <div className={`panel p-4 text-center border ${b}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${t}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground/40 mt-1">From report data</p>
    </div>
  );
}

function exportCSV(filename:string,headers:string[],rows:(string|number)[][]){
  const esc=(v:string|number)=>`"${String(v).replace(/"/g,'""')}"`;
  const csv=[headers.map(esc).join(","),...rows.map(r=>r.map(esc).join(","))].join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=filename;a.click();
}

/* ─────────────── component ─────────────── */
function EmployeeMistakePage(){
  const {employeeId}=Route.useParams();
  const name=decodeId(employeeId);
  const history    =getMistakeHistory(name);
  const allRecords =getAllRecords(name);
  const latest     =getLatest(name);
  const todayStats =getTodayStats(name);

  const teamColor=latest?TEAM_COLORS[latest.team]||"#94a3b8":"#94a3b8";
  const teamLabel=latest?.team?.replace("TEAM ","")||"";
  const rawRole  =latest?.role||null;
  const basePos  =rawRole?(POSITION_MAP[rawRole]||rawRole):"Customer Service Representative";
  const isTL     =TEAM_LEADERS.some(tl=>name.toLowerCase().includes(tl.toLowerCase()));
  const position =isTL?"Team Leader":basePos;

  // Dummy logs — seeded from name so consistent across page loads
  const agentRecordCount = allRecords.length;
  const callLog    = useMemo(()=>generateCallLog(name, Math.max(20, agentRecordCount * 3)),[name, agentRecordCount]);
  const ticketLog  = useMemo(()=>generateTicketLog(name, Math.max(25, agentRecordCount * 4)),[name, agentRecordCount]);

  // Notes / personal info state
  const [notes,setNotes]             =useState<NoteEntry[]>([]);
  const [noteAuthor,setNoteAuthor]   =useState("");
  const [noteRole,setNoteRole]       =useState<NoteEntry["role"]>("Team Leader");
  const [noteType,setNoteType]       =useState<NoteEntry["type"]>("Note");
  const [noteText,setNoteText]       =useState("");
  const [saved,setSaved]             =useState(false);
  const [manualWarnings,setMW]       =useState(0);
  const [manualMistakes,setMM]       =useState(0);
  const [personalInfo,setPI]         =useState<PersonalInfo>({position,email:"",phone:"",address:"",emergencyContact:"",emergencyPhone:"",hireDate:latest?.startDate||"",employeeId:"",notes:""});
  const [editingP,setEditingP]       =useState(false);
  const [pSaved,setPSaved]           =useState(false);
  const [activeTab,setActiveTab]     =useState<"tracker"|"calls"|"tickets"|"performance"|"mistakes"|"da"|"personal">("tracker");

  // Filters
  const [callSearch,setCallSearch]     =useState("");
  const [callTypeF,setCallTypeF]       =useState("");
  const [callStatusF,setCallStatusF]   =useState("");
  const [callDateF,setCallDateF]       =useState("");
  const [tkSearch,setTkSearch]         =useState("");
  const [tkStatusF,setTkStatusF]       =useState("");
  const [tkBrandF,setTkBrandF]         =useState("");
  const [tkDateF,setTkDateF]           =useState("");

  useEffect(()=>{
    try{
      const s=localStorage.getItem(SK(name));if(s)setNotes(JSON.parse(s));
      const p=localStorage.getItem(PK(name));if(p)setPI(prev=>({...prev,...JSON.parse(p)}));
      const mc=localStorage.getItem(CK(name));if(mc){const{w,m}=JSON.parse(mc);setMW(w||0);setMM(m||0);}
    }catch{}
  },[name]);

  const saveNote=()=>{
    if(!noteText.trim())return;
    const entry:NoteEntry={id:Date.now().toString(),author:noteAuthor.trim()||"Anonymous",role:noteRole,type:noteType,text:noteText.trim(),createdAt:fmtDt(new Date().toISOString())};
    const upd=[entry,...notes];setNotes(upd);
    try{localStorage.setItem(SK(name),JSON.stringify(upd));}catch{}
    if(noteType==="Warning"){const nw=manualWarnings+1;setMW(nw);try{const mc=JSON.parse(localStorage.getItem(CK(name))||"{}");localStorage.setItem(CK(name),JSON.stringify({...mc,w:nw,m:mc.m||manualMistakes}));}catch{}}
    if(noteType==="Mistake"){const nm=manualMistakes+1;setMM(nm);try{const mc=JSON.parse(localStorage.getItem(CK(name))||"{}");localStorage.setItem(CK(name),JSON.stringify({...mc,m:nm,w:mc.w||manualWarnings}));}catch{}}
    setNoteText("");setSaved(true);setTimeout(()=>setSaved(false),2000);
  };
  const delNote=(id:string)=>{const u=notes.filter(n=>n.id!==id);setNotes(u);try{localStorage.setItem(SK(name),JSON.stringify(u));}catch{};};
  const savePI=()=>{try{localStorage.setItem(PK(name),JSON.stringify(personalInfo));}catch{};setPSaved(true);setEditingP(false);setTimeout(()=>setPSaved(false),2000);};

  // Filtered call log
  const filteredCalls=useMemo(()=>{
    return callLog.filter(c=>{
      const q=callSearch.toLowerCase();
      if(q&&!c.ticketNo.toLowerCase().includes(q)&&!c.customerName.toLowerCase().includes(q)&&!c.city.toLowerCase().includes(q))return false;
      if(callTypeF&&c.callType!==callTypeF)return false;
      if(callStatusF&&c.status!==callStatusF)return false;
      if(callDateF&&c.date!==callDateF)return false;
      return true;
    });
  },[callLog,callSearch,callTypeF,callStatusF,callDateF]);

  // Filtered ticket log
  const filteredTickets=useMemo(()=>{
    return ticketLog.filter(t=>{
      const q=tkSearch.toLowerCase();
      if(q&&!t.ticketNo.toLowerCase().includes(q)&&!t.customerName.toLowerCase().includes(q)&&!t.city.toLowerCase().includes(q))return false;
      if(tkStatusF&&t.status!==tkStatusF)return false;
      if(tkBrandF&&t.brand!==tkBrandF)return false;
      if(tkDateF&&t.date!==tkDateF)return false;
      return true;
    });
  },[ticketLog,tkSearch,tkStatusF,tkBrandF,tkDateF]);

  // Call stats
  const callStats=useMemo(()=>{
    const totalSec=callLog.reduce((s,c)=>s+c.durationMin*60+c.durationSec,0);
    const conn=callLog.filter(c=>c.status==="Connected");
    const avgSec=conn.length?Math.round(conn.reduce((s,c)=>s+c.durationMin*60+c.durationSec,0)/conn.length):0;
    return{total:callLog.length,connected:conn.length,noAnswer:callLog.filter(c=>c.status==="No Answer").length,leftVM:callLog.filter(c=>c.status==="Left VM").length,totalMin:Math.floor(totalSec/60),totalSec:totalSec%60,avgMin:Math.floor(avgSec/60),avgSec:avgSec%60};
  },[callLog]);

  // Ticket stats
  const ticketStats=useMemo(()=>({
    total:ticketLog.length,
    completed:ticketLog.filter(t=>t.status==="Completed"||t.status==="CSR-Resolved").length,
    claimed:ticketLog.filter(t=>t.status==="CL-Claimed").length,
    pending:ticketLog.filter(t=>t.status.includes("Pending")||t.status.includes("Callback")).length,
    escalated:ticketLog.filter(t=>t.status==="CSR-Assigned to ASC").length,
  }),[ticketLog]);

  const totalWarnings=history.reduce((s,e)=>s+(e.warning||0),0)+manualWarnings;
  const daysWorked   =allRecords.filter(r=>r.task==="In"||r.task==="Out").length;
  const totalGH      =allRecords.reduce((s,r)=>s+r.gh,0);
  const totalSchedule=allRecords.reduce((s,r)=>s+r.schedule,0);
  const totalAttempt =allRecords.reduce((s,r)=>s+r.attempt,0);

  const TABS=[
    {id:"tracker",    label:"Daily Tracker",  icon:<BarChart2     className="h-3.5 w-3.5"/>},
    {id:"calls",      label:"Call Log",        icon:<Phone         className="h-3.5 w-3.5"/>},
    {id:"tickets",    label:"Ticket Log",      icon:<Ticket        className="h-3.5 w-3.5"/>},
    {id:"performance",label:"Performance",     icon:<TrendingUp    className="h-3.5 w-3.5"/>},
    {id:"mistakes",   label:"Mistake History", icon:<AlertTriangle className="h-3.5 w-3.5"/>},
    {id:"da",         label:"DA Notes",        icon:<FileText      className="h-3.5 w-3.5"/>},
    {id:"personal",   label:"Personal Info",   icon:<User          className="h-3.5 w-3.5"/>},
  ] as const;

  const ic="glass-input text-sm py-1.5 px-3 rounded-md";
  const lc="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide";

  return(
    <div className="min-h-screen flex flex-col">
      <AppHeader/>
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="panel p-5 mb-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{background:`${teamColor}25`,border:`2px solid ${teamColor}60`,color:teamColor}}>
              {name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{color:teamColor}}>TEAM {teamLabel}</p>
              <h1 className="text-xl font-bold leading-tight">{name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5"><BadgeCheck className="h-3.5 w-3.5 text-muted-foreground"/><span className="text-sm text-muted-foreground">{position}</span></div>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Last report: {latest?.dateLabel||"—"}{latest?.startDate&&<span className="ml-2 text-white/30">· Hired: {latest.startDate}</span>}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5 pt-4 border-t border-white/10">
            {[
              {label:"Days Worked",   value:daysWorked,                       color:"text-white"},
              {label:"Total GH",      value:totalGH,                          color:"text-blue-300"},
              {label:"Schedule",      value:totalSchedule,                    color:"text-green-300"},
              {label:"Attempt",       value:totalAttempt,                     color:"text-purple-300"},
              {label:"Mistake Days",  value:history.length+manualMistakes,    color:"text-red-300"},
              {label:"Total Warnings",value:totalWarnings,                    color:"text-yellow-300"},
            ].map(k=>(
              <div key={k.label} className="text-center">
                <p className={`text-lg font-bold ${k.color}`}>{k.value||"—"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 p-1 bg-white/5 rounded-lg border border-white/10 w-fit">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{setActiveTab(t.id);setCallSearch("");setTkSearch("");}}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab===t.id?"bg-white/15 text-white":"text-muted-foreground hover:text-white hover:bg-white/5"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Daily Tracker ── */}
        {activeTab==="tracker"&&(
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-blue-400"/><span className="font-semibold">Daily Tracker</span><span className="text-xs text-muted-foreground">— {latest?.dateLabel||"latest"}</span></div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">Live from report data</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Values pulled directly from the CSR daily report.</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5"/>Ticket Activity</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatCard label="Tickets Handled"  value={todayStats.claimed}   color="border-blue-500/20|text-blue-300"/>
              <StatCard label="Calls Scheduled"  value={todayStats.completed} color="border-green-500/20|text-green-300"/>
              <StatCard label="Remaining (est.)" value={todayStats.remaining} color="border-yellow-500/20|text-yellow-300"/>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/>Call Activity</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Schedule"   value={todayStats.schedule} color="border-green-500/20|text-green-300"/>
              <StatCard label="Attempt"    value={todayStats.attempt}  color="border-purple-500/20|text-purple-300"/>
              <StatCard label="Cx Updated" value={todayStats.update}   color="border-cyan-500/20|text-cyan-300"/>
            </div>
          </div>
        )}

        {/* ── Call Log ── */}
        {activeTab==="calls"&&(
          <div className="space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                {label:"Total Calls",     value:callStats.total,                                  color:"text-white"},
                {label:"Connected",       value:callStats.connected,                              color:"text-green-300"},
                {label:"No Answer / VM",  value:callStats.noAnswer+callStats.leftVM,              color:"text-yellow-300"},
                {label:"Avg Talk Time",   value:`${callStats.avgMin}m ${callStats.avgSec}s`,      color:"text-purple-300"},
              ].map(k=>(
                <div key={k.label} className="panel p-3 text-center">
                  <p className={`text-xl font-bold ${k.color}`}>{k.value||"—"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Total talk time banner */}
            <div className="panel p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Talk Time (30 days)</span>
              <span className="text-lg font-bold text-blue-300">{callStats.totalMin}m {callStats.totalSec}s</span>
            </div>

            {/* Filters */}
            <div className="panel p-4 flex items-end gap-4">
              <div className="flex flex-col gap-1 flex-1"><label className={lc}>Search</label><input value={callSearch} onChange={e=>setCallSearch(e.target.value)} placeholder="Search ticket no, customer, city…" className={ic}/></div>
              <div className="flex flex-col gap-1"><label className={lc}>Type</label>
                <select value={callTypeF} onChange={e=>setCallTypeF(e.target.value)} className={ic}>
                  <option value="">All Types</option>{["Scheduled","Attempted","Cx Updated","Inbound","Follow-up"].map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div className="flex flex-col gap-1"><label className={lc}>Status</label>
                <select value={callStatusF} onChange={e=>setCallStatusF(e.target.value)} className={ic}>
                  <option value="">All Statuses</option>{["Connected","No Answer","Left VM","Busy","Wrong Number"].map(s=><option key={s}>{s}</option>)}
                </select></div>
              <div className="flex flex-col gap-1"><label className={lc}>Date</label><input type="date" value={callDateF} onChange={e=>setCallDateF(e.target.value)} className={ic} style={{colorScheme:"dark"}}/></div>
              {(callSearch||callTypeF||callStatusF||callDateF)&&<button onClick={()=>{setCallSearch("");setCallTypeF("");setCallStatusF("");setCallDateF("");}} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-muted-foreground border border-white/10 hover:bg-white/10 self-end"><X className="h-3.5 w-3.5"/>Clear</button>}
              <button onClick={()=>exportCSV(`${name.replace(/\s+/g,"_")}_call_log.csv`,["Date","Time","Ticket No","Customer","City","Brand","Type","Status","Duration","Notes"],filteredCalls.map(c=>[c.date,c.time,c.ticketNo,c.customerName,c.city,c.brand,c.callType,c.status,`${c.durationMin}m ${c.durationSec}s`,c.notes]))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white self-end transition-colors">
                <Download className="h-3.5 w-3.5"/>Export CSV
              </button>
              <span className="text-xs text-muted-foreground self-end mb-1">{filteredCalls.length} of {callLog.length}</span>
            </div>

            {/* Call table — full width, no horizontal scroll */}
            <div className="panel p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 bg-white/5">
                  {["Date & Time","Customer / City","Brand","Type","Status","Duration","Notes"].map(h=><th key={h} className="px-3 py-2.5 text-left text-xs text-muted-foreground uppercase">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredCalls.length===0?<tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No calls match filters.</td></tr>
                  :filteredCalls.map((c,i)=>(
                    <tr key={c.id} className={`border-b border-white/5 hover:bg-white/5 ${i%2!==0?"bg-white/[0.02]":""}`}>
                      <td className="px-3 py-3 w-[90px]"><p className="text-blue-300 font-medium text-xs">{c.date}</p><p className="text-muted-foreground text-[11px]">{c.time}</p></td>
                      <td className="px-3 py-3"><p className="font-medium text-sm">{c.customerName}</p><p className="text-[11px] text-muted-foreground">{c.city}</p><p className="font-mono text-[10px] text-white/30 mt-0.5">{c.ticketNo}</p></td>
                      <td className="px-3 py-3 text-xs font-medium">{c.brand}</td>
                      <td className="px-3 py-3"><span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/15 text-blue-300 border border-blue-500/25">{c.callType}</span></td>
                      <td className="px-3 py-3"><span className={`px-1.5 py-0.5 rounded text-xs border ${c.status==="Connected"?"bg-green-500/15 text-green-300 border-green-500/25":c.status==="No Answer"||c.status==="Busy"?"bg-red-500/15 text-red-300 border-red-500/25":"bg-yellow-500/15 text-yellow-300 border-yellow-500/25"}`}>{c.status}</span></td>
                      <td className="px-3 py-3 font-semibold text-purple-300 text-sm">{c.status==="Connected"?`${c.durationMin}m ${c.durationSec}s`:"—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{c.notes||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Ticket Log ── */}
        {activeTab==="tickets"&&(
          <div className="space-y-4">
            {/* KPI */}
            <div className="grid grid-cols-5 gap-4">
              {[
                {label:"Total",     value:ticketStats.total,    color:"text-white"},
                {label:"Completed", value:ticketStats.completed,color:"text-green-300"},
                {label:"Claimed",   value:ticketStats.claimed,  color:"text-blue-300"},
                {label:"Pending",   value:ticketStats.pending,  color:"text-yellow-300"},
                {label:"To ASC",    value:ticketStats.escalated,color:"text-red-300"},
              ].map(k=>(
                <div key={k.label} className="panel p-3 text-center">
                  <p className={`text-xl font-bold ${k.color}`}>{k.value||"—"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="panel p-4 flex items-end gap-4">
              <div className="flex flex-col gap-1 flex-1"><label className={lc}>Search</label><input value={tkSearch} onChange={e=>setTkSearch(e.target.value)} placeholder="Search ticket no, customer, city…" className={ic}/></div>
              <div className="flex flex-col gap-1"><label className={lc}>Status</label>
                <select value={tkStatusF} onChange={e=>setTkStatusF(e.target.value)} className={ic}>
                  <option value="">All Statuses</option>{["CSR-Left Message for Cx","CSR-Assigned to ASC","CSR-Needs Scheduling","CSR-Acknowledged","CSR-Pending Callback","CSR-Resolved","OP-Waiting for Part","CL-Claimed","TR-Need Triage","Completed"].map(s=><option key={s}>{s}</option>)}
                </select></div>
              <div className="flex flex-col gap-1"><label className={lc}>Brand</label>
                <select value={tkBrandF} onChange={e=>setTkBrandF(e.target.value)} className={ic}>
                  <option value="">All Brands</option>{["GE","ASSURANT","SQT","ELECTROLUX","MIDEA","AIG","HISENSE","NSA"].map(b=><option key={b}>{b}</option>)}
                </select></div>
              <div className="flex flex-col gap-1"><label className={lc}>Date</label><input type="date" value={tkDateF} onChange={e=>setTkDateF(e.target.value)} className={ic} style={{colorScheme:"dark"}}/></div>
              {(tkSearch||tkStatusF||tkBrandF||tkDateF)&&<button onClick={()=>{setTkSearch("");setTkStatusF("");setTkBrandF("");setTkDateF("");}} className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-muted-foreground border border-white/10 hover:bg-white/10 self-end"><X className="h-3.5 w-3.5"/>Clear</button>}
              <button onClick={()=>exportCSV(`${name.replace(/\s+/g,"_")}_ticket_log.csv`,["Date","Time","Ticket No","Customer","City","Brand","Status","Issue","Resolution","Notes"],filteredTickets.map(t=>[t.date,t.time,t.ticketNo,t.customerName,t.city,t.brand,t.status,t.issue,t.resolution,t.notes]))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white self-end transition-colors">
                <Download className="h-3.5 w-3.5"/>Export CSV
              </button>
              <span className="text-xs text-muted-foreground self-end mb-1">{filteredTickets.length} of {ticketLog.length}</span>
            </div>

            {/* Ticket table — full width, expanded */}
            <div className="panel p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 bg-white/5">
                  {["Date & Time","Customer / City","Brand","Status","Issue & Resolution","Notes"].map(h=><th key={h} className="px-3 py-2.5 text-left text-xs text-muted-foreground uppercase">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredTickets.length===0?<tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No tickets match filters.</td></tr>
                  :filteredTickets.map((t,i)=>(
                    <tr key={t.id} className={`border-b border-white/5 hover:bg-white/5 ${i%2!==0?"bg-white/[0.02]":""}`}>
                      <td className="px-3 py-3 w-[90px]"><p className="text-blue-300 font-medium text-xs">{t.date}</p><p className="text-muted-foreground text-[11px]">{t.time}</p></td>
                      <td className="px-3 py-3"><p className="font-medium text-sm">{t.customerName}</p><p className="text-[11px] text-muted-foreground">{t.city}</p><p className="font-mono text-[10px] text-white/30 mt-0.5">{t.ticketNo}</p></td>
                      <td className="px-3 py-3 text-xs font-medium">{t.brand}</td>
                      <td className="px-3 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs border ${t.status==="Completed"||t.status==="CSR-Resolved"?"bg-green-500/15 text-green-300 border-green-500/25":t.status==="CSR-Assigned to ASC"?"bg-red-500/15 text-red-300 border-red-500/25":t.status==="CL-Claimed"?"bg-blue-500/15 text-blue-300 border-blue-500/25":t.status.includes("Pending")||t.status.includes("Callback")?"bg-yellow-500/15 text-yellow-300 border-yellow-500/25":"bg-white/10 text-muted-foreground border-white/10"}`}>{t.status}</span>
                      </td>
                      <td className="px-3 py-3"><p className="text-xs text-muted-foreground">{t.issue}</p>{t.resolution&&<p className="text-[11px] text-white/40 mt-0.5">→ {t.resolution}</p>}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{t.notes||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Performance ── */}
        {activeTab==="performance"&&(
          <div className="panel p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3"><TrendingUp className="h-4 w-4 text-blue-400"/><span className="font-semibold text-sm">Performance History</span><span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25">{allRecords.length} days</span></div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5">{["Date","Task","GH","Schedule","Attempt","Update","Warning","Mistake"].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs text-muted-foreground uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{[...allRecords].reverse().map((r,i)=>(
                <tr key={i} className={`border-b border-white/5 hover:bg-white/5 ${i%2!==0?"bg-white/[0.02]":""}`}>
                  <td className="px-4 py-2.5 text-blue-300 font-medium whitespace-nowrap">{r.dateLabel}</td>
                  <td className="px-4 py-2.5"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.task==="In"?"bg-green-500/20 text-green-300":r.task==="Out"?"bg-blue-500/20 text-blue-300":r.task==="Absent"?"bg-red-500/20 text-red-300":"bg-white/10 text-muted-foreground"}`}>{r.task||"—"}</span></td>
                  <td className="px-4 py-2.5 text-right font-semibold text-blue-400">{r.gh||"—"}</td>
                  <td className="px-4 py-2.5 text-right text-green-400">{r.schedule||"—"}</td>
                  <td className="px-4 py-2.5 text-right text-purple-400">{r.attempt||"—"}</td>
                  <td className="px-4 py-2.5 text-right text-cyan-400">{r.update||"—"}</td>
                  <td className="px-4 py-2.5 text-center">{r.warning>0?<span className="px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">{r.warning}</span>:"—"}</td>
                  <td className="px-4 py-2.5 text-center">{r.hasMistake?<AlertTriangle className="h-3.5 w-3.5 text-red-400 mx-auto"/>:<span className="text-white/20">—</span>}</td>
                </tr>
              ))}</tbody></table></div>
          </div>
        )}

        {/* ── Mistakes ── */}
        {activeTab==="mistakes"&&(
          <div className="panel p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3"><AlertTriangle className="h-4 w-4 text-red-400 shrink-0"/><span className="font-semibold text-sm">Mistake History</span><span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400 border border-red-500/25">{history.length} date{history.length!==1?"s":""}</span></div>
            {history.length===0?<div className="px-5 py-10 text-center text-muted-foreground text-sm">No mistake records found.</div>
            :<div className="divide-y divide-white/5">{history.map((e,i)=>(
              <div key={i} className="px-5 py-4 flex flex-wrap items-start gap-x-6 gap-y-3 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-[80px] shrink-0"><p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Date</p><p className="text-sm font-semibold text-blue-300">{e.dateLabel}</p></div>
                <div className="flex flex-wrap items-center gap-1.5 flex-1">{e.badges.map((b,bi)=><span key={bi} className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-300 border border-red-500/25 whitespace-nowrap">{b}</span>)}</div>
                {e.warning!=null&&e.warning>0&&<span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/25 whitespace-nowrap shrink-0">⚠ {e.warning} warning</span>}
              </div>
            ))}</div>}
          </div>
        )}

        {/* ── DA Notes ── */}
        {activeTab==="da"&&(
          <div className="panel p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3"><FileText className="h-4 w-4 text-blue-400 shrink-0"/><span className="font-semibold text-sm">Disciplinary Actions &amp; Notes</span>{notes.length>0&&<span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/25">{notes.length}</span>}</div>
            <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Entry</p>
              <div className="flex flex-wrap gap-3 mb-3">
                <div className="flex flex-col gap-1 flex-1 min-w-[160px]"><label className={lc}>Author Name</label><input value={noteAuthor} onChange={e=>setNoteAuthor(e.target.value)} placeholder="Your name…" className={ic}/></div>
                <div className="flex flex-col gap-1"><label className={lc}>Role</label><select value={noteRole} onChange={e=>setNoteRole(e.target.value as NoteEntry["role"])} className={ic}><option>Team Leader</option><option>Manager</option><option>HR</option></select></div>
                <div className="flex flex-col gap-1"><label className={lc}>Type</label><select value={noteType} onChange={e=>setNoteType(e.target.value as NoteEntry["type"])} className={ic}><option>Note</option><option>Verbal Warning</option><option>Written Warning</option><option>Disciplinary Action</option><option>Resolved</option><option>Warning</option><option>Mistake</option></select></div>
              </div>
              <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Describe the action taken, context, or notes…" rows={3} className="glass-input text-sm py-2 px-3 rounded-md w-full resize-none mb-3"/>
              <div className="flex items-center gap-3">
                <button onClick={saveNote} disabled={!noteText.trim()} className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Save className="h-3.5 w-3.5"/>Save Entry</button>
                {saved&&<span className="flex items-center gap-1.5 text-xs text-green-400"><CheckCircle className="h-3.5 w-3.5"/>Saved</span>}
              </div>
            </div>
            {notes.length===0?<div className="px-5 py-10 text-center text-muted-foreground text-sm">No entries yet.</div>
            :<div className="divide-y divide-white/5">{notes.map(n=>(
              <div key={n.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap"><span className={`px-2 py-0.5 rounded text-xs font-medium border ${NOTE_STYLES[n.type]||NOTE_STYLES["Note"]}`}>{n.type}</span><span className="text-sm font-semibold">{n.author}</span><span className="text-xs text-muted-foreground">· {n.role}</span></div>
                  <div className="flex items-center gap-3 shrink-0"><span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap"><Clock className="h-3 w-3"/>{n.createdAt}</span><button onClick={()=>delNote(n.id)} className="text-white/20 hover:text-red-400 transition-colors text-lg leading-none">×</button></div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{n.text}</p>
              </div>
            ))}</div>}
          </div>
        )}

        {/* ── Personal Info ── */}
        {activeTab==="personal"&&(
          <div className="panel p-0 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3"><User className="h-4 w-4 text-purple-400"/><span className="font-semibold text-sm">Personal Information</span><span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">HR / Manager Only</span></div>
              <div className="flex items-center gap-2">
                {pSaved&&<span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5"/>Saved</span>}
                {editingP?<><button onClick={savePI} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-colors"><Save className="h-3.5 w-3.5"/>Save</button><button onClick={()=>setEditingP(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground border border-white/10 hover:bg-white/10 transition-colors"><X className="h-3.5 w-3.5"/>Cancel</button></>
                :<button onClick={()=>setEditingP(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white transition-colors"><Edit3 className="h-3.5 w-3.5"/>Edit</button>}
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-white/10 pb-2">Work Information</p>
                {([{label:"Position / Rank",key:"position",icon:<BadgeCheck className="h-3.5 w-3.5"/>,ph:"e.g. Customer Service Representative"},{label:"Employee ID",key:"employeeId",icon:<User className="h-3.5 w-3.5"/>,ph:"e.g. EMP-0042"},{label:"Hire Date",key:"hireDate",icon:<CalendarDays className="h-3.5 w-3.5"/>,ph:"e.g. 2025-01-15"},{label:"Work Email",key:"email",icon:<Mail className="h-3.5 w-3.5"/>,ph:"agent@ahsolutions.com"}] as const).map(f=>(
                  <div key={f.key} className="flex flex-col gap-1"><label className={`${lc} flex items-center gap-1.5`}>{f.icon}{f.label}</label>
                    {editingP?<input value={(personalInfo as any)[f.key]} onChange={e=>setPI(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} className={ic}/>:<p className="text-sm text-white/80 py-1.5 px-3 rounded-md bg-white/[0.03] border border-white/5">{(personalInfo as any)[f.key]||<span className="text-white/25 italic">Not set</span>}</p>}
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-white/10 pb-2">Contact &amp; Emergency</p>
                {([{label:"Phone Number",key:"phone",icon:<Phone className="h-3.5 w-3.5"/>,ph:"+63 9XX XXX XXXX"},{label:"Address",key:"address",icon:<MapPin className="h-3.5 w-3.5"/>,ph:"City, Province"},{label:"Emergency Contact",key:"emergencyContact",icon:<User className="h-3.5 w-3.5"/>,ph:"Name & Relationship"},{label:"Emergency Phone",key:"emergencyPhone",icon:<Phone className="h-3.5 w-3.5"/>,ph:"+63 9XX XXX XXXX"}] as const).map(f=>(
                  <div key={f.key} className="flex flex-col gap-1"><label className={`${lc} flex items-center gap-1.5`}>{f.icon}{f.label}</label>
                    {editingP?<input value={(personalInfo as any)[f.key]} onChange={e=>setPI(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} className={ic}/>:<p className="text-sm text-white/80 py-1.5 px-3 rounded-md bg-white/[0.03] border border-white/5">{(personalInfo as any)[f.key]||<span className="text-white/25 italic">Not set</span>}</p>}
                  </div>
                ))}
                <div className="flex flex-col gap-1"><label className={`${lc} flex items-center gap-1.5`}><MessageSquare className="h-3.5 w-3.5"/>Internal Notes</label>
                  {editingP?<textarea value={personalInfo.notes} onChange={e=>setPI(p=>({...p,notes:e.target.value}))} placeholder="Additional notes…" rows={3} className="glass-input text-sm py-2 px-3 rounded-md resize-none"/>:<p className="text-sm text-white/80 py-1.5 px-3 rounded-md bg-white/[0.03] border border-white/5 min-h-[60px] whitespace-pre-wrap">{personalInfo.notes||<span className="text-white/25 italic">Not set</span>}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer/>
    </div>
  );
}

export const Route=createFileRoute("/csr/mistake/$employeeId")({
  ssr:false,
  head:()=>({meta:[{title:"Agent Profile — Admin Hub Solutions"}]}),
  component:EmployeeMistakePage,
});
