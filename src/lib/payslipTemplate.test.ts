import { describe, expect, it, vi } from "vitest";
vi.mock("./supabase/client", () => ({ supabase: {} }));
import { renderPayslipBodyHtml, type EmployeePayslipData } from "./payslipTemplate";

const employee: EmployeePayslipData = {
  name: "Test Employee", department: "Admin", period: "2026-10-25 to 2026-11-07",
  generatedDate: "November 10, 2026", email: "test@example.com", hireDate: "2026-05-19",
  workingHoursLabel: "8:00 AM - 4:00 PM", breakLabel: "30 mins Break",
  compensationType: "fixed", annualSalary: 17000, hourlyRate: 0,
  dailyRows: [{ date: "2026-10-26", clockIn: "08:00:00", clockOut: "16:00:00", mealStart: "12:00:00", mealEnd: "12:30:00", hours: 7.5, rate: 0, amount: 0 }],
  counts: 1, totalHours: 7.5, average: 7.5, offDays: 4, ptoUsed: 0, sickLeave: 0,
  totalDays: 4, grossPay: 653.85, netPay: 653.85, extraPay: 0, notes: "", isUS: false,
};

describe("fixed-salary payslip attendance", () => {
  it("shows Brithney's mixed daily rates and amounts while retaining the correct saved total", () => {
    const times = [
      ["2026-10-26", "07:56:31", "13:00:41"], ["2026-10-27", "08:03:22", "13:00:25"],
      ["2026-10-28", "07:56:06", "13:00:08"], ["2026-10-29", "07:00:17", "12:02:51"],
      ["2026-10-30", "06:58:33", "12:01:04"], ["2026-11-02", "06:57:39", "12:00:45"],
      ["2026-11-03", "07:00:30", "12:01:40"], ["2026-11-04", "06:57:25", "12:02:46"],
      ["2026-11-05", "06:59:29", "12:00:59"], ["2026-11-06", "06:57:41", "12:01:11"],
    ];
    const seconds = (time: string) => time.split(":").reduce((sum, part) => sum * 60 + Number(part), 0);
    const dailyRows = times.map(([date, clockIn, clockOut]) => {
      const rate = date < "2026-11-01" ? 4 : 6;
      const hours = (seconds(clockOut) - seconds(clockIn)) / 3600;
      return { date, clockIn, clockOut, mealStart: "", mealEnd: "", hours, rate, amount: hours * rate };
    });
    expect(dailyRows.reduce((sum, row) => sum + row.amount, 0)).toBeCloseTo(252.15055556, 6);
    const html = renderPayslipBodyHtml({ ...employee, name: "Brithney Reyes", compensationType: "hourly", annualSalary: null,
      hourlyRate: 6, dailyRows, grossPay: 252.15, netPay: 252.15 });
    expect(html).toContain("Mixed: $4.00 / $6.00");
    const dailyTable = html.slice(html.indexOf("2026-10-26"), html.indexOf("</tbody>", html.indexOf("2026-10-26")));
    expect(dailyTable.match(/<td class="amount">\$4\.00<\/td>/g)).toHaveLength(5);
    expect(dailyTable.match(/<td class="amount">\$6\.00<\/td>/g)).toHaveLength(5);
    expect(dailyTable).toContain("$20.28");
    expect(dailyTable).toContain("$30.31");
    expect(html).toContain("$252.15");
    expect(html).not.toContain("$302.50");
  });
  it("shows attendance and duty hours without representing salary as zero hourly earnings", () => {
    const html = renderPayslipBodyHtml(employee);
    expect(html).toContain("2026-10-26");
    expect(html).toContain("7.500");
    expect(html).toContain("Fixed salary");
    expect(html).toContain("Fixed Salary Total");
    expect(html).toContain("$653.85");
    expect(html).not.toContain("No daily attendance recorded");
    expect(html).not.toContain('<td class="amount">$0.00</td>');
  });
  it("preserves hourly daily earnings", () => {
    const html = renderPayslipBodyHtml({ ...employee, compensationType: "hourly", annualSalary: null, hourlyRate: 6,
      dailyRows: [{ ...employee.dailyRows[0], rate: 6, amount: 45 }], grossPay: 45, netPay: 45 });
    expect(html).toContain('<td class="amount">$6.00</td>');
    expect(html).toContain('<td class="amount">$45.00</td>');
    expect(html).not.toContain("Fixed Salary Total");
  });
});
