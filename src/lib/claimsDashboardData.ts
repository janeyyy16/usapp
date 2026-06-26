/**
 * Claims dashboard data — derived from the operational Claims Daily Reports.
 * Local/hardcoded for the demo; swap for an API feed when the backend is ready.
 */

export interface ClaimsDaySnapshot {
  date: string;            // e.g. "6/22/26"
  completed: number;
  remaining: number;
}

export interface ClaimsStaffRow {
  name: string;
  startDate: string;
  hours: number;
  completed: number;
  brandsCovered: string;
  warnings: number;
  remarks: string;
}

// Daily completed vs remaining (last ~14 working days), modeled on the report.
export const CLAIMS_DAILY: ClaimsDaySnapshot[] = [
  { date: "5/27/26", completed: 198, remaining: 58 },
  { date: "5/28/26", completed: 212, remaining: 61 },
  { date: "5/29/26", completed: 187, remaining: 53 },
  { date: "6/1/26",  completed: 205, remaining: 49 },
  { date: "6/2/26",  completed: 245, remaining: 64 },
  { date: "6/3/26",  completed: 223, remaining: 62 },
  { date: "6/4/26",  completed: 257, remaining: 64 },
  { date: "6/8/26",  completed: 241, remaining: 55 },
  { date: "6/9/26",  completed: 233, remaining: 51 },
  { date: "6/10/26", completed: 219, remaining: 47 },
  { date: "6/11/26", completed: 264, remaining: 60 },
  { date: "6/12/26", completed: 248, remaining: 58 },
  { date: "6/17/26", completed: 277, remaining: 66 },
  { date: "6/22/26", completed: 245, remaining: 64 },
];

// Brand breakdown (latest day) — from the "Brand / Count" table in the report.
export const CLAIMS_BY_BRAND: { brand: string; count: number }[] = [
  { brand: "GE",          count: 69 },
  { brand: "Electrolux",  count: 54 },
  { brand: "Assurant",    count: 51 },
  { brand: "SQT",         count: 26 },
  { brand: "Centricity",  count: 15 },
  { brand: "AIG",         count: 5 },
  { brand: "Midea",       count: 5 },
  { brand: "NSA",         count: 5 },
  { brand: "Builder",     count: 4 },
  { brand: "Internal",    count: 3 },
  { brand: "SPQ",         count: 3 },
  { brand: "OOW",         count: 2 },
  { brand: "Hisense",     count: 1 },
  { brand: "Asurion",     count: 1 },
  { brand: "SPPN",        count: 1 },
];

// Remaining/pending categories — from the "Remaining / Count" table.
export const CLAIMS_PENDING: { category: string; count: number }[] = [
  { category: "Pre-Authorization", count: 34 },
  { category: "Tech Update",       count: 17 },
  { category: "Follow-up Needed",  count: 7 },
  { category: "Parts Issue",       count: 4 },
  { category: "Moved After Shift", count: 2 },
];

// Pre-authorization aging buckets — from the "PRE-AUTHORIZATION / DAYS" table.
export const CLAIMS_PREAUTH_AGING: { bucket: string; count: number }[] = [
  { bucket: "0-1 Day",  count: 28 },
  { bucket: "2-3 Days", count: 13 },
  { bucket: "4+ Days",  count: 9 },
];

// Staff performance — from the staff table (latest day).
export const CLAIMS_STAFF: ClaimsStaffRow[] = [
  { name: "Arnulfo Jr Montesclaros", startDate: "01/13/25", hours: 7, completed: 50, brandsCovered: "GE, Electrolux, Builder", warnings: 0, remarks: "All TKs handled" },
  { name: "Marie Frances Javier",    startDate: "03/18/25", hours: 7, completed: 54, brandsCovered: "GE, Electrolux, ER", warnings: 0, remarks: "All TKs handled" },
  { name: "Ken Ubay",                startDate: "06/30/25", hours: 7, completed: 13, brandsCovered: "Pre-Auth, Midea", warnings: 0, remarks: "Part-time claim" },
  { name: "Nicole Noval",            startDate: "02/19/26", hours: 7, completed: 31, brandsCovered: "Square Trade, AIG, Hisense", warnings: 0, remarks: "Conducted training" },
  { name: "Alexy Rayos",             startDate: "03/24/26", hours: 7, completed: 47, brandsCovered: "Assurant, GE", warnings: 0, remarks: "All TKs handled" },
  { name: "Jenny Mahawan",           startDate: "03/11/26", hours: 7, completed: 42, brandsCovered: "Assurant, GE", warnings: 0, remarks: "All TKs handled" },
  { name: "Moniecris Dumanao",       startDate: "04/22/26", hours: 4, completed: 12, brandsCovered: "Square Trade, AIG, Hisense", warnings: 0, remarks: "New hire" },
  { name: "Ian Montesclaros",        startDate: "07/19/24", hours: 7, completed: 8,  brandsCovered: "OW, Internal, Miele, Fidelity", warnings: 0, remarks: "Lead manager" },
];

// Data-closed report (Electrolux focus) — from the "DATA-CLOSED" column.
export const CLAIMS_DATA_CLOSED = {
  handled: 112,
  moved: 76,
};

// Latest headline numbers.
export const CLAIMS_SUMMARY = {
  completedToday: 245,
  remaining: 64,
  staffActive: 8,
  inTraining: 1,
  preAuthPending: 40,
  dataClosedHandled: 112,
};
