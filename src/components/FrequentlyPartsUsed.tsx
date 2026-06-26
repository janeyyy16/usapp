import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

const SAMPLE_ROWS = [
  {rank:1,partNo:"DA61-06796A",description:"Ice Maker Assembly",modelCode:"RF28R7351SR",version:"",usageCount:142,vendor:"Samsung"},
  {rank:2,partNo:"DA97-07365G",description:"Water Filter",modelCode:"RF25HMEDBSR",version:"",usageCount:128,vendor:"Samsung"},
  {rank:3,partNo:"ACQ86576404",description:"Compressor Motor",modelCode:"LFX31945ST",version:"",usageCount:96,vendor:"LG"},
  {rank:4,partNo:"WPW10217825",description:"Wire Harness Main",modelCode:"WMH31017FS",version:"",usageCount:87,vendor:"Encompass"},
  {rank:5,partNo:"BN94-16105A",description:"Main PCB Assembly",modelCode:"UN65TU7000",version:"",usageCount:74,vendor:"Samsung"},
  {rank:6,partNo:"EBR86599104",description:"Main Control Board",modelCode:"LRMVS3006S",version:"",usageCount:68,vendor:"LG"},
  {rank:7,partNo:"W10536347",description:"Door Boot Seal",modelCode:"WFW9620HC",version:"",usageCount:61,vendor:"Marcone"},
];

export function FrequentlyPartsUsed({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [modelCode, setModelCode] = useState("");
  const [version, setVersion] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [rows, setRows] = useState<typeof SAMPLE_ROWS>([]);

  const handleRefresh = () => {
    setHasSearched(true);
    setRows(modelCode ? SAMPLE_ROWS.filter(r=>r.modelCode.toLowerCase().includes(modelCode.toLowerCase())) : SAMPLE_ROWS);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{module:mod.slug}} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model Code</label>
              <input type="text" value={modelCode} onChange={e=>{setModelCode(e.target.value);if(e.target.value.trim()&&handleRefresh)handleRefresh();}}
                onKeyDown={e=>e.key==="Enter"&&handleRefresh()}
                className="glass-input text-sm py-1.5 px-3 rounded-md"/>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Version</label>
              <input type="text" value={version} onChange={e=>setVersion(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleRefresh()}
                className="glass-input text-sm py-1.5 px-3 rounded-md"/>
            </div>
            <div className="flex items-end pb-0.5">
              <button onClick={handleRefresh} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4">
                Search
              </button>
            </div>
          </div>
        </div>

        {hasSearched && (
          <>
            <div className="mb-2 text-sm text-muted-foreground"><span className="text-foreground font-medium">{rows.length}</span> records found</div>
            <div className="panel overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10 bg-white/5">
                  {["Rank","Part No","Description","Model Code","Version","Usage Count","Vendor"].map(h=>(
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.length===0
                    ? <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No parts found for this model code.</td></tr>
                    : rows.map((r,idx)=>(
                      <tr key={r.rank} className={`border-b border-white/5 hover:bg-white/5 ${idx%2!==0?"bg-white/[0.02]":""}`}>
                        <td className="px-3 py-2.5 text-center font-bold text-muted-foreground">{r.rank}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{r.partNo}</td>
                        <td className="px-3 py-2.5 text-xs">{r.description}</td>
                        <td className="px-3 py-2.5 font-mono text-xs">{r.modelCode}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.version||"—"}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-blue-300">{r.usageCount}</td>
                        <td className="px-3 py-2.5 text-xs">{r.vendor}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!hasSearched && (
          <div className="panel p-8 text-center text-muted-foreground text-sm">
            Enter a Model Code to view frequently used parts.
          </div>
        )}
      </main>
    </div>
  );
}
