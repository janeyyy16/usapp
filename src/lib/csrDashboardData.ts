/**
 * CSR DASHBOARD — rich placeholder/dummy data (offline demo).
 * Teams, agents, daily activity, and mistakes. Not synced to real data.
 */

export interface CsrAgent {
  name: string;
  team: string;
  position: string;
  startDate: string;
  schedule: number;
  attempt: number;
  update: number;
  warning: number;
  locations: string[];
  mistake: string | null;
}

export const CSR_TEAMS = ["TEAM DANIELA", "TEAM ROBYN", "TEAM ROCHELLE", "TEAM SHANE"];

export const CSR_TEAM_COLORS: Record<string, string> = {
  "TEAM DANIELA": "#3b82f6",
  "TEAM ROBYN": "#34d399",
  "TEAM ROCHELLE": "#a78bfa",
  "TEAM SHANE": "#fb923c",
};

// 24 fake agents across 4 teams
export const CSR_AGENTS: CsrAgent[] = [
  { name: "Alona Jane Bautista",    team: "TEAM DANIELA",  position: "CSR Agent",       startDate: "01/15/26", schedule: 38, attempt: 32, update: 5, warning: 0, locations: ["Atlanta", "Savannah"],                    mistake: null },
  { name: "Robyn Heredia",          team: "TEAM ROBYN",    position: "CSR Team Leader", startDate: "01/15/26", schedule: 41, attempt: 28, update: 7, warning: 1, locations: ["Memphis", "Jackson, MS", "Little Rock"],  mistake: "Not checking the related ticket" },
  { name: "Jerwin Pineda",          team: "TEAM ROBYN",    position: "CSR Agent",       startDate: "02/03/26", schedule: 35, attempt: 30, update: 4, warning: 0, locations: ["Nashville", "Chattanooga"],                mistake: "Forgot to add the technician name" },
  { name: "Francis John Rebosura",  team: "TEAM ROCHELLE", position: "CSR Agent",       startDate: "11/20/25", schedule: 29, attempt: 25, update: 6, warning: 1, locations: ["New Orleans", "Mobile"],                  mistake: "Forgot to check warranty type, unit should be OOW" },
  { name: "Shiela Marie Estrellado",team: "TEAM SHANE",    position: "CSR Agent",       startDate: "03/12/26", schedule: 33, attempt: 27, update: 3, warning: 0, locations: ["Birmingham"],                              mistake: "Incorrect information provided" },
  { name: "Mary Rose Labuanan",     team: "TEAM DANIELA",  position: "CSR Agent",       startDate: "08/05/25", schedule: 30, attempt: 22, update: 5, warning: 0, locations: ["Dallas", "San Antonio"],                  mistake: "Forgot to update the status on warranty" },
  { name: "Jeryan Luzano",          team: "TEAM ROCHELLE", position: "Senior CSR",      startDate: "04/18/26", schedule: 44, attempt: 35, update: 8, warning: 2, locations: ["Raleigh", "Norfolk", "Wilmington"],        mistake: "Not closing the ticket on the 3rd attempt" },
  { name: "Geneva Calomarde",       team: "TEAM SHANE",    position: "CSR Agent",       startDate: "12/01/25", schedule: 27, attempt: 20, update: 2, warning: 0, locations: ["Knoxville", "Asheville"],                 mistake: null },
  { name: "Krista Griffiss",        team: "TEAM DANIELA",  position: "Senior CSR",      startDate: "06/22/26", schedule: 39, attempt: 31, update: 6, warning: 0, locations: ["Atlanta", "Columbus"],                    mistake: null },
  { name: "Job Christian Alberto",  team: "TEAM ROBYN",    position: "CSR Agent",       startDate: "09/14/25", schedule: 36, attempt: 29, update: 5, warning: 0, locations: ["Jacksonville", "Tallahassee"],             mistake: null },
  { name: "Nicole Noval",           team: "TEAM ROCHELLE", position: "CSR Agent",       startDate: "02/28/26", schedule: 31, attempt: 24, update: 4, warning: 1, locations: ["Richmond", "Norfolk"],                    mistake: null },
  { name: "Alex Rayos",             team: "TEAM SHANE",    position: "CSR Agent",       startDate: "07/19/25", schedule: 28, attempt: 21, update: 3, warning: 0, locations: ["Louisville"],                              mistake: null },
  { name: "Jenny Mahawan",          team: "TEAM DANIELA",  position: "CSR Agent",       startDate: "05/30/26", schedule: 42, attempt: 33, update: 7, warning: 0, locations: ["Jackson, TN", "Memphis"],                 mistake: null },
  { name: "Colleen Tac-on",         team: "TEAM ROBYN",    position: "CSR Agent",       startDate: "10/11/25", schedule: 34, attempt: 26, update: 5, warning: 0, locations: ["St. Louis", "Cape Girardeau"],            mistake: null },
  { name: "Donna Oliveros",         team: "TEAM ROCHELLE", position: "CSR Agent",       startDate: "01/08/26", schedule: 37, attempt: 28, update: 6, warning: 0, locations: ["Raleigh", "Wilmington"],                  mistake: null },
  { name: "Ken Ubay",               team: "TEAM SHANE",    position: "CSR Agent",       startDate: "03/25/26", schedule: 25, attempt: 19, update: 2, warning: 0, locations: ["Huntsville"],                              mistake: null },
  { name: "Rochelle Ortiz",         team: "TEAM ROCHELLE", position: "CSR Team Leader", startDate: "08/16/25", schedule: 40, attempt: 30, update: 7, warning: 0, locations: ["Norfolk", "Richmond", "Raleigh"],         mistake: null },
  { name: "Martin Gales",           team: "TEAM DANIELA",  position: "CSR Agent",       startDate: "04/02/26", schedule: 32, attempt: 23, update: 4, warning: 0, locations: ["Dallas"],                                  mistake: null },
  { name: "Daniela Mercado",        team: "TEAM DANIELA",  position: "CSR Team Leader", startDate: "11/05/25", schedule: 45, attempt: 38, update: 9, warning: 0, locations: ["Atlanta", "Birmingham", "Montgomery"],    mistake: null },
  { name: "Shane Henry",            team: "TEAM SHANE",    position: "CSR Team Leader", startDate: "06/15/25", schedule: 43, attempt: 34, update: 8, warning: 0, locations: ["Nashville", "Knoxville", "Chattanooga"],  mistake: null },
  { name: "Cheska Timkang",         team: "TEAM ROBYN",    position: "CSR Agent",       startDate: "02/14/26", schedule: 26, attempt: 18, update: 3, warning: 0, locations: ["Little Rock", "Jonesboro"],               mistake: null },
  { name: "Richelle Labajo",        team: "TEAM ROCHELLE", position: "CSR Agent",       startDate: "09/27/25", schedule: 38, attempt: 29, update: 5, warning: 0, locations: ["Wilmington", "Raleigh"],                  mistake: null },
  { name: "Nicko Muega",            team: "TEAM SHANE",    position: "CSR Agent",       startDate: "05/06/26", schedule: 30, attempt: 22, update: 4, warning: 0, locations: ["Destin", "Mobile"],                       mistake: null },
  { name: "Daven Hodge",            team: "TEAM DANIELA",  position: "Senior CSR",      startDate: "12/19/25", schedule: 35, attempt: 27, update: 5, warning: 0, locations: ["Lake Charles", "New Orleans"],            mistake: null },
];

// Mistakes log (fake) — matches the spreadsheet layout: Name, Mistake, Date, Reason, Action Taken
export interface CsrMistake {
  name: string;
  mistakes: number;
  date: string;
  reason: string;
  actionTaken: string;
}

export const CSR_MISTAKES: CsrMistake[] = [
  { name: "Robyn Heredia", mistakes: 1, date: "4/29", reason: "Not checking the related ticket, due", actionTaken: "Already ordered the parts" },
  { name: "Jerwin Pineda", mistakes: 2, date: "4/30", reason: "Forgot to add the technician name on the ticket", actionTaken: "Already changed and updated" },
  { name: "Francis John Rebosura", mistakes: 2, date: "05/05", reason: "Forgot to check the warranty type, unit should be OOW", actionTaken: "As per checking due to its related ticket, no need to" },
  { name: "Shiela Marie Estrellado", mistakes: 1, date: "05/05", reason: "Incorrect information provided, part is not needed", actionTaken: "Already advised the cx to" },
  { name: "Mary Rose Labuanan", mistakes: 1, date: "05/06", reason: "Forgot to update the status on warranty", actionTaken: "Ticket already updated" },
  { name: "Jeryan Luzano", mistakes: 2, date: "05/06", reason: "Forgot to update the status on warranty", actionTaken: "Ticket already updated" },
  { name: "Jeryan Luzano", mistakes: 1, date: "05/11", reason: "Not closing the ticket on the 3rd attempt", actionTaken: "Ticket already updated" },
];

// 10-day trend (fake) — schedule + mistakes per day
export const CSR_TREND_10 = [
  { date: "5/24/26", schedule: 320, attempt: 240, mistakes: 2 },
  { date: "5/25/26", schedule: 298, attempt: 225, mistakes: 1 },
  { date: "5/26/26", schedule: 312, attempt: 250, mistakes: 0 },
  { date: "5/27/26", schedule: 305, attempt: 238, mistakes: 1 },
  { date: "5/28/26", schedule: 330, attempt: 260, mistakes: 0 },
  { date: "5/29/26", schedule: 318, attempt: 245, mistakes: 2 },
  { date: "5/30/26", schedule: 295, attempt: 220, mistakes: 1 },
  { date: "5/31/26", schedule: 308, attempt: 235, mistakes: 0 },
  { date: "6/01/26", schedule: 325, attempt: 255, mistakes: 1 },
  { date: "6/02/26", schedule: 340, attempt: 268, mistakes: 0 },
];
