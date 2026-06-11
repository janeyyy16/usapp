import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

interface TriageMgmtRow {
  id: string; modelCode: string; version: string;
  madeMonthFrom: string; madeMonthTo: string; symptom: string;
  parts: string[];
}

const emptyRow = (id: number): TriageMgmtRow => ({
  id: "", modelCode: "", version: "", madeMonthFrom: "", madeMonthTo: "", symptom: "",
  parts: Array(10).fill(""),
});

export function TriageManagement({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<TriageMgmtRow[]>([emptyRow(1)]);

  const addRow = () => setRows(r => [...r, emptyRow(r.length + 1)]);

  const updateRow = (i: number, field: keyof Omit<TriageMgmtRow, "parts">, val: string) =>
    setRows(r => r.map((row, idx) => idx !== i ? row : { ...row, [field]: val }));

  const updatePart = (ri: number, pi: number, val: string) =>
    setRows(r => r.map((row, idx) => idx !== ri ? row : { ...row, parts: row.parts.map((p, j) => j !== pi ? p : val) }));

  const filtered = rows.filter(r => !search || r.modelCode.toLowerCase().includes(search.toLowerCase()) || r.symptom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{ module: mod.slug }} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        {/* Top search bar */}
        <div className="panel mb-4">
          <div className="flex items-center gap-3">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by model code or symptom..."
              className="glass-input text-sm py-1.5 px-3 rounded-md flex-1"/>
            <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
          </div>
        </div>

        <div className="panel overflow-x-auto p-0">
          {/* CSV format note + toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-wrap gap-2">
            <span className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{filtered.filter(r=>r.modelCode).length}</span> record found</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              *CSV Format: Id + ModelCode + Version + MadeMonthFrom + MadeMonthTo + Symptom + Part1 + Part2 + ... + Part10
              <button className="btn px-3 py-1 text-xs">Import</button>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search in result" className="glass-input text-xs py-1 px-2 rounded-md w-36"/>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">ID</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Model Code</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Version</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap" colSpan={2}>Made Month Range</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Symptom</th>
                  {/* Parts (Qty) group header */}
                  <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap border-l border-white/10" colSpan={10}>Parts (Qty)</th>
                  <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">Actions</th>
                </tr>
                <tr className="border-b border-white/10 bg-white/3">
                  <th colSpan={6}></th>
                  {Array.from({length:10},(_,i)=>(
                    <th key={i} className="px-2 py-1.5 text-center text-xs text-muted-foreground border-l border-white/10">Part{i+1}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, ri) => (
                  <tr key={ri} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-2 py-1.5">
                      <input value={row.id} onChange={e=>updateRow(ri,"id",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-12 text-center" style={{borderStyle:"dashed"}}/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.modelCode} onChange={e=>updateRow(ri,"modelCode",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-24" style={{borderStyle:"dashed"}}/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.version} onChange={e=>updateRow(ri,"version",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-16" style={{borderStyle:"dashed"}}/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="date" value={row.madeMonthFrom} onChange={e=>updateRow(ri,"madeMonthFrom",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-28" style={{borderStyle:"dashed"}}/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="date" value={row.madeMonthTo} onChange={e=>updateRow(ri,"madeMonthTo",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-28" style={{borderStyle:"dashed"}}/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input value={row.symptom} onChange={e=>updateRow(ri,"symptom",e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-28" style={{borderStyle:"dashed"}}/>
                    </td>
                    {row.parts.map((p, pi) => (
                      <td key={pi} className="px-1 py-1.5 border-l border-white/5">
                        <input value={p} onChange={e=>updatePart(ri,pi,e.target.value)} className="glass-input text-xs py-1 px-1 rounded w-20" style={{borderStyle:"dashed"}}/>
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={addRow} className="text-blue-400 hover:text-blue-300 text-xs font-medium">›Add</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {[10,20,50,100].map(n=>(
                <button key={n} onClick={()=>setPageSize(n)} className={`px-2 py-0.5 rounded ${pageSize===n?"bg-blue-600 text-white":"hover:text-foreground"}`}>{n}</button>
              ))}
            </div>
            <span className="text-xs text-blue-400 font-medium">1</span>
          </div>
        </div>

        {/* Footer notes */}
        <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
          <p>*Format of [Parts and Qty]: PartNo1(Qty1)</p>
          <p>*If the quantity is 1, it may be omitted.</p>
        </div>
      </main>
    </div>
  );
}
