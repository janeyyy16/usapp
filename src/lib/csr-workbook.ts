// csr-workbook.ts — stub until xlsx is installed and report_sheet is configured
export type CsrCell = string | number | boolean | Date | null;

export interface CsrWorkbookColumn {
  index: number;
  label: string;
}

export interface CsrWorkbookRow {
  values: CsrCell[];
  lookup: Record<string, CsrCell>;
  searchText: string;
}

export interface CsrWorkbookBlock {
  teamName: string;
  columns: CsrWorkbookColumn[];
  rows: CsrWorkbookRow[];
  totals: {
    rows: number;
    schedule: number;
    attempt: number;
    update: number;
    mistakeCount: number;
  };
}

export interface CsrWorkbookSheet {
  name: string;
  sheetName: string;
  label: string;
  blocks: CsrWorkbookBlock[];
}

export interface CsrWorkbookData {
  sheets: CsrWorkbookSheet[];
  teamNames: string[];
  memberNames: string[];
}

export function formatCsrCell(cell: CsrCell): string {
  if (cell == null) return "";
  if (cell instanceof Date) return cell.toLocaleDateString();
  return String(cell);
}

export function getColumnIndex(blockOrColumns: CsrWorkbookBlock | CsrWorkbookColumn[], label: string | string[]): number {
  const cols = Array.isArray(blockOrColumns) ? blockOrColumns : blockOrColumns.columns;
  const labels = Array.isArray(label) ? label : [label];
  for (const l of labels) {
    const found = cols.find(c => c.label === l);
    if (found) return found.index;
  }
  return -1;
}

export async function loadCsrWorkbook(): Promise<CsrWorkbookData> {
  return { sheets: [], teamNames: [], memberNames: [] };
}
