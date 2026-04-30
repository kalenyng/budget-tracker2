// Yearly decision-dashboard metrics
// All calculations for the "Am I on track?" summary cards.

export type SpendStatus = 'on-track' | 'slightly-over' | 'overspending' | 'no-data';

export interface YearlyMetrics {
  totalBudget: number;
  actualSpend: number;
  monthsElapsed: number;

  // Computed values
  remaining: number;          // totalBudget - actualSpend
  progress: number;           // monthsElapsed / 12  (0..1)
  expectedSpend: number;      // totalBudget * progress
  spendDiff: number;          // actualSpend - expectedSpend  (positive = over)
  burnRate: number;           // actualSpend / monthsElapsed
  projectedTotal: number;     // burnRate * 12
  projectedDiff: number;      // projectedTotal - totalBudget (positive = over)

  // Status
  status: SpendStatus;
  statusLabel: string;

  hasData: boolean;
}

export interface YearlyMetricsInput {
  totalBudget: number;
  actualSpend: number;
  /** How many FY months have at least started (1 = April, …, 12 = March) */
  monthsElapsed: number;
}

export function getYearlyMetrics(input: YearlyMetricsInput): YearlyMetrics {
  const { totalBudget, actualSpend, monthsElapsed } = input;

  const hasData = actualSpend > 0;

  const empty = (status: SpendStatus): YearlyMetrics => ({
    totalBudget,
    actualSpend,
    monthsElapsed,
    remaining: totalBudget,
    progress: 0,
    expectedSpend: 0,
    spendDiff: 0,
    burnRate: 0,
    projectedTotal: 0,
    projectedDiff: 0,
    status,
    statusLabel: status === 'no-data' ? 'No data yet' : 'No budget set',
    hasData: false,
  });

  if (!hasData) return empty('no-data');
  if (monthsElapsed === 0) return empty('no-data');
  if (totalBudget === 0) return empty('no-data');

  const progress = monthsElapsed / 12;
  const expectedSpend = totalBudget * progress;
  const spendDiff = actualSpend - expectedSpend;
  const remaining = totalBudget - actualSpend;
  const burnRate = actualSpend / monthsElapsed;
  const projectedTotal = burnRate * 12;
  const projectedDiff = projectedTotal - totalBudget;

  // Thresholds relative to total budget:
  //   ≤ 2%  over expected  → On Track
  //   ≤ 8%  over expected  → Slightly Over
  //   > 8%  over expected  → Overspending
  const overRatio = spendDiff / totalBudget;

  let status: SpendStatus;
  let statusLabel: string;

  if (overRatio <= 0.02) {
    status = 'on-track';
    statusLabel = 'On Track';
  } else if (overRatio <= 0.08) {
    status = 'slightly-over';
    statusLabel = 'Slightly Over';
  } else {
    status = 'overspending';
    statusLabel = 'Overspending';
  }

  return {
    totalBudget,
    actualSpend,
    monthsElapsed,
    remaining,
    progress,
    expectedSpend,
    spendDiff,
    burnRate,
    projectedTotal,
    projectedDiff,
    status,
    statusLabel,
    hasData: true,
  };
}

/**
 * Returns the number of FY months that have at least started, given the
 * FY start year (April year) and the current date.
 *
 * April = 1 … March = 12
 */
export function getMonthsElapsed(fyStartYear: number, now = new Date()): number {
  const fyStart = new Date(fyStartYear, 3, 1);        // 1 Apr
  const fyEnd   = new Date(fyStartYear + 1, 3, 1);   // 1 Apr next year

  if (now < fyStart) return 0;
  if (now >= fyEnd) return 12;

  // FY month index: April of fyStartYear = 0, …, March of fyStartYear+1 = 11
  let fyMonthIdx: number;
  if (now.getFullYear() === fyStartYear) {
    fyMonthIdx = now.getMonth() - 3; // Apr=0, May=1, … Dec=8
  } else {
    fyMonthIdx = now.getMonth() + 9; // Jan=9, Feb=10, Mar=11
  }

  return fyMonthIdx + 1; // include the current (partial) month
}
