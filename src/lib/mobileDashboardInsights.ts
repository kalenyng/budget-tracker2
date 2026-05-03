/**
 * Builds getInsights() inputs from FY budget rows + categories (same math as desktop year load).
 */

import type { CurrencyCode } from './currency';
import { formatCurrency } from './currency';
import { getInsights, type Insight } from './insights';
import { getMonthsElapsed } from './yearlyMetrics';

export function fyStartYear(d: Date): number {
  return d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
}

export function buildFyMonthStarts(year: number): string[] {
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

export interface CategoryRow {
  id: string;
  name: string;
  monthly_amount: unknown;
  sort_order?: number | null;
  type?: string | null;
}

export interface BudgetRow {
  month: string;
  category_id: string | null;
  actual_amount: unknown;
}

export function buildFyInsights(
  categories: CategoryRow[],
  budgetsFy: BudgetRow[],
  now: Date,
  currency: CurrencyCode,
): Insight[] {
  if (!categories.length) return [];

  const fyYear = fyStartYear(now);
  const fyMonths = new Set(buildFyMonthStarts(fyYear));

  const catMonthlyMap: Record<
    string,
    { name: string; monthlyAmount: number; sortOrder: number; type: 'fixed' | 'variable' }
  > = {};
  categories.forEach((c, i) => {
    catMonthlyMap[c.id] = {
      name: c.name,
      monthlyAmount: parseFloat(String(c.monthly_amount || 0)),
      sortOrder: c.sort_order ?? i,
      type: c.type === 'fixed' ? 'fixed' : 'variable',
    };
  });

  const catMap: Record<
    string,
    { name: string; annualBudget: number; annualActual: number; type: 'fixed' | 'variable' }
  > = {};

  let yearActual = 0;
  for (const b of budgetsFy) {
    if (!fyMonths.has(String(b.month).slice(0, 10))) continue;
    const actualAmount = parseFloat(String(b.actual_amount || 0));
    yearActual += actualAmount;
    const catId = b.category_id;
    if (!catId) continue;
    const catInfo = catMonthlyMap[catId] || {
      name: 'Unknown',
      monthlyAmount: 0,
      sortOrder: 9999,
      type: 'variable' as const,
    };
    if (!catMap[catId]) {
      catMap[catId] = {
        name: catInfo.name,
        annualBudget: catInfo.monthlyAmount * 12,
        annualActual: 0,
        type: catInfo.type,
      };
    }
    catMap[catId].annualActual += actualAmount;
  }

  Object.entries(catMonthlyMap).forEach(([catId, catInfo]) => {
    if (!catMap[catId] && catInfo.monthlyAmount > 0) {
      catMap[catId] = {
        name: catInfo.name,
        annualBudget: catInfo.monthlyAmount * 12,
        annualActual: 0,
        type: catInfo.type,
      };
    }
  });

  const yearBudget = categories.reduce((s, c) => s + parseFloat(String(c.monthly_amount || 0)) * 12, 0);
  const monthsElapsed = getMonthsElapsed(fyYear, now);
  const yearProgress = monthsElapsed / 12;
  const expectedSpend = yearBudget * yearProgress;
  const burnRate = monthsElapsed > 0 ? yearActual / monthsElapsed : 0;
  const projectedTotal = burnRate * 12;

  const categoryInputs = Object.entries(catMap)
    .map(([catId, c]) => ({
      catId,
      name: c.name,
      budget: c.annualBudget,
      actual: c.annualActual,
      type: c.type,
      sortOrder: catMonthlyMap[catId]?.sortOrder ?? 9999,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      name: c.name,
      budget: c.budget,
      actual: c.actual,
      type: c.type,
    }));

  return getInsights({
    totalBudget: yearBudget,
    actualSpend: yearActual,
    expectedSpend,
    projectedTotal,
    yearProgress,
    categories: categoryInputs,
    format: (n: number) => formatCurrency(n, currency),
  });
}
