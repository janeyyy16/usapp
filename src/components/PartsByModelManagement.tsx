import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Save } from "lucide-react";
import type { ModuleDef, SubModuleDef } from "@/lib/modules";

interface ModelRow { partNo: string; description: string; qty: number; }

export function PartsByModelManagement({ mod, sub }: { mod: ModuleDef; sub: SubModuleDef }) {
  const [modelCode, setModelCode] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [rows, setRows] = useState<ModelRow[]>([{ partNo: "", description: "", qty: 1 }]);

  const hasData = modelCode.trim().length > 0;

  const addRow = () => setRows(r => [...r, { partNo: "", description: "", qty: 1 }]);
  const update = (i: number, k: keyof ModelRow, v: string | number) =>
    setRows(r => r.map((row, idx) => idx !== i ? row : { ...row, [k]: v }));

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/m/$module" params={{ module: mod.slug }} className="btn hover:bg-white/15"><ChevronLeft className="h-4 w-4"/></Link>
          <h1 className="text-2xl font-bold">{sub.title}</h1>
        </div>

        <div className="panel mb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model Code*</label>
              <input value={modelCode} onChange={e => setModelCode(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model Version</label>
              <input value={modelVersion} onChange={e => setModelVersion(e.target.value)} className="glass-input text-sm py-1.5 px-3 rounded-md"/>
            </div>
            <div className="flex items-end pb-0.5">
              <button className="btn flex items-center gap-2 px-4"><Save className="h-3.5 w-3.5"/>Save</button>
            </div>
          </div>
        </div>

        {hasData ? (
          <div className="panel overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 bg-white/5">
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Part No</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Qty</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-3 py-2"><input value={r.partNo} onChange={e => update(i,"partNo",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-36" style={{borderStyle:"dashed"}}/></td>
                    <td className="px-3 py-2"><input value={r.description} onChange={e => update(i,"description",e.target.value)} className="glass-input text-sm py-1 px-2 rounded w-full" style={{borderStyle:"dashed"}}/></td>
                    <td className="px-3 py-2 text-center"><input type="number" value={r.qty} onChange={e => update(i,"qty",+e.target.value)} className="glass-input text-sm py-1 px-1 rounded w-16 text-right" min={1}/></td>
                    <td className="px-3 py-2 text-center"><button onClick={addRow} className="text-blue-400 hover:text-blue-300 text-xs">›Add</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="panel p-8 text-center text-sm text-muted-foreground">
            Enter a Model Code to manage parts by model.
          </div>
        )}
      </main>
    </div>
  );
}
