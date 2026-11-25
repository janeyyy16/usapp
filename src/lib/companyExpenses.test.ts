import { describe, expect, it } from "vitest";
import { markAlreadySaved, normalizeBranch, normalizeCategory, parseExpenseSheet, parseSheetName, toISODate } from "./companyExpenses";

describe("company expenses import", () => {
  it("places the workbook's branches, typos included", () => {
    expect(normalizeBranch("")).toEqual({ branch: "Company", matched: true });
    expect(normalizeBranch("Memphis, TN")).toEqual({ branch: "Memphis, TN", matched: true });
    expect(normalizeBranch("Tallahasee, FL")).toEqual({ branch: "Tallahassee, FL", matched: true });
    expect(normalizeBranch("Nashvillle, TN")).toEqual({ branch: "Nashville, TN", matched: true });
    expect(normalizeBranch("Jackson, MS").branch).toBe("Jackson, MS");
    expect(normalizeBranch("Jackson, TN").branch).toBe("Jackson, TN");
    expect(normalizeBranch("North Carolina")).toEqual({ branch: "North Carolina", matched: true });
    expect(normalizeBranch("Check AHS")).toEqual({ branch: "Check AHS", matched: false });
    expect(normalizeBranch("Jackson, MS or Jackson, TN").matched).toBe(false);
  });

  it("merges category spellings", () => {
    expect(normalizeCategory("OPerating Expense")).toBe("Operating Expense");
    expect(normalizeCategory("Repairs & Maintenance")).toBe("Repair & Maintenance");
    expect(normalizeCategory("Something New")).toBe("Something New");
  });

  it("reads a sheet: header on row 3, spending made positive, credits negative", () => {
    const rows = parseExpenseSheet("101-1115 3510", [
      [],
      [],
      ["Amount", "Date", "Category", "Branch", "Memo"],
      [-14599.43, new Date(2026, 10, 13), "Payroll", "Birmingham, AL", "Birmingham Payroll"],
      [25.5, "2026-11-02", "Merchandise & Inventory", null, "Purchase Return Credit"],
      [null, null, null, null, null],
      [-9.95, null, "Bank Charge", null, "Bank Charge"],
    ])!;
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ account: "3510", period: "10/1 – 11/15", amount: 14599.43, expenseDate: "2026-11-13", branch: "Birmingham, AL", rowNumber: 4, problems: [] });
    expect(rows[1]).toMatchObject({ amount: -25.5, branch: "Company" });
    expect(rows[2].problems).toEqual(["No date"]);
    expect(parseExpenseSheet("x", [["a", "b"]])).toBeNull();
  });

  it("skips only as many identical lines as are already saved", () => {
    const line = { account: "A", expenseDate: "2026-11-10", amount: 127.98, category: "Professional Services", branch: "Company", memo: "Background Screening Expense" };
    const marked = markAlreadySaved([line, { ...line }], [line]);
    expect(marked.map((m) => m.alreadySaved)).toEqual([true, false]);
  });

  it("splits the sheet name into statement period and account", () => {
    expect(parseSheetName("101-1115 3510")).toEqual({ account: "3510", period: "10/1 – 11/15" });
    expect(parseSheetName("101-1115 0297")).toEqual({ account: "0297", period: "10/1 – 11/15" });
    expect(parseSheetName("915-1015 3127")).toEqual({ account: "3127", period: "9/15 – 10/15" });
    expect(parseSheetName("Sheet1")).toEqual({ account: "Sheet1", period: "" });
  });

  it("reads US dates", () => {
    expect(toISODate("11/2/2026")).toBe("2026-11-02");
  });
});
