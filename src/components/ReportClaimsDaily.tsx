import { useState, useMemo } from "react";
import { exportToCSV } from "@/lib/csvExport";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { claimsReportData } from "@/lib/reportData";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const ALL_DATES = Object.keys(claimsReportData).sort();
const ALL_BRANDS = ["GE","SQT","ASSURANT","AIG","SS","MIDEA"];
const COLORS = ["#3b82f6","#22d3ee","#a78bfa","#34d399","#fb923c","#f472b6","#facc15","#60a5fa"];
const fmtDate=(s:string)=>{const c=s.trim();return c.length===3?`${c[0]}/${c.slice(1)}/26`:`${c.slice(0,-2)}/${c.slice(-2)}/26`;};

const DAY_FILTERS = ["All","Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function getDayLabel(dateKey:string):string{
  const k=dateKey.trim();let m:number,d:number;
  if(k.length===3){m=parseInt(k[0]);d=parseInt(k.slice(1));}
  else{m=parseInt(k.slice(0,-2));d=parseInt(k.slice(-2));}
  const dt=new Date(2026,m-1,d);
  return["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
}

// Placeholder agent data — will be replaced when Supabase is wired
const PLACEHOLDER_AGENTS = [
  {name:"Agent A",claimed:18,completed:14,remaining:4},
  {name:"Agent B",claimed:22,completed:19,remaining:3},
  {name:"Agent C",claimed:15,completed:12,remaining:3},
  {name:"Agent D",claimed:27,completed:24,remaining:3},
  {name:"Agent E",claimed:19,completed:16,remaining:3},
  {name:"Agent F",claimed:12,completed:10,remaining:2},
];

export function ReportClaimsDaily({mod,sub}:{mod:ModuleDef;sub:SubModuleDef}){
  const [date,setDate]=useState(ALL_DATES[ALL_DATES.length-1]);
  const [brandFilter,setBrandFilter]=useState("");
  const [pendingFilter,setPendingFilter]=useState("");
  const [dayFilter,setDayFilter]=useState("All");
  const [agentSearch,setAgentSearch]=useState("");

  const d=useMemo(()=>(claimsReportData as any)[date]||{},[date]);
  const brands=d.brands||{};
  const pending=d.pending||{};

  const claimed:number = d.claimed || 0;
  const readyToComplete:number = d.readyToComplete || d.ready_to_complete || 0;
  const completed:number = d.completed || 0;
  const remaining:number = d.remaining || 0;

  // Use real agents from data if available, else placeholder
  const rawAgents:any[] = d.agents?.length ? d.agents : PLACEHOLDER_AGENTS;
  const isPlaceholder = !d.agents?.length;

  const filteredAgents = useMemo(()=>{
    if(!agentSearch.trim()) return rawAgents;
    return rawAgents.filter((a:any)=>a.name.toLowerCase().includes(agentSearch.toLowerCase()));
  },[rawAgents,agentSearch]);

  // Totals from agent breakdown
  const agentTotalClaimed = filteredAgents.reduce((s:number,a:any)=>s+(a.claimed||0),0);
  const agentTotalCompleted = filteredAgents.reduce((s:number,a:any)=>s+(a.completed||a.resolved||0),0);
  const agentTotalRemaining = filteredAgents.reduce((s:number,a:any)=>s+(a.remaining||0),0);

  const allPendingTypes=[...new Set(Object.values(claimsReportData).flatMap((x:any)=>Object.keys(x.pending||{})))].sort();
  const filteredBrands=brandFilter?Object.fromEntries(Object.entries(brands).filter(([b])=>b===brandFilter)):brands;
  const filteredPending=pendingFilter?Object.fromEntries(Object.entries(pending).filter(([t])=>t===pendingFilter)):pending;

  const trendDates=useMemo(()=>{
    const base=ALL_DATES.slice(-14);
    return dayFilter==="All"?base.slice(-10):base.filter(dt=>getDayLabel(dt)===dayFilter).slice(-8);
  },[dayFilter]);

  const brandChartData=Object.entries(filteredBrands).map(([name,value])=>({name,value:Number(value)})).sort((a,b)=>b.value-a.value);
  const pendingChartData=Object.entries(filteredPending).map(([name,value])=>({name,value:Number(value)}));
  const trendData=trendDates.map(dt=>{
    const x=(claimsReportData as any)[dt]||{};
    return{date:fmtDate(dt),claimed:x.claimed||0,readyToComplete:x.readyToComplete||x.ready_to_complete||0,completed:x.completed||0,remaining:x.remaining||0};
  });

  // Agent chart data
  const agentBarData=filteredAgents.map((a:any)=>({
    name:a.name.split(' ')[0]||a.name,
    claimed:a.claimed||0,
    completed:a.completed||a.resolved||0,
    remaining:a.remaining||0,
  }));

  const handleExportCSV=()=>{
    exportToCSV("claims_daily_report",
      ["Brand","Completed","Pending Type","Pending Count"],
      [...Object.entries(filteredBrands).map(([b,c]:any)=>[b,c,"",""]),
       ...Object.entries(filteredPending).map(([t,c]:any)=>["","",t,c])]
    );
  };
  const handleAgentExportCSV=()=>{
    exportToCSV("claims_agent_breakdown",
      ["Agent","Claimed","Completed","Remaining"],
      filteredAgents.map((a:any)=>[a.name,a.claimed||0,a.completed||a.resolved||0,a.remaining||0])
    );
  };

  return(
    <div className="min-h-screen flex flex-col"><main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
      <div className="flex items-center gap-3 mb-6"><Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link><h1 className="text-2xl font-bold">{sub.title}</h1></div>

      {/* Filters */}
      <div className="panel mb-6"><div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
          <select value={date} onChange={e=>setDate(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md">{ALL_DATES.map(d=><option key={d} value={d}>{fmtDate(d)}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand</label>
          <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"><option value="">All Brands</option>{ALL_BRANDS.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending Type</label>
          <select value={pendingFilter} onChange={e=>setPendingFilter(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"><option value="">All Types</option>{allPendingTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trend Day</label>
          <select value={dayFilter} onChange={e=>setDayFilter(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md">{DAY_FILTERS.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
        <div className="flex flex-col gap-1"><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent Search</label>
          <input value={agentSearch} onChange={e=>setAgentSearch(e.target.value)} placeholder="Filter agent…" className="glass-input text-sm py-1.5 px-3 rounded-md w-36"/></div>
        {(brandFilter||pendingFilter||dayFilter!=="All"||agentSearch)&&<button onClick={()=>{setBrandFilter("");setPendingFilter("");setDayFilter("All");setAgentSearch("");}} className="btn text-sm px-3 mb-0.5">Clear</button>}
      </div></div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="panel p-4 text-center border border-blue-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Claimed</p>
          <p className="text-3xl font-bold text-blue-300">{claimed||'—'}</p>
        </div>
        <div className="panel p-4 text-center border border-purple-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ready to Complete</p>
          <p className="text-3xl font-bold text-purple-300">{readyToComplete||'—'}</p>
        </div>
        <div className="panel p-4 text-center border border-green-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-300">{completed||'—'}</p>
        </div>
        <div className="panel p-4 text-center border border-yellow-500/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Remaining</p>
          <p className="text-3xl font-bold text-yellow-300">{remaining||'—'}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="panel p-4">
          <p className="text-sm font-semibold mb-4">Brand Breakdown — Completed</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brandChartData} margin={{left:-10}}>
              <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:11}}/>
              <YAxis tick={{fill:"#94a3b8",fontSize:11}}/>
              <Tooltip contentStyle={{background:"#1e293b",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6}} labelStyle={{color:"#f1f5f9"}}/>
              <Bar dataKey="value" radius={[4,4,0,0]}>{brandChartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-4">
          <p className="text-sm font-semibold mb-4">Pending Breakdown</p>
          {pendingChartData.length>0
            ?<ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pendingChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                  {pendingChartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"#1e293b",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6}}/>
              </PieChart>
            </ResponsiveContainer>
            :<div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No pending data.</div>}
        </div>
      </div>

      {/* Trend */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Claimed → Completed Trend {dayFilter!=="All"?`(${dayFilter}s)`:""}</p>
          <span className="text-xs text-muted-foreground">{trendData.length} data points</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData} margin={{left:-10}}>
            <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}}/>
            <YAxis tick={{fill:"#94a3b8",fontSize:11}}/>
            <Tooltip contentStyle={{background:"#1e293b",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
            <Bar dataKey="claimed" fill="#3b82f6" radius={[4,4,0,0]} name="Claimed"/>
            <Bar dataKey="readyToComplete" fill="#a78bfa" radius={[4,4,0,0]} name="Ready to Complete"/>
            <Bar dataKey="completed" fill="#34d399" radius={[4,4,0,0]} name="Completed"/>
            <Bar dataKey="remaining" fill="#fb923c" radius={[4,4,0,0]} name="Remaining"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Agent Breakdown ── */}
      <div className="panel p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Agent Breakdown — Claimed vs Completed</p>
            {isPlaceholder&&<span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Sample data · connects to Supabase</span>}
          </div>
          <span className="text-xs text-muted-foreground">{filteredAgents.length} agent{filteredAgents.length!==1?'s':''}</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={agentBarData} margin={{left:-10}}>
            <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:10}}/>
            <YAxis tick={{fill:"#94a3b8",fontSize:11}}/>
            <Tooltip contentStyle={{background:"#1e293b",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6}}/>
            <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
            <Bar dataKey="claimed" fill="#3b82f6" radius={[4,4,0,0]} name="Claimed"/>
            <Bar dataKey="completed" fill="#34d399" radius={[4,4,0,0]} name="Completed"/>
            <Bar dataKey="remaining" fill="#fb923c" radius={[4,4,0,0]} name="Remaining"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Agent breakdown table with totals row */}
      <div className="panel p-0 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-white/10 font-semibold text-sm flex justify-between">
          <span>Agent Details</span>
          <button onClick={handleAgentExportCSV} title="Download CSV" className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-2.5 text-left text-xs text-muted-foreground uppercase">Agent</th>
            <th className="px-4 py-2.5 text-right text-xs text-muted-foreground uppercase">Claimed</th>
            <th className="px-4 py-2.5 text-right text-xs text-muted-foreground uppercase">Completed</th>
            <th className="px-4 py-2.5 text-right text-xs text-muted-foreground uppercase">Remaining</th>
            <th className="px-4 py-2.5 text-right text-xs text-muted-foreground uppercase w-28">Rate</th>
          </tr></thead>
          <tbody>
            {filteredAgents.length===0
              ?<tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No agents match search.</td></tr>
              :filteredAgents.map((a:any,i:number)=>{
                const ag_claimed=a.claimed||0;
                const ag_completed=a.completed||a.resolved||0;
                const ag_remaining=a.remaining||0;
                const rate=ag_claimed>0?Math.round((ag_completed/ag_claimed)*100):null;
                return(
                  <tr key={i} className={`border-b border-white/5 hover:bg-white/5 ${i%2!==0?"bg-white/[0.02]":""}`}>
                    <td className="px-4 py-2.5 font-medium">{a.name}</td>
                    <td className="px-4 py-2.5 text-right text-blue-400 font-semibold">{ag_claimed||'—'}</td>
                    <td className="px-4 py-2.5 text-right text-green-400 font-semibold">{ag_completed||'—'}</td>
                    <td className="px-4 py-2.5 text-right text-orange-400">{ag_remaining||'—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      {rate!=null&&<span className={`px-2 py-0.5 rounded text-xs font-medium ${rate>=90?'bg-green-500/20 text-green-300':rate>=70?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'}`}>{rate}%</span>}
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
          {/* Totals row */}
          {filteredAgents.length>0&&(
            <tfoot>
              <tr className="border-t border-white/20 bg-white/5 font-semibold">
                <td className="px-4 py-2.5 text-xs uppercase text-muted-foreground">Total ({filteredAgents.length} agents)</td>
                <td className="px-4 py-2.5 text-right text-blue-300">{agentTotalClaimed}</td>
                <td className="px-4 py-2.5 text-right text-green-300">{agentTotalCompleted}</td>
                <td className="px-4 py-2.5 text-right text-orange-300">{agentTotalRemaining}</td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                  {agentTotalClaimed>0&&<span>{Math.round((agentTotalCompleted/agentTotalClaimed)*100)}% overall</span>}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Brand + Pending tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 font-semibold text-sm flex justify-between"><span>Brand Table</span><span className="flex items-center gap-2 text-xs text-muted-foreground">{Object.keys(filteredBrands).length} brands<button onClick={handleExportCSV} title="Download CSV" className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button></span></div>
          <table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5"><th className="px-4 py-2 text-left text-xs text-muted-foreground uppercase">Brand</th><th className="px-4 py-2 text-right text-xs text-muted-foreground uppercase">Count</th></tr></thead>
          <tbody>{Object.entries(filteredBrands).sort(([,a],[,b])=>Number(b)-Number(a)).map(([b,c])=><tr key={b} className="border-b border-white/5 hover:bg-white/5"><td className="px-4 py-2.5 font-medium">{b}</td><td className="px-4 py-2.5 text-right text-blue-400 font-semibold">{String(c)}</td></tr>)}</tbody>
        </table></div>
        <div className="panel p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 font-semibold text-sm flex justify-between"><span>Pending Table</span><span className="text-xs text-muted-foreground">{Object.keys(filteredPending).length} types</span></div>
          <table className="w-full text-sm"><thead><tr className="border-b border-white/10 bg-white/5"><th className="px-4 py-2 text-left text-xs text-muted-foreground uppercase">Type</th><th className="px-4 py-2 text-right text-xs text-muted-foreground uppercase">Count</th></tr></thead>
          <tbody>{Object.keys(filteredPending).length===0?<tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground text-sm">No pending data.</td></tr>:Object.entries(filteredPending).map(([t,c])=><tr key={t} className="border-b border-white/5 hover:bg-white/5"><td className="px-4 py-2.5">{t}</td><td className="px-4 py-2.5 text-right text-yellow-400 font-semibold">{String(c)}</td></tr>)}</tbody>
        </table></div>
      </div>
    </main></div>
  );
}
