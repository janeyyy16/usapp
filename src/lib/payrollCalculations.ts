/**
 * Pro-rata Payroll Calculation System
 * Handles mid-period salary changes with proper overtime calculations
 */

/**
 * Represents a salary rate effective at a specific date
 */
export interface SalaryEntry {
  id: string;
  effectiveDate: Date;
  hourlyRate: number;
  reason: 'promotion' | 'demotion' | 'adjustment' | 'initial';
  notes?: string;
}

/**
 * Salary history for an employee
 */
export interface SalaryHistory {
  employeeId: string;
  salaryEntries: SalaryEntry[];
}

/**
 * Represents a single pay period portion
 */
export interface PayrollPeriodPortion {
  periodName: string;
  startDate: Date;
  endDate: Date;
  hoursWorked: number;
  hourlyRate: number;
  regularPay: number;
  overtimePay?: number;
  totalPay: number;
}

/**
 * Complete payroll breakdown for a period with salary changes
 */
export interface SplitPayrollBreakdown {
  employeeId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  totalHoursWorked: number;
  portions: PayrollPeriodPortion[];
  totalRegularPay: number;
  totalOvertimePay: number;
  totalPay: number;
  salaryChangeOccurred: boolean;
}

/**
 * Constants for payroll calculations
 */
const OVERTIME_THRESHOLD = 40; // hours per week
const OVERTIME_MULTIPLIER = 1.5;

/**
 * Add a salary change to employee history
 */
export function addSalaryChange(
  history: SalaryHistory,
  effectiveDate: Date,
  hourlyRate: number,
  reason: SalaryEntry['reason'],
  notes?: string
): SalaryHistory {
  const newEntry: SalaryEntry = {
    id: `salary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    effectiveDate,
    hourlyRate,
    reason,
    notes,
  };

  return {
    ...history,
    salaryEntries: [...history.salaryEntries, newEntry].sort(
      (a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()
    ),
  };
}

/**
 * Get the effective hourly rate on a specific date
 */
export function getEffectiveRate(
  salaryHistory: SalaryHistory,
  date: Date
): number {
  const effectiveEntry = salaryHistory.salaryEntries
    .filter((entry) => entry.effectiveDate <= date)
    .pop();

  if (!effectiveEntry) {
    throw new Error(`No salary rate found for date ${date.toISOString()}`);
  }

  return effectiveEntry.hourlyRate;
}

/**
 * Find all salary changes within a pay period
 */
export function findSalaryChangesInPeriod(
  salaryHistory: SalaryHistory,
  periodStart: Date,
  periodEnd: Date
): SalaryEntry[] {
  return salaryHistory.salaryEntries.filter(
    (entry) =>
      entry.effectiveDate > periodStart && entry.effectiveDate <= periodEnd
  );
}

/**
 * Split a pay period into portions based on salary changes
 */
export function splitPayPeriod(
  salaryHistory: SalaryHistory,
  periodStart: Date,
  periodEnd: Date,
  totalHoursWorked: number
): PayrollPeriodPortion[] {
  const salaryChanges = findSalaryChangesInPeriod(
    salaryHistory,
    periodStart,
    periodEnd
  );

  if (salaryChanges.length === 0) {
    // No salary changes in period - simple case
    const rate = getEffectiveRate(salaryHistory, periodStart);
    return [
      {
        periodName: 'Full Period',
        startDate: periodStart,
        endDate: periodEnd,
        hoursWorked: totalHoursWorked,
        hourlyRate: rate,
        regularPay: calculateRegularPay(totalHoursWorked, rate),
        overtimePay: calculateOvertimePay(totalHoursWorked, rate),
        totalPay:
          calculateRegularPay(totalHoursWorked, rate) +
          calculateOvertimePay(totalHoursWorked, rate),
      },
    ];
  }

  // Distribute hours across portions, proportional to each portion's share
  // of calendar days in the period. periodEnd is itself a worked day, so the
  // total (and the final portion, which is the only one that actually ends
  // AT periodEnd) count it inclusively (+1); portions that end AT a salary
  // change's effective date stay exclusive of it, since that date's hours
  // belong to the portion AFTER the change, not before.
  const daysPeriod = getDayCount(periodStart, periodEnd) + 1;
  const boundaries: { startDate: Date; endDate: Date; rate: number; isLast: boolean }[] = [];

  const firstChange = salaryChanges[0];
  boundaries.push({
    startDate: periodStart,
    endDate: firstChange.effectiveDate,
    rate: getEffectiveRate(salaryHistory, periodStart),
    isLast: false,
  });

  let currentChangeIndex = 0;
  let currentChangeDate = firstChange.effectiveDate;
  let currentRate = firstChange.hourlyRate;

  while (currentChangeIndex < salaryChanges.length) {
    const nextChangeIndex = currentChangeIndex + 1;
    const isLast = nextChangeIndex >= salaryChanges.length;
    const nextChangeDate = isLast ? periodEnd : salaryChanges[nextChangeIndex].effectiveDate;

    boundaries.push({ startDate: currentChangeDate, endDate: nextChangeDate, rate: currentRate, isLast });

    if (!isLast) {
      currentRate = salaryChanges[nextChangeIndex].hourlyRate;
      currentChangeDate = nextChangeDate;
      currentChangeIndex = nextChangeIndex;
    } else {
      break;
    }
  }

  // Overtime is computed period-wide, not per portion — capping each
  // portion at the 40hr threshold independently would mean a split period
  // (where every individual portion is usually well under 40 hours) could
  // never actually trigger overtime, even when the total hours worked
  // across the whole period exceeds it. Any hours over the threshold are
  // paid as a premium on top, at the rate in effect for the most recent
  // (last) portion.
  const overtimeHours = Math.max(0, totalHoursWorked - OVERTIME_THRESHOLD);

  return boundaries.map((b) => {
    const days = getDayCount(b.startDate, b.endDate) + (b.isLast ? 1 : 0);
    const hoursWorked = (days / daysPeriod) * totalHoursWorked;
    const regularPay = Number((hoursWorked * b.rate).toFixed(2));
    const overtimePay = b.isLast && overtimeHours > 0
      ? Number((overtimeHours * b.rate * OVERTIME_MULTIPLIER).toFixed(2))
      : 0;

    return {
      periodName: b.startDate.getTime() === periodStart.getTime()
        ? `Before Promotion (${b.startDate.toLocaleDateString()} - ${b.endDate.toLocaleDateString()})`
        : `After Change (${b.startDate.toLocaleDateString()} - ${b.endDate.toLocaleDateString()})`,
      startDate: b.startDate,
      endDate: b.endDate,
      hoursWorked,
      hourlyRate: b.rate,
      regularPay,
      overtimePay,
      totalPay: regularPay + overtimePay,
    };
  });
}

/**
 * Calculate regular pay (non-overtime)
 */
export function calculateRegularPay(
  hoursWorked: number,
  hourlyRate: number
): number {
  const regularHours = Math.min(hoursWorked, OVERTIME_THRESHOLD);
  return Number((regularHours * hourlyRate).toFixed(2));
}

/**
 * Calculate overtime pay
 */
export function calculateOvertimePay(
  hoursWorked: number,
  hourlyRate: number
): number {
  if (hoursWorked <= OVERTIME_THRESHOLD) {
    return 0;
  }

  const overtimeHours = hoursWorked - OVERTIME_THRESHOLD;
  const overtimeRate = hourlyRate * OVERTIME_MULTIPLIER;
  return Number((overtimeHours * overtimeRate).toFixed(2));
}

/**
 * Get number of days between two dates (inclusive)
 */
export function getDayCount(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate complete split payroll for a period
 */
export function calculateSplitPayroll(
  employeeId: string,
  salaryHistory: SalaryHistory,
  periodStart: Date,
  periodEnd: Date,
  totalHoursWorked: number
): SplitPayrollBreakdown {
  const portions = splitPayPeriod(
    salaryHistory,
    periodStart,
    periodEnd,
    totalHoursWorked
  );

  const totalRegularPay = portions.reduce((sum, p) => sum + p.regularPay, 0);
  const totalOvertimePay = portions.reduce((sum, p) => sum + (p.overtimePay || 0), 0);
  const totalPay = portions.reduce((sum, p) => sum + p.totalPay, 0);

  const salaryChanges = findSalaryChangesInPeriod(
    salaryHistory,
    periodStart,
    periodEnd
  );

  return {
    employeeId,
    payPeriodStart: periodStart,
    payPeriodEnd: periodEnd,
    totalHoursWorked,
    portions,
    totalRegularPay,
    totalOvertimePay,
    totalPay,
    salaryChangeOccurred: salaryChanges.length > 0,
  };
}

/**
 * Create a new salary history for an employee
 */
export function createSalaryHistory(
  employeeId: string,
  initialRate: number,
  effectiveDate: Date
): SalaryHistory {
  return {
    employeeId,
    salaryEntries: [
      {
        id: `salary_initial_${employeeId}`,
        effectiveDate,
        hourlyRate: initialRate,
        reason: 'initial',
      },
    ],
  };
}
