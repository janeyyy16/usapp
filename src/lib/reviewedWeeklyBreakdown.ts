import { isBonusPayLine } from "./payRounding";

export interface ReviewedWeeklySource {
  days: { date: string; regular: number; overtime: number; paidLeave?: boolean; rate: number; state: string; stateFloor: number | null; ptoPay: number }[];
  items: { label: string; value: number; rate: number; isWageIncludable: boolean; workWeekStart: string | null }[];
  commission: number;
  bonus: number;
  baseMileage: number;
  baseMileagePay: number;
  weeklyOt: { weekStart: string; regularRate: number; premium: number }[];
}

export interface ReviewedWeeklyRow {
  weekStart: string | null;
  regular: number; overtime: number; ptoHours: number; ptoPay: number;
  commission: number; bonus: number; mileage: number; mileagePay: number;
  regularRate: number | null; otPremium: number;
  rates: { state: string; rate: number; stateFloor: number | null; regular: number; overtime: number }[];
}

const weekOf = (iso: string) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
};

/** Report only: keep amounts without a workweek separate instead of guessing a weekly split. */
export function reviewedWeeklyBreakdown(source: ReviewedWeeklySource, start: string, end: string): ReviewedWeeklyRow[] {
  const weeks = new Map<string, ReviewedWeeklyRow>();
  const get = (weekStart: string | null) => {
    const key = weekStart ?? "unallocated";
    let row = weeks.get(key);
    if (!row) {
      row = { weekStart, regular: 0, overtime: 0, ptoHours: 0, ptoPay: 0, commission: 0, bonus: 0,
        mileage: 0, mileagePay: 0, regularRate: null, otPremium: 0, rates: [] };
      weeks.set(key, row);
    }
    return row;
  };
  for (let day = new Date(`${start}T00:00:00Z`); day.toISOString().slice(0, 10) <= end; day.setUTCDate(day.getUTCDate() + 7)) {
    get(weekOf(day.toISOString().slice(0, 10)));
  }
  get(weekOf(end));
  for (const day of source.days) {
    if (day.date < start || day.date > end) continue;
    const row = get(weekOf(day.date));
    if (day.paidLeave) {
      row.ptoHours += day.regular + day.overtime;
      row.ptoPay += day.ptoPay;
      continue;
    }
    row.regular += day.regular;
    row.overtime += day.overtime;
    if (day.regular + day.overtime <= 0) continue;
    let rate = row.rates.find((r) => r.state === day.state && r.rate === day.rate && r.stateFloor === day.stateFloor);
    if (!rate) {
      rate = { state: day.state, rate: day.rate, stateFloor: day.stateFloor, regular: 0, overtime: 0 };
      row.rates.push(rate);
    }
    rate.regular += day.regular;
    rate.overtime += day.overtime;
  }
  let taggedCommission = 0, taggedBonus = 0;
  for (const item of source.items) {
    const amount = item.value * item.rate;
    if (!amount) continue;
    if (item.isWageIncludable) {
      const group = isBonusPayLine(item.label) ? "bonus" : "commission";
      if (item.workWeekStart) {
        get(item.workWeekStart)[group] += amount;
        if (group === "bonus") taggedBonus += amount;
        else taggedCommission += amount;
      }
    } else if (/mileage/i.test(item.label) && amount > 0) {
      const row = get(item.workWeekStart);
      row.mileage += item.value;
      row.mileagePay += amount;
    }
  }
  const commissionRemainder = source.commission - taggedCommission;
  const bonusRemainder = source.bonus - taggedBonus;
  if (Math.abs(commissionRemainder) > .000001 || Math.abs(bonusRemainder) > .000001 || source.baseMileage || source.baseMileagePay) {
    const row = get(null);
    row.commission += commissionRemainder;
    row.bonus += bonusRemainder;
    row.mileage += source.baseMileage;
    row.mileagePay += source.baseMileagePay;
  }
  for (const ot of source.weeklyOt) {
    const row = get(ot.weekStart);
    row.regularRate = ot.regularRate;
    row.otPremium = ot.premium;
  }
  return [...weeks.values()].sort((a, b) => (a.weekStart ?? "z").localeCompare(b.weekStart ?? "z"));
}
