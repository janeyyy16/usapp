import { describe, expect, it } from "vitest";
import { reviewedWeeklyBreakdown, type ReviewedWeeklySource } from "./reviewedWeeklyBreakdown";

const source = (): ReviewedWeeklySource => ({ days: [], items: [], commission: 0, bonus: 0, baseMileage: 0, baseMileagePay: 0, weeklyOt: [] });
describe("Reviewed weekly breakdown", () => {
  it("separates PTO from worked hours and preserves state and historical rate changes", () => {
    const s = source();
    s.days = [
      { date: "2026-10-26", regular: 8, overtime: 0, rate: 7.25, state: "Georgia", stateFloor: 7.25, ptoPay: 0 },
      { date: "2026-10-27", regular: 8, overtime: 2, rate: 8.25, state: "Florida", stateFloor: 15, ptoPay: 0 },
      { date: "2026-10-28", regular: 8, overtime: 0, paidLeave: true, rate: 8.25, state: "", stateFloor: null, ptoPay: 276.92 },
      { date: "2026-11-02", regular: 5, overtime: 0, rate: 8.25, state: "Florida", stateFloor: 15, ptoPay: 0 },
    ];
    const rows = reviewedWeeklyBreakdown(s, "2026-10-25", "2026-11-07");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ regular: 16, overtime: 2, ptoHours: 8, ptoPay: 276.92 });
    expect(rows[0].rates).toHaveLength(2);
    expect(rows[1]).toMatchObject({ regular: 5, overtime: 0 });
  });
  it("keeps zero-hour week commissions in their assigned week and exposes unallocated pay", () => {
    const s = source(); s.commission = 105; s.bonus = 30; s.baseMileage = 10; s.baseMileagePay = 2;
    s.items = [
      { label: "Week 1 Minor", value: 4, rate: 25, isWageIncludable: true, workWeekStart: "2026-10-25" },
      { label: "Week 2 Redo", value: 1, rate: -25, isWageIncludable: true, workWeekStart: "2026-11-01" },
      { label: "Week 2 LTP Bonus", value: 30, rate: 1, isWageIncludable: true, workWeekStart: "2026-11-01" },
      { label: "Week 2 Mileage Compensation", value: 100, rate: .2, isWageIncludable: false, workWeekStart: "2026-11-01" },
    ];
    const rows = reviewedWeeklyBreakdown(s, "2026-10-25", "2026-11-07");
    expect(rows[0].commission).toBe(100);
    expect(rows[1]).toMatchObject({ commission: -25, bonus: 30, mileage: 100, mileagePay: 20 });
    expect(rows[2]).toMatchObject({ weekStart: null, commission: 30, mileage: 10, mileagePay: 2 });
    expect(rows.reduce((sum, r) => sum + r.commission, 0)).toBe(105);
  });
  it("uses complete Sunday workweek keys for a partial cutoff", () => {
    expect(reviewedWeeklyBreakdown(source(), "2026-10-28", "2026-11-03").map((r) => r.weekStart))
      .toEqual(["2026-10-25", "2026-11-01"]);
  });
});
