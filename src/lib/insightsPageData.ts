/**
 * Aggregates budgets, transactions, and FY rolls for the /insights page.
 * All primary KPIs and the pace chart are anchored to the financial year (Apr–Mar).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CurrencyCode } from './currency';
import { formatCurrency } from './currency';
import { getInsights } from './insights';
import { getMonthsElapsed, getYearlyMetrics, type SpendStatus } from './yearlyMetrics';

/** Maps to status bar colours (same thresholds as yearly overview). */
export type InsightsFyPaceVisual = 'ok' | 'warn' | 'bad' | 'neutral';

export interface CumulativeBurnPoint {
  /** 1-based day index from 1 Apr (start of FY). */
  dayOfFy: number;
  actual: number | null;
  expected: number;
}

export interface CategoryBarRow {
  id: string;
  name: string;
  spent: number;
  budget: number;
  barTone: 'green' | 'yellow' | 'red';
}

export interface MomRow {
  id: string;
  name: string;
  thisMonth: number;
  lastMonth: number;
}

export interface InsightFeedItem {
  type: 'critical' | 'warning' | 'good' | 'info';
  message: string;
}

export interface AnnualCategorySeries {
  categoryId: string;
  name: string;
  labels: string[];
  values: number[];
  trendingUp: boolean;
}

export interface InsightsPagePayload {
  currency: CurrencyCode;
  fyLabel: string;
  fyPaceVisual: InsightsFyPaceVisual;
  fyStatusLabel: string;
  fyStatusDetail: string;
  monthsElapsed: number;
  fyDaysElapsed: number;
  fyDaysTotal: number;
  yearBudget: number;
  yearActual: number;
  expectedSpendFyToDate: number;
  spendDiffFy: number;
  remainingFyBudget: number;
  fyAvgMonthlySpend: number;
  projectedYearTotal: number;
  projectedVsAnnualBudget: number;
  actualVsExpectedPct: number | null;
  biggestCategoryFy: { name: string; spent: number } | null;
  cumulativeFyBurn: CumulativeBurnPoint[];
  categoryBars: CategoryBarRow[];
  momBars: MomRow[];
  momLabelA: string;
  momLabelB: string;
  insightFeed: InsightFeedItem[];
  annualSeries: AnnualCategorySeries[];
  hasAnnualData: boolean;
}

function fyStartYear(d: Date): number {
  return d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
}

function buildFyMonths(year: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < 9; i++) {
    const monthIndex = 3 + i;
    months.push(`${year}-${String(monthIndex + 1).padStart(2, '0')}-01`);
  }
  for (let i = 0; i < 3; i++) {
    months.push(`${year + 1}-${String(i + 1).padStart(2, '0')}-01`);
  }
  return months;
}

function shortMonthLabel(isoMonth: string): string {
  const d = new Date(isoMonth.slice(0, 10));
  return d.toLocaleString('default', { month: 'short' });
}

function spendStatusToVisual(status: SpendStatus): InsightsFyPaceVisual {
  if (status === 'no-data') return 'neutral';
  if (status === 'on-track') return 'ok';
  if (status === 'slightly-over') return 'warn';
  return 'bad';
}

/** 1-based day of FY for a calendar date (local), or null if outside FY. */
function dayOfFinancialYear(fyYear: number, dateStr: string): number | null {
  const parts = dateStr.slice(0, 10).split('-');
  const y = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10) - 1;
  const d = parseInt(parts[2] || '0', 10);
  if (!y || m < 0 || m > 11 || d < 1) return null;
  const dt = new Date(y, m, d);
  const fy0 = new Date(fyYear, 3, 1);
  const fyEnd = new Date(fyYear + 1, 3, 1);
  if (dt < fy0 || dt >= fyEnd) return null;
  const idx = Math.floor((dt.getTime() - fy0.getTime()) / 86400000) + 1;
  return idx >= 1 ? idx : null;
}

export async function loadInsightsPageData(
  supabase: SupabaseClient,
  userId: string,
  currency: CurrencyCode,
): Promise<InsightsPagePayload | null> {
  const now = new Date();
  const fyYear = fyStartYear(now);
  const fyMonths = buildFyMonths(fyYear);
  const fyLabel = `FY ${fyYear}/${String(fyYear + 1).slice(2)}`;

  const fyStart = new Date(fyYear, 3, 1);
  const fyEndExclusive = new Date(fyYear + 1, 3, 1);
  const fyDaysTotal = Math.max(
    1,
    Math.round((fyEndExclusive.getTime() - fyStart.getTime()) / 86400000),
  );
  const fyDaysElapsed = Math.min(
    fyDaysTotal,
    Math.max(1, Math.floor((now.getTime() - fyStart.getTime()) / 86400000) + 1),
  );

  const [{ data: categories, error: catErr }, { data: budgetsFy }, { data: txFy }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, monthly_amount, sort_order, type')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true }),
    supabase
      .from('budgets')
      .select('month, category_id, budget_amount, actual_amount')
      .eq('user_id', userId)
      .in('month', fyMonths),
    supabase
      .from('transactions')
      .select('date, amount, category_id, month')
      .eq('user_id', userId)
      .in('month', fyMonths),
  ]);

  if (catErr || !categories?.length) {
    return null;
  }

  const categoryMonthlyActuals: Record<string, Record<string, number>> = {};
  let yearActual = 0;
  const totalActualByMonth: Record<string, number> = {};

  for (const b of budgetsFy || []) {
    yearActual += parseFloat(String(b.actual_amount || 0));
    const cid = b.category_id as string | null;
    const m = b.month as string;
    totalActualByMonth[m] = (totalActualByMonth[m] || 0) + parseFloat(String(b.actual_amount || 0));
    if (!cid) continue;
    if (!categoryMonthlyActuals[cid]) categoryMonthlyActuals[cid] = {};
    categoryMonthlyActuals[cid][m] =
      (categoryMonthlyActuals[cid][m] || 0) + parseFloat(String(b.actual_amount || 0));
  }

  const yearBudget = categories.reduce(
    (s, c) => s + parseFloat(String(c.monthly_amount || 0)) * 12,
    0,
  );

  const catYearActual: Record<string, number> = {};
  for (const cid of Object.keys(categoryMonthlyActuals)) {
    catYearActual[cid] = Object.values(categoryMonthlyActuals[cid]).reduce((a, v) => a + v, 0);
  }

  const monthsElapsed = getMonthsElapsed(fyYear, now);
  const metrics = getYearlyMetrics({
    totalBudget: yearBudget,
    actualSpend: yearActual,
    monthsElapsed,
  });

  const fyPaceVisual = spendStatusToVisual(metrics.status);
  const fyStatusLabel = metrics.statusLabel;

  const fmt = (n: number) => formatCurrency(n, currency);
  const fyStatusDetail = !metrics.hasData
    ? 'Add budgets and committed spending to see FY pace.'
    : metrics.spendDiff > 0
      ? `${fmt(metrics.spendDiff)} over linear FY pace to date (${fmt(metrics.actualSpend)} spent vs ${fmt(metrics.expectedSpend)} expected by now).`
      : metrics.spendDiff < -1e-6
        ? `${fmt(Math.abs(metrics.spendDiff))} under linear FY pace to date (${fmt(metrics.actualSpend)} spent vs ${fmt(metrics.expectedSpend)} expected by now).`
        : `Spending matches linear FY pace (${fmt(metrics.actualSpend)} vs ${fmt(metrics.expectedSpend)} expected by now).`;

  const yearProgress = monthsElapsed / 12;
  const expectedSpendFyToDate = metrics.expectedSpend;
  const spendDiffFy = metrics.spendDiff;
  const remainingFyBudget = metrics.remaining;
  const fyAvgMonthlySpend = monthsElapsed > 0 ? yearActual / monthsElapsed : 0;
  const projectedYearTotal = metrics.projectedTotal;
  const projectedVsAnnualBudget = metrics.projectedDiff;
  const actualVsExpectedPct =
    expectedSpendFyToDate > 1e-6
      ? ((yearActual - expectedSpendFyToDate) / expectedSpendFyToDate) * 100
      : null;

  let biggestCategoryFy: { name: string; spent: number } | null = null;
  for (const c of categories) {
    const sp = catYearActual[c.id] || 0;
    if (!biggestCategoryFy || sp > biggestCategoryFy.spent) {
      biggestCategoryFy = sp > 0 ? { name: c.name, spent: sp } : biggestCategoryFy;
    }
  }
  if (biggestCategoryFy && biggestCategoryFy.spent <= 0) biggestCategoryFy = null;

  const yearlyInsightList =
    yearBudget > 0 && monthsElapsed > 0 && yearActual > 0
      ? getInsights({
          totalBudget: yearBudget,
          actualSpend: yearActual,
          expectedSpend: expectedSpendFyToDate,
          projectedTotal: metrics.projectedTotal,
          yearProgress,
          categories: categories.map(c => ({
            name: c.name,
            budget: parseFloat(String(c.monthly_amount || 0)) * 12,
            actual: catYearActual[c.id] || 0,
            type: c.type === 'fixed' ? ('fixed' as const) : ('variable' as const),
          })),
          format: (n: number) => formatCurrency(n, currency),
        })
      : [];

  // ── FY cumulative spend by day (expenses from transactions) vs linear annual budget ──
  const dailyExpense: number[] = Array(fyDaysTotal + 2).fill(0);
  for (const tx of txFy || []) {
    if (tx.amount >= 0) continue;
    const ds = (tx.date || '').slice(0, 10);
    if (!ds) continue;
    const di = dayOfFinancialYear(fyYear, ds);
    if (di == null || di < 1 || di > fyDaysTotal) continue;
    dailyExpense[di] += -Number(tx.amount);
  }

  let run = 0;
  const cumulativeFyBurn: CumulativeBurnPoint[] = [];
  for (let day = 1; day <= fyDaysTotal; day++) {
    run += dailyExpense[day];
    const expected = yearBudget > 0 ? yearBudget * (day / fyDaysTotal) : 0;
    cumulativeFyBurn.push({
      dayOfFy: day,
      actual: day <= fyDaysElapsed ? run : null,
      expected,
    });
  }

  // ── Category bars: FY actual vs annual budget ──
  const categoryBars: CategoryBarRow[] = categories
    .map(c => {
      const spent = catYearActual[c.id] || 0;
      const budget = parseFloat(String(c.monthly_amount || 0)) * 12;
      const ratio = budget > 0 ? spent / budget : spent > 0 ? 2 : 0;
      let barTone: CategoryBarRow['barTone'] = 'green';
      if (budget > 0 && spent > budget) barTone = 'red';
      else if (budget > 0 && ratio >= 0.8) barTone = 'yellow';
      return { id: c.id, name: c.name, spent, budget, barTone };
    })
    .filter(r => r.spent > 0 || r.budget > 0)
    .sort((a, b) => b.spent - a.spent);

  // ── Latest FY month with spend vs previous FY month (for import cadence) ──
  let latestIdx = -1;
  fyMonths.forEach((m, i) => {
    if ((totalActualByMonth[m] || 0) > 0) latestIdx = i;
  });

  let momBars: MomRow[] = [];
  let momLabelA = '';
  let momLabelB = '';
  if (latestIdx >= 1) {
    const mA = fyMonths[latestIdx];
    const mB = fyMonths[latestIdx - 1];
    momLabelA = shortMonthLabel(mA);
    momLabelB = shortMonthLabel(mB);
    momBars = categories
      .map(c => ({
        id: c.id,
        name: c.name,
        thisMonth: categoryMonthlyActuals[c.id]?.[mA] ?? 0,
        lastMonth: categoryMonthlyActuals[c.id]?.[mB] ?? 0,
      }))
      .filter(r => r.thisMonth > 0 || r.lastMonth > 0)
      .sort((a, b) => b.thisMonth + b.lastMonth - (a.thisMonth + a.lastMonth));
  }

  const feed: InsightFeedItem[] = [];

  if (metrics.hasData && yearBudget > 0) {
    if (metrics.spendDiff > yearBudget * 0.02) {
      feed.push({
        type: 'warning',
        message: `FY spending is ${fmt(metrics.spendDiff)} above the linear pace-to-date target.`,
      });
    } else if (metrics.spendDiff < -yearBudget * 0.02) {
      feed.push({
        type: 'good',
        message: `FY spending is ${fmt(Math.abs(metrics.spendDiff))} below the linear pace-to-date target.`,
      });
    }
    if (metrics.projectedDiff > 0) {
      feed.push({
        type: 'critical',
        message: `At current FY burn you are projected to exceed the annual budget by ${fmt(metrics.projectedDiff)}.`,
      });
    } else if (metrics.projectedDiff < -yearBudget * 0.005) {
      feed.push({
        type: 'good',
        message: `At current FY burn you are projected to finish ${fmt(Math.abs(metrics.projectedDiff))} under the annual budget.`,
      });
    }
  }

  for (const row of categoryBars) {
    if (row.budget <= 0) continue;
    if (row.spent > row.budget) {
      feed.push({
        type: 'critical',
        message: `${row.name} has exceeded its annual budget (${fmt(row.spent)} vs ${fmt(row.budget)}).`,
      });
    } else if (row.budget > 0 && row.spent / row.budget >= 0.91 && row.spent < row.budget) {
      feed.push({
        type: 'warning',
        message: `${row.name} is at ${Math.round((row.spent / row.budget) * 100)}% of annual budget.`,
      });
    }
  }

  for (const yi of yearlyInsightList.slice(0, 5)) {
    feed.push({ type: yi.type, message: `${yi.title}: ${yi.message}` });
  }

  const seen = new Set<string>();
  const insightFeed = feed
    .filter(f => {
      if (seen.has(f.message)) return false;
      seen.add(f.message);
      return true;
    })
    .slice(0, 14);

  const labels = fyMonths.map(shortMonthLabel);
  let hasAnnualData = false;
  const annualSeries: AnnualCategorySeries[] = [];

  for (const c of categories) {
    const perMonth = fyMonths.map(m => categoryMonthlyActuals[c.id]?.[m] ?? 0);
    if (perMonth.some(v => v > 0)) hasAnnualData = true;
    const n = perMonth.length;
    const third = Math.max(1, Math.floor(n / 3));
    const early = perMonth.slice(0, third).reduce((a, v) => a + v, 0) / third;
    const late = perMonth.slice(-third).reduce((a, v) => a + v, 0) / third;
    const trendingUp = late > early * 1.08 && late > 50;

    annualSeries.push({
      categoryId: c.id,
      name: c.name,
      labels,
      values: perMonth,
      trendingUp,
    });
  }

  annualSeries.sort((a, b) => {
    const ta = a.values.reduce((x, y) => x + y, 0);
    const tb = b.values.reduce((x, y) => x + y, 0);
    return tb - ta;
  });

  return {
    currency,
    fyLabel,
    fyPaceVisual,
    fyStatusLabel,
    fyStatusDetail,
    monthsElapsed,
    fyDaysElapsed,
    fyDaysTotal,
    yearBudget,
    yearActual,
    expectedSpendFyToDate,
    spendDiffFy,
    remainingFyBudget,
    fyAvgMonthlySpend,
    projectedYearTotal,
    projectedVsAnnualBudget,
    actualVsExpectedPct,
    biggestCategoryFy,
    cumulativeFyBurn,
    categoryBars,
    momBars,
    momLabelA,
    momLabelB,
    insightFeed,
    annualSeries: annualSeries.filter(s => s.values.some(v => v > 0)).slice(0, 18),
    hasAnnualData,
  };
}
