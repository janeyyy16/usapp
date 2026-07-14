// Report data structures for Daily Reports
// This file contains mock/sample data structures for all daily reports

export const hrReportData: Record<string, any> = {
  "602": {
    us: {
      interviews: [
        { branch: "Houston HQ", scheduled: 5, staffNeed: "Technician", hired: 3 },
        { branch: "Dallas", scheduled: 3, staffNeed: "CSR", hired: 2 },
        { branch: "Austin", scheduled: 2, staffNeed: "Parts", hired: 1 },
      ],
      warnings: [
        { branch: "Houston HQ", timecardWarning: 2, employeeError: 1 },
        { branch: "Dallas", timecardWarning: 0, employeeError: 0 },
      ],
    },
    ph: {
      interviews: [
        { branch: "Operations", scheduled: 8, staffNeed: "CSR", hired: 5 },
        { branch: "Claims", scheduled: 4, staffNeed: "Claims Processor", hired: 2 },
      ],
      warnings: [
        { branch: "Operations", timecardWarning: 1, employeeError: 0 },
      ],
    },
  },
};

export const csrReportData: Record<string, any> = {
  "602": {
    agents: [
      {
        team: "TEAM DANIELA",
        name: "John Doe",
        startDate: "01/15/26",
        task: "In",
        gh: 45,
        total: 45,
        schedule: 38,
        attempt: 32,
        update: 5,
        mistake: null,
        warning: 0,
      },
    ],
  },
};

// Claims/Triage/Part Daily Report now come from live data (see
// ReportClaimsDaily.tsx, ReportTriageDaily.tsx, ReportPartsDaily.tsx) — the
// mock claimsReportData/triageReportData/partsReportData structures that
// used to live here have been removed.

// Operations Daily Report's Overview tab now comes from real BizOps
// Manager/Senior Manager profiles + the live Warnings/Mistakes notes
// workflow (see ReportOperationsDaily.tsx) — the mock operationsReportData/
// opsReportData structures that used to live here have been removed.

// Eastern/Western/Central TX branch data now comes from live tickets via
// src/lib/operationsBranchMetrics.ts (see ReportBranchBase.tsx) — the mock
// eastReportData/westReportData/centralReportData structures that used to
// live here (fictional cities like "Houston HQ", "El Paso", "Waco") have
// been removed.
