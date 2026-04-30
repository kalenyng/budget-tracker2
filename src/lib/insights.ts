// Problem Detection Layer
// Analyses budget vs actual data and produces ranked, human-readable insights.
// All insight messages are pre-formatted; pass a `format` function for currency.

export type InsightType = 'critical' | 'warning' | 'good' | 'info';

export interface Insight {
  type: InsightType;
  title: string;
  message: string;
  /** Which spending category this relates to, if any */
  category?: string;
}

export interface CategoryInsightInput {
  name: string;
  budget: number;  // annual budget
  actual: number;  // actual spend so far this year
  /** Fixed categories follow predictable monthly spend; skip pace/risk rules */
  type?: 'fixed' | 'variable';
}

export interface InsightsInput {
  totalBudget: number;
  actualSpend: number;
  /** totalBudget * yearProgress — how much should have been spent by now */
  expectedSpend: number;
  /** burnRate * 12 — projected full-year spend */
  projectedTotal: number;
  /** Fraction of financial year elapsed, 0 → 1 */
  yearProgress: number;
  categories: CategoryInsightInput[];
  /** Currency formatter — called with a raw number, returns a display string */
  format: (amount: number) => string;
}

// Internal type that carries a sort key (stripped before returning)
interface ScoredInsight extends Insight {
  _score: number;
}

const MAX_INSIGHTS = 5;

export function getInsights(data: InsightsInput): Insight[] {
  const {
    totalBudget,
    actualSpend,
    expectedSpend,
    projectedTotal,
    yearProgress,
    categories,
    format,
  } = data;

  // Not enough data to say anything meaningful
  if (totalBudget === 0 || yearProgress === 0 || actualSpend === 0) return [];

  const raw: ScoredInsight[] = [];

  // ── Rule 1: Projection warning ───────────────────────────────────────────
  // Highest priority — tells the user where they'll end up.
  if (projectedTotal > totalBudget) {
    const overshoot = projectedTotal - totalBudget;
    raw.push({
      type: 'critical',
      title: 'You will exceed your budget',
      message: `At your current pace you'll overspend by ${format(overshoot)} before the year ends.`,
      _score: 1,
    });
  } else {
    // Only show the positive projection when there's no overspend alarm
    const surplus = totalBudget - projectedTotal;
    if (surplus > 0) {
      raw.push({
        type: 'good',
        title: 'Projected to finish under budget',
        message: `If you keep this pace you'll end the year with ${format(surplus)} to spare.`,
        _score: 12,
      });
    }
  }

  // ── Rule 2: Overall pace vs expected ─────────────────────────────────────
  const paceDiff = actualSpend - expectedSpend;
  const NOISE = totalBudget * 0.005; // ignore differences < 0.5% of budget

  if (paceDiff > NOISE) {
    raw.push({
      type: 'critical',
      title: 'Spending faster than planned',
      message: `You've spent ${format(paceDiff)} more than expected at this point in the year.`,
      _score: 2,
    });
  } else if (paceDiff < -NOISE) {
    raw.push({
      type: 'good',
      title: 'You\'re under budget so far',
      message: `You've spent ${format(Math.abs(paceDiff))} less than expected — you're on track.`,
      _score: 11,
    });
  }

  // ── Rule 3: High-risk categories ─────────────────────────────────────────
  // Flagged when ≥80% of budget used but ≥40% of year still remains.
  const riskThreshold = 0.8;
  const riskCats = categories
    .filter(c =>
      c.budget > 0 &&
      c.type !== 'fixed' &&
      yearProgress < 0.6 &&
      (c.actual / c.budget) >= riskThreshold
    )
    .sort((a, b) => b.actual / b.budget - a.actual / a.budget);

  const flaggedAsRisk = new Set<string>();
  for (const cat of riskCats.slice(0, 2)) {
    const usedPct   = Math.round((cat.actual / cat.budget) * 100);
    const leftPct   = Math.round((1 - yearProgress) * 100);
    raw.push({
      type: 'warning',
      title: `${cat.name} is at risk`,
      message: `You've used ${usedPct}% of your ${cat.name} budget with ${leftPct}% of the year still to go.`,
      category: cat.name,
      _score: 3,
    });
    flaggedAsRisk.add(cat.name);
  }

  // ── Rule 4: Category overspending ────────────────────────────────────────
  // Actual exceeds expected-by-now for that category.
  const overCats = categories
    .filter(c =>
      c.budget > 0 &&
      c.type !== 'fixed' &&
      c.actual > c.budget * yearProgress &&
      !flaggedAsRisk.has(c.name)  // don't duplicate rule 3
    )
    .sort((a, b) => (b.actual - b.budget * yearProgress) - (a.actual - a.budget * yearProgress));

  for (const cat of overCats.slice(0, 2)) {
    const over = cat.actual - cat.budget * yearProgress;
    raw.push({
      type: 'warning',
      title: `${cat.name} is over for this point in the year`,
      message: `${format(over)} more than expected in ${cat.name} based on how far through the year you are.`,
      category: cat.name,
      _score: 4,
    });
  }

  // ── Sort by severity score, deduplicate, cap ──────────────────────────────
  return raw
    .sort((a, b) => a._score - b._score)
    .slice(0, MAX_INSIGHTS)
    .map(({ _score: _s, ...insight }) => insight);  // strip internal field
}
