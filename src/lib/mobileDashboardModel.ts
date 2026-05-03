/**
 * Pure helpers for mobile home: meaningful months, focus month, dashboard state.
 * No Supabase — pass query results in.
 */

import type { Insight } from './insights';

export type DashboardStateId =
  | 'onboarding_no_categories'
  | 'onboarding_no_data'
  | 'new_month_idle'
  | 'needs_db_attention'
  | 'processed_home';

export interface SortSessionInfo {
  active: boolean;
  total: number;
  remaining: number;
}

export function getMobileSortProgressKey(userId: string): string {
  return `mobile_sort_progress_${userId}`;
}

interface SortProgressJson {
  transactions?: unknown[];
  currentIndex?: number;
  timestamp?: number;
  userId?: string;
}

/** Mirrors mobile-sort.astro validation (read-only). */
export function readSortSessionFromStorage(
  storage: Storage,
  userId: string,
): SortSessionInfo {
  const key = getMobileSortProgressKey(userId);
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { active: false, total: 0, remaining: 0 };
  }
  if (!raw) return { active: false, total: 0, remaining: 0 };
  let progress: SortProgressJson;
  try {
    progress = JSON.parse(raw) as SortProgressJson;
  } catch {
    return { active: false, total: 0, remaining: 0 };
  }
  if (progress.userId !== userId) return { active: false, total: 0, remaining: 0 };
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (typeof progress.timestamp === 'number' && Date.now() - progress.timestamp > sevenDays) {
    return { active: false, total: 0, remaining: 0 };
  }
  const txs = Array.isArray(progress.transactions) ? progress.transactions : [];
  const currentIndex = typeof progress.currentIndex === 'number' ? progress.currentIndex : 0;
  const total = txs.length;
  if (total === 0 || currentIndex >= total) return { active: false, total: 0, remaining: 0 };
  return { active: true, total, remaining: total - currentIndex };
}

/** `month` column is YYYY-MM-DD; normalize to YYYY-MM */
export function monthKeyFromDb(monthField: string): string {
  return String(monthField).slice(0, 7);
}

export function currentCalendarYM(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function buildMeaningfulMonthSet(
  txRows: { month: string; category_id: string | null }[],
  budgetRows: { month: string; category_id: string | null; actual_amount: unknown }[],
  expenseCategoryIds: Set<string>,
): Set<string> {
  const out = new Set<string>();
  for (const r of txRows) {
    if (r.category_id != null && expenseCategoryIds.has(r.category_id)) {
      out.add(monthKeyFromDb(r.month));
    }
  }
  for (const r of budgetRows) {
    const amt = parseFloat(String(r.actual_amount ?? 0));
    if (amt > 1e-9 && r.category_id != null && expenseCategoryIds.has(r.category_id)) {
      out.add(monthKeyFromDb(r.month));
    }
  }
  return out;
}

export function maxYm(months: Iterable<string>): string | null {
  let best: string | null = null;
  for (const m of months) {
    if (!/^\d{4}-\d{2}$/.test(m)) continue;
    if (!best || m > best) best = m;
  }
  return best;
}

export function latestMeaningfulMonth(meaningful: Set<string>): string | null {
  return maxYm(meaningful);
}

export function lastClosedMeaningfulMonth(meaningful: Set<string>, currentYM: string): string | null {
  let best: string | null = null;
  for (const m of meaningful) {
    if (m < currentYM && (!best || m > best)) best = m;
  }
  return best;
}

/** Returns YYYY-MM or null if invalid / out of sensible range */
export function parseMonthQueryParam(param: string | null, now: Date): string | null {
  if (!param || !/^\d{4}-\d{2}$/.test(param)) return null;
  const y = parseInt(param.slice(0, 4), 10);
  const mo = parseInt(param.slice(5, 7), 10);
  if (mo < 1 || mo > 12) return null;
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  // Allow current month and past; allow up to 1 month ahead (calendar quirk)
  const ahead = y > curY + 1 || (y === curY + 1 && mo > 1);
  if (ahead) return null;
  return param;
}

export function pickFocusYM(args: {
  urlMonthParam: string | null;
  now: Date;
  meaningful: Set<string>;
}): { focusYM: string | null; fromUrl: boolean } {
  const currentYM = currentCalendarYM(args.now);
  const fromUrl = parseMonthQueryParam(args.urlMonthParam, args.now);
  if (fromUrl) return { focusYM: fromUrl, fromUrl: true };
  const lastClosed = lastClosedMeaningfulMonth(args.meaningful, currentYM);
  const latest = latestMeaningfulMonth(args.meaningful);
  const defaultFocus = lastClosed ?? latest ?? null;
  return { focusYM: defaultFocus, fromUrl: false };
}

export function monthStartIso(ym: string): string {
  return `${ym}-01`;
}

export function deriveDashboardState(args: {
  categoryCount: number;
  meaningful: Set<string>;
  focusYM: string | null;
  now: Date;
  uncategorizedCountForFocus: number;
}): DashboardStateId {
  if (args.categoryCount === 0) return 'onboarding_no_categories';
  if (args.focusYM && args.uncategorizedCountForFocus > 0) return 'needs_db_attention';
  if (args.meaningful.size === 0) return 'onboarding_no_data';
  if (args.focusYM && !args.meaningful.has(args.focusYM)) return 'new_month_idle';
  if (args.focusYM && args.meaningful.has(args.focusYM)) return 'processed_home';
  return 'onboarding_no_data';
}

export function insightLinesForMobile(insights: Insight[], max = 2): { type: string; text: string }[] {
  return insights.slice(0, max).map((i) => ({
    type: i.type,
    text: `${i.title}: ${i.message}`.trim(),
  }));
}
