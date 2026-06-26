/**
 * OVERALL STATUS — placeholder/dummy data for dashboard visuals.
 * Not synced to real data; for demo visuals only.
 */

// ─── Ticket Statistics (Monthly) ────────────────────────────────────────────
// One row per month; each brand/source is a line, plus TOTAL.
const MONTHS = ["2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"];
const TOTAL_MONTHLY = [5732,6690,5941,5548,5247,4668,5828,6052,6367,7397,6559,7063,6048];
const GE_MONTHLY    = [1505,1639,1812,1688,1765,1281,1806,1733,2172,2718,2146,2496,1659];
const ASSURANT_M    = [1203,1496,1445,1262,1094,1064,1362,1017,1509,1602,1369,1710,1554];
const CENTRICITY_M  = [684,885,805,636,575,675,799,808,783,669,678,1094,890];

export const MONTHLY_STATS = MONTHS.map((month, i) => ({
  date: month,
  TOTAL: TOTAL_MONTHLY[i],
  GE: GE_MONTHLY[i],
  Assurant: ASSURANT_M[i],
  Centricity: CENTRICITY_M[i],
}));

// ─── Ticket Statistics (Daily) ──────────────────────────────────────────────
const DAYS = ["05/27","05/28","05/29","05/30","05/31","06/01","06/02","06/03","06/04","06/05","06/06","06/07","06/08","06/09","06/10","06/11","06/12","06/13","06/14","06/15","06/16","06/17","06/18","06/19","06/20","06/21","06/22","06/23","06/24","06/25"];
const TOTAL_DAILY = [349,326,295,151,463,329,305,271,309,237,265,269,285,389,276,290,266,169,397,128,282,287,364,100,99,257,147,257,180,257];
const GE_DAILY    = [101,103,94,32,151,117,120,105,88,55,66,88,131,102,83,88,89,50,147,52,71,69,128,55,50,78,40,78,55,78];
const ASSURANT_D  = [53,43,44,28,75,53,49,46,38,39,39,46,55,52,41,42,38,33,51,34,38,41,40,29,27,44,30,44,33,44];

export const DAILY_STATS = DAYS.map((day, i) => ({
  date: day,
  TOTAL: TOTAL_DAILY[i],
  GE: GE_DAILY[i],
  Assurant: ASSURANT_D[i],
}));

export const STAT_LINES = [
  { key: "TOTAL", color: "#22c55e" },
  { key: "GE", color: "#3b82f6" },
  { key: "Assurant", color: "#14b8a6" },
  { key: "Centricity", color: "#a78bfa" },
];

// ─── Pending Tickets by Status (donut) ──────────────────────────────────────
export const PENDING_BY_STATUS = [
  { name: "OP-Ready for Service", value: 1188, color: "#0d9488" },
  { name: "OP-Waiting for Part", value: 297, color: "#c4b5fd" },
  { name: "CSR-Left Message for Cx", value: 194, color: "#cbb994" },
  { name: "CSR-Needs Scheduling", value: 138, color: "#38bdf8" },
  { name: "OP-Reschedule Follow up", value: 104, color: "#ec4899" },
  { name: "PT-Need PreAuthorization", value: 96, color: "#a5b4fc" },
  { name: "CL-Ready to Complete", value: 77, color: "#b45309" },
  { name: "CL-Need Cancel", value: 56, color: "#1e40af" },
  { name: "CSR-Assigned to ASC", value: 51, color: "#475569" },
  { name: "TR-Need PO", value: 40, color: "#a16207" },
  { name: "TR-Need Triage", value: 40, color: "#9ca3af" },
  { name: "OP-UPDATE HOLD", value: 38, color: "#f59e0b" },
  { name: "CL-Parts Back Ordered", value: 362, color: "#3f3f46" },
];

// ─── Pending Tickets by Location (donut) ────────────────────────────────────
export const PENDING_BY_LOCATION = [
  { name: "St. Louis", value: 162, color: "#0d9488" },
  { name: "Jackson, MS", value: 151, color: "#c4b5fd" },
  { name: "Wilmington", value: 146, color: "#cbb994" },
  { name: "Columbus", value: 144, color: "#38bdf8" },
  { name: "Memphis", value: 137, color: "#ec4899" },
  { name: "New Orleans", value: 136, color: "#a5b4fc" },
  { name: "Huntsville", value: 118, color: "#a16207" },
  { name: "Birmingham", value: 115, color: "#1d4ed8" },
  { name: "Atlanta", value: 110, color: "#15803d" },
  { name: "Jacksonville", value: 107, color: "#b45309" },
  { name: "Mobile", value: 107, color: "#92400e" },
  { name: "Knoxville", value: 104, color: "#475569" },
  { name: "Jackson, TN", value: 101, color: "#059669" },
  { name: "Nashville", value: 98, color: "#166534" },
  { name: "Savannah", value: 85, color: "#ea580c" },
  { name: "Chattanooga", value: 84, color: "#c4b5fd" },
  { name: "Tallahassee", value: 63, color: "#a5b4fc" },
  { name: "Raleigh", value: 58, color: "#cbb994" },
  { name: "Little Rock", value: 47, color: "#67e8f9" },
  { name: "Norfolk", value: 41, color: "#a78bfa" },
  { name: "Asheville", value: 40, color: "#f472b6" },
  { name: "Destin", value: 36, color: "#1e3a8a" },
  { name: "Cape Girardeau", value: 36, color: "#7c3aed" },
  { name: "Richmond", value: 34, color: "#15803d" },
  { name: "Jonesboro", value: 33, color: "#b91c1c" },
  { name: "Montgomery", value: 32, color: "#0891b2" },
  { name: "Lake Charles", value: 18, color: "#84cc16" },
  { name: "San Antonio", value: 14, color: "#fca5a5" },
];

// ─── CSR Activity (donut, many small slices) ────────────────────────────────
const CSR_NAMES = [
  "John Maverick Nieto","Wincel Franz Carusca","Mark Marquez","Lloyd Tombiga","Alona Jane Bautista",
  "Angelo Husain","Krista Griffiss","Ian Montesclaros","Jeselton Chu","Shiela Marie Estrellado",
  "Geneva Calomarde","Jo-Ann Lazate","Marie Frances Javier","Francis John Rebosura","Job Christian Alberto",
  "Rocky Deles","Arnulfo Montesclaros Jr","John Carl Cabahug","Kemuel Tamayo","Jeryan Luzano",
  "Nicole Noval","Monicris Dumanao","Alyssa Diones","Alex Rayos","Jenny Mahawan",
];
const CSR_COLORS = ["#000000","#0d9488","#38bdf8","#cbb994","#ec4899","#a16207","#1d4ed8","#15803d","#b45309","#475569","#7c3aed","#0891b2","#84cc16","#f472b6","#1e3a8a","#059669","#166534","#ea580c","#c4b5fd","#a5b4fc","#67e8f9","#a78bfa","#fca5a5","#b91c1c","#9ca3af"];
const CSR_VALUES = [106,101,85,74,71,67,66,62,59,58,53,51,50,48,46,45,44,40,39,38,37,35,33,32,28];

export const CSR_ACTIVITY = CSR_NAMES.map((name, i) => ({
  name, value: CSR_VALUES[i], color: CSR_COLORS[i % CSR_COLORS.length],
}));

// ─── Tech Ranking Report (table) ────────────────────────────────────────────
export interface RankingRow {
  rank: number;
  name: string;
  office: string;
  thirtyDay: number | null;
  tenDay: number | null;
}

export const TECH_RANKING: RankingRow[] = [
  { rank: 1, name: "J Colquett", office: "Mobile", thirtyDay: 71.43, tenDay: null },
  { rank: 2, name: "H Pence", office: "Jonesboro", thirtyDay: 71.43, tenDay: 68.00 },
  { rank: 3, name: "J Williamson", office: "Raleigh", thirtyDay: 69.86, tenDay: 65.57 },
  { rank: 4, name: "K Khaiphanliane", office: "Atlanta", thirtyDay: 65.82, tenDay: 64.52 },
  { rank: 5, name: "C Andrews", office: "Chattanooga", thirtyDay: 64.42, tenDay: 54.55 },
  { rank: 6, name: "A Henry", office: "Raleigh", thirtyDay: 61.64, tenDay: 64.15 },
  { rank: 7, name: "L Dowell", office: "St. Louis", thirtyDay: 60.14, tenDay: 65.57 },
  { rank: 8, name: "C Simpson", office: "Norfolk", thirtyDay: 59.68, tenDay: 60.00 },
  { rank: 9, name: "C Schexnayder", office: "Lake Charles", thirtyDay: 59.46, tenDay: 61.76 },
  { rank: 10, name: "A Severino", office: "Atlanta", thirtyDay: 59.02, tenDay: 45.45 },
  { rank: 11, name: "M Kaazim-Johnson", office: "Wilmington", thirtyDay: 57.89, tenDay: 57.89 },
  { rank: 12, name: "L Novak", office: "Savannah", thirtyDay: 57.78, tenDay: 57.53 },
  { rank: 13, name: "Z Moradi", office: "Jacksonville", thirtyDay: 57.41, tenDay: 50.00 },
  { rank: 14, name: "E Guzman Juarez", office: "San Antonio", thirtyDay: 56.57, tenDay: 62.07 },
  { rank: 15, name: "J Parker", office: "Jackson, TN", thirtyDay: 55.81, tenDay: 50.00 },
  { rank: 16, name: "Z Coisman", office: "Knoxville", thirtyDay: 54.85, tenDay: 55.38 },
  { rank: 17, name: "C French", office: "New Orleans", thirtyDay: 54.55, tenDay: 54.55 },
  { rank: 18, name: "C Shaffett", office: "Lake Charles", thirtyDay: 53.60, tenDay: 60.53 },
  { rank: 19, name: "G McCarley", office: "Destin", thirtyDay: 53.18, tenDay: 59.65 },
  { rank: 20, name: "C Fontenot", office: "New Orleans", thirtyDay: 53.03, tenDay: 51.11 },
  { rank: 21, name: "M Nichols", office: "Cape Girardeau", thirtyDay: 52.76, tenDay: 57.78 },
  { rank: 22, name: "B Butler", office: "Wilmington", thirtyDay: 52.57, tenDay: 60.34 },
  { rank: 23, name: "J Silva", office: "Atlanta", thirtyDay: 52.50, tenDay: 54.00 },
  { rank: 24, name: "D Earls", office: "Savannah", thirtyDay: 51.75, tenDay: 52.96 },
  { rank: 25, name: "D Sargent", office: "Jonesboro", thirtyDay: 51.52, tenDay: 50.00 },
  { rank: 26, name: "J Rhodes", office: "St. Louis", thirtyDay: 50.94, tenDay: 55.92 },
];

// ─── Location Ranking Report (table) ────────────────────────────────────────
export const LOCATION_RANKING: RankingRow[] = [
  { rank: 1, name: "Lake Charles", office: "Lake Charles", thirtyDay: 52.65, tenDay: 61.33 },
  { rank: 2, name: "San Antonio", office: "San Antonio", thirtyDay: 52.04, tenDay: 56.25 },
  { rank: 3, name: "Norfolk", office: "Norfolk", thirtyDay: 51.54, tenDay: 43.42 },
  { rank: 4, name: "Jonesboro", office: "Jonesboro", thirtyDay: 50.42, tenDay: 48.75 },
  { rank: 5, name: "Destin", office: "Destin", thirtyDay: 50.00, tenDay: 56.67 },
  { rank: 6, name: "Raleigh", office: "Raleigh", thirtyDay: 49.24, tenDay: 50.41 },
  { rank: 7, name: "Atlanta", office: "Atlanta", thirtyDay: 49.05, tenDay: 47.42 },
  { rank: 8, name: "Dallas", office: "Dallas", thirtyDay: 48.81, tenDay: 55.52 },
  { rank: 9, name: "Savannah", office: "Savannah", thirtyDay: 48.38, tenDay: 54.10 },
  { rank: 10, name: "Mobile", office: "Mobile", thirtyDay: 47.30, tenDay: 32.43 },
  { rank: 11, name: "Jacksonville", office: "Jacksonville", thirtyDay: 45.69, tenDay: 40.12 },
  { rank: 12, name: "Montgomery", office: "Montgomery", thirtyDay: 45.18, tenDay: 52.45 },
  { rank: 13, name: "Wilmington", office: "Wilmington", thirtyDay: 45.08, tenDay: 50.00 },
  { rank: 14, name: "Asheville", office: "Asheville", thirtyDay: 44.95, tenDay: 43.10 },
  { rank: 15, name: "Cape Girardeau", office: "Cape Girardeau", thirtyDay: 42.53, tenDay: 49.41 },
  { rank: 16, name: "St. Louis", office: "St. Louis", thirtyDay: 42.48, tenDay: 51.13 },
  { rank: 17, name: "Birmingham", office: "Birmingham", thirtyDay: 40.94, tenDay: 39.50 },
  { rank: 18, name: "Chattanooga", office: "Chattanooga", thirtyDay: 40.91, tenDay: 41.14 },
  { rank: 19, name: "Richmond", office: "Richmond", thirtyDay: 40.84, tenDay: 40.85 },
  { rank: 20, name: "New Orleans", office: "New Orleans", thirtyDay: 40.76, tenDay: 38.61 },
  { rank: 21, name: "Nashville", office: "Nashville", thirtyDay: 39.82, tenDay: 40.88 },
  { rank: 22, name: "Jackson, MS", office: "Jackson, MS", thirtyDay: 39.58, tenDay: 41.48 },
  { rank: 23, name: "Knoxville", office: "Knoxville", thirtyDay: 39.02, tenDay: 40.67 },
  { rank: 24, name: "Little Rock", office: "Little Rock", thirtyDay: 39.02, tenDay: 45.13 },
  { rank: 25, name: "Huntsville", office: "Huntsville", thirtyDay: 35.49, tenDay: 28.03 },
];

export const ALL_LOCATIONS_FILTER = [
  "ALL",
  ...Array.from(new Set(LOCATION_RANKING.map((r) => r.office))).sort(),
];
