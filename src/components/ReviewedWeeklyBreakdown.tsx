import { useState } from "react";
import { toast } from "sonner";
import { reviewedWeeklyBreakdown, type ReviewedWeeklySource } from "@/lib/reviewedWeeklyBreakdown";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const headers = ["Technician", "Branch", "Workweek starting", "Regular hours (worked)", "OT hours (worked)", "PTO hours", "PTO pay", "Commission", "Bonus", "Mileage (miles)", "Mileage pay", "Weighted OT regular rate", "Company OT premium", "State / company rate / floor / hours"];

export function ReviewedWeeklyBreakdown({ people, sources, start, end, ready, onOpenEmployee }: {
  people: { id: string; name: string; branch: string }[]; sources: Map<string, ReviewedWeeklySource>;
  start: string; end: string; ready: boolean;
  onOpenEmployee: (profileId: string) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const data = ready ? people.flatMap((person) => {
    const source = sources.get(person.id);
    return source ? reviewedWeeklyBreakdown(source, start, end).map((row) => ({ person, row })) : [];
  }) : [];
  const ratesText = (row: typeof data[number]["row"]) => row.rates.map((r) =>
    `${r.state || "State not recorded"} | Company ${money(r.rate)}/hr | State floor ${r.stateFloor == null ? "Not configured" : `${money(r.stateFloor)}/hr`} | ${r.regular.toFixed(3)} regular + ${r.overtime.toFixed(3)} OT`).join("\n");
  const missing = ready ? people.filter((p) => !sources.has(p.id)) : [];
  const weekLabel = (weekStart: string | null) => {
    if (!weekStart) return "Unallocated (cutoff)";
    const first = new Date(`${start}T00:00:00Z`);
    first.setUTCDate(first.getUTCDate() - first.getUTCDay());
    const number = Math.round((Date.parse(`${weekStart}T00:00:00Z`) - first.getTime()) / 604800000) + 1;
    return `Week ${number} (${weekStart})`;
  };
  const download = async () => {
    setDownloading(true);
    try {
      const module = await import("exceljs");
      const ExcelJS = module.default ?? module;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Weekly Breakdown");
      sheet.addRow([`Reviewed payroll: ${start} to ${end}`]);
      sheet.addRow(["PTO is separate from worked hours. Unallocated amounts have no saved weekly assignment. State floors are reference rates, not additional pay."]);
      sheet.addRow(headers);
      for (const { person, row } of data) {
        sheet.addRow([person.name, person.branch, weekLabel(row.weekStart), row.regular, row.overtime,
          row.ptoHours, row.ptoPay, row.commission, row.bonus, row.mileage, row.mileagePay, row.regularRate,
          row.otPremium, ratesText(row)]);
      }
      const rates = workbook.addWorksheet("State Rate Details");
      rates.addRow(["Technician", "Branch", "Workweek starting", "Recorded state", "Company hourly rate", "State floor (reference)", "Regular hours (worked)", "OT hours (worked)"]);
      for (const { person, row } of data) for (const rate of row.rates) {
        rates.addRow([person.name, person.branch, row.weekStart, rate.state || "Not recorded", rate.rate, rate.stateFloor, rate.regular, rate.overtime]);
      }
      for (const [ws, headerRow] of [[sheet, 3], [rates, 1]] as const) {
        ws.views = [{ state: "frozen", xSplit: 1, ySplit: headerRow }];
        ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: Math.max(headerRow, ws.rowCount), column: ws.columnCount } };
        ws.getRow(headerRow).eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.alignment = { wrapText: true, vertical: "middle" };
        });
        ws.getRow(headerRow).height = 42;
        ws.columns.forEach((col, i) => { col.width = i === 0 ? 28 : i === 13 ? 100 : 20; });
        ws.eachRow((row, index) => {
          if (index <= headerRow) return;
          row.eachCell((cell) => {
            if (typeof cell.value === "number") cell.numFmt = "#,##0.000;[Red]-#,##0.000";
            cell.alignment = { wrapText: true, vertical: "top" };
          });
        });
      }
      sheet.eachRow((row, index) => {
        if (index <= 3) return;
        for (const col of [7, 8, 9, 11, 13]) row.getCell(col).numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';
        row.getCell(12).numFmt = '"$"0.0000';
      });
      if (missing.length) {
        const unavailable = workbook.addWorksheet("Unavailable Details");
        unavailable.addRow(["Technician", "Reason"]);
        for (const p of missing) unavailable.addRow([p.name, "No live weekly details for this saved row"]);
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url; link.download = `reviewed_weekly_${start}_to_${end}.xlsx`;
      link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Weekly export failed."); }
    finally { setDownloading(false); }
  };
  return <div className="space-y-3">
    <h4 className="font-semibold text-white">Weekly Breakdown · {start} to {end}</h4>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={!ready || !data.length || downloading} onClick={() => void download()}
        className="rounded bg-slate-700 px-3 py-2 text-sm text-white disabled:opacity-50">{downloading ? "Exporting..." : "Download Weekly Excel"}</button>
      <p className="text-xs text-slate-400">Sunday workweeks. PTO is separate from worked hours. Amounts without a saved week appear under Unallocated.</p>
    </div>
    <p className="text-xs text-slate-400">State details show recorded attendance states and reference minimum rates. Company rates and weighted OT rates are shown separately; state matches and salary matches remain in the payroll breakdown.</p>
    {!ready ? <p className="text-slate-400">Loading this cutoff's weekly details...</p> : <>
      {missing.length > 0 && <p className="text-amber-300 text-sm">Weekly details unavailable: {missing.map((p) => p.name).join(", ")}. Saved totals remain in the payroll breakdown.</p>}
      <div className="max-h-[70vh] overflow-auto rounded-lg border border-white/10">
        <table className="w-full text-xs"><thead className="sticky top-0 z-20 bg-slate-900 text-slate-300"><tr>
          {headers.map((header, i) => <th key={header} className={`${i === 0 ? "sticky left-0 z-30 bg-slate-900" : ""} min-w-[110px] p-2 text-left`}>{header}</th>)}
        </tr></thead><tbody>
          {data.map(({ person, row }) => <tr key={`${person.id}:${row.weekStart}`} className="border-t border-white/10 text-slate-200">
            <td className="sticky left-0 z-10 bg-slate-900 p-2 whitespace-nowrap">
              <button type="button" onClick={() => onOpenEmployee(person.id)} disabled={!ready}
                title="Open attendance and Tech Activity Report for this cutoff"
                className="text-blue-400 hover:text-blue-300 hover:underline disabled:opacity-50">{person.name}</button>
            </td><td className="p-2">{person.branch}</td>
            <td className="p-2 whitespace-nowrap">{weekLabel(row.weekStart)}</td>
            {[row.regular, row.overtime, row.ptoHours].map((n, i) => <td key={i} className="p-2 text-right tabular-nums">{n.toFixed(3)}</td>)}
            {[row.ptoPay, row.commission, row.bonus].map((n, i) => <td key={i} className="p-2 text-right tabular-nums">{money(n)}</td>)}
            <td className="p-2 text-right">{row.mileage.toFixed(3)}</td><td className="p-2 text-right">{money(row.mileagePay)}</td>
            <td className="p-2 text-right">{row.regularRate == null ? "—" : `$${row.regularRate.toFixed(4)}/hr`}</td>
            <td className="p-2 text-right">{money(row.otPremium)}</td><td className="min-w-[380px] whitespace-pre-line p-2">{ratesText(row) || "—"}</td>
          </tr>)}
          {!data.length && <tr><td colSpan={headers.length} className="p-4 text-center text-slate-400">No weekly details available.</td></tr>}
        </tbody></table>
      </div>
    </>}
  </div>;
}
