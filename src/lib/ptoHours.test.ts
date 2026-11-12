import { beforeEach, describe, expect, it, vi } from "vitest";
import { capPtoHours } from "./ptoHours";

const query = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));
vi.mock("./supabase/client", () => ({ supabase: { from: () => {
  const builder = { select: () => builder, eq: () => builder, gte: () => builder, lte: () => builder,
    order: async () => ({ data: query.rows, error: null }) };
  return builder;
} } }));
vi.mock("./supabase/restDayHistory", () => ({ getRestDayHistoryFor: async () => [] }));
import { getAttendanceForRange, resolveScheduledNetHours } from "./supabase/timecards";

describe("PTO daily hour cap", () => {
  beforeEach(() => { query.rows = []; });
  it.each([[8.5, 8], [10, 8], [8, 8], [7.5, 7.5], [4, 4], [0, 0], [-1, 0], [NaN, 0]])(
    "credits scheduled hours %s as %s PTO hours", (scheduled, expected) => {
      expect(capPtoHours(scheduled)).toBe(expected);
    },
  );
  it("keeps the schedule override net and caps leave without changing duty hours", () => {
    const net = resolveScheduledNetHours("08:00", "17:00", 8.5, 30);
    expect(net).toBe(8.5);
    expect(capPtoHours(net)).toBe(8);
    expect(capPtoHours(resolveScheduledNetHours("08:00", "14:00", 5.5, 30))).toBe(5.5);
    expect(capPtoHours(resolveScheduledNetHours("08:00", "17:00", null, 30))).toBe(8);
  });
  it.each([false, true])("caps an approved PTO day with an empty timecard row=%s", async (hasRow) => {
    if (hasRow) query.rows = [{ work_date: "2020-11-04", check_in: null, check_out: null }];
    const rows = await getAttendanceForRange("employee", "2020-11-04", "2020-11-04", {
      workingHours: 8.5, mealMinutes: 30, paidLeaveDates: new Map([["2020-11-04", "vacation"]]),
    });
    expect(rows[0]).toMatchObject({ status: "paid-leave", hoursWorked: 8 });
  });
  it("respects a shorter PTO schedule and keeps unpaid leave at zero", async () => {
    const rows = await getAttendanceForRange("employee", "2020-11-04", "2020-11-05", {
      workingHours: 6, paidLeaveDates: new Map([["2020-11-04", "vacation"], ["2020-11-05", "vacation"]]),
      unpaidLeaveDates: new Map([["2020-11-05", "unpaid"]]),
    });
    expect(rows[0]).toMatchObject({ status: "paid-leave", hoursWorked: 6 });
    expect(rows[1]).toMatchObject({ status: "unpaid-leave", hoursWorked: 0 });
  });
  it("does not cap actual worked hours when PTO overlaps a punched day", async () => {
    query.rows = [{ work_date: "2020-11-04", check_in: "08:00", check_out: "18:00" }];
    const rows = await getAttendanceForRange("employee", "2020-11-04", "2020-11-04", {
      workingHours: 8.5, paidLeaveDates: new Map([["2020-11-04", "vacation"]]),
    });
    expect(rows[0].status).not.toBe("paid-leave");
    expect(rows[0].hoursWorked).toBe(10);
  });
});
