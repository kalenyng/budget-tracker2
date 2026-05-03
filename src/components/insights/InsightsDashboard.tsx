import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { getCurrentUser } from '../../lib/auth';
import { formatCurrency, getCurrencySymbol, type CurrencyCode } from '../../lib/currency';
import {
  loadInsightsPageData,
  type InsightFeedItem,
  type InsightsPagePayload,
} from '../../lib/insightsPageData';

interface ChartTheme {
  accent: string;
  muted: string;
  text: string;
  textDim: string;
  red: string;
  yellow: string;
  green: string;
  grid: string;
}

function readChartTheme(): ChartTheme {
  if (typeof document === 'undefined') {
    return {
      accent: '#c8f560',
      muted: '#6d766f',
      text: '#dce3dc',
      textDim: '#939e96',
      red: '#f56060',
      yellow: '#f5c842',
      green: '#6ee7a8',
      grid: '#2e3832',
    };
  }
  const r = document.documentElement;
  const g = (name: string, fb: string) =>
    getComputedStyle(r).getPropertyValue(name).trim() || fb;
  return {
    accent: g('--accent', '#c8f560'),
    muted: g('--muted', '#6d766f'),
    text: g('--text', '#dce3dc'),
    textDim: g('--text-dim', '#939e96'),
    red: g('--red', '#f56060'),
    yellow: g('--accent2', '#f5c842'),
    green: '#6ee7a8',
    grid: '#2e3832',
  };
}

function statusPipClass(visual: InsightsPagePayload['fyPaceVisual']): string {
  if (visual === 'bad') return 'insights-status-pip insights-status-pip--bad';
  if (visual === 'warn') return 'insights-status-pip insights-status-pip--warn';
  if (visual === 'neutral') return 'insights-status-pip insights-status-pip--neutral';
  return 'insights-status-pip insights-status-pip--ok';
}

function statusBarClass(visual: InsightsPagePayload['fyPaceVisual']): string {
  let b = 'insights-status-bar';
  if (visual === 'bad') b += ' insights-status-bar--bad';
  else if (visual === 'warn') b += ' insights-status-bar--warn';
  else if (visual === 'neutral') b += ' insights-status-bar--neutral';
  else b += ' insights-status-bar--ok';
  return b;
}

function insightBorderClass(t: InsightFeedItem['type']): string {
  if (t === 'critical') return 'insights-feed-item insights-feed-item--critical';
  if (t === 'warning') return 'insights-feed-item insights-feed-item--warning';
  if (t === 'good') return 'insights-feed-item insights-feed-item--good';
  return 'insights-feed-item insights-feed-item--info';
}

/** Recharts formatter typings are strict; we normalise tooltips here. */
type LooseTooltipFmt = (value: unknown, name: unknown, item?: unknown) => [ReactNode, ReactNode];

export default function InsightsDashboard() {
  const [payload, setPayload] = useState<InsightsPagePayload | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [theme, setTheme] = useState<ChartTheme>(() => readChartTheme());

  useLayoutEffect(() => {
    setTheme(readChartTheme());
  }, []);

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(readChartTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const user = await getCurrentUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }

      let currency: CurrencyCode = 'ZAR';
      const { data: settingsRows } = await supabase
        .from('user_settings')
        .select('key, value, preferred_currency')
        .eq('user_id', user.id);
      for (const row of settingsRows || []) {
        if (row.preferred_currency) {
          currency = row.preferred_currency as CurrencyCode;
          break;
        }
        if (row.key === 'preferred_currency' && row.value) {
          currency = row.value as CurrencyCode;
        }
      }

      const data = await loadInsightsPageData(supabase, user.id, currency);
      setPayload(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load insights');
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (payload === undefined && !err) {
    return <div className="insights-loading">Loading insights…</div>;
  }

  if (err) {
    return (
      <div className="insights-empty insights-empty--error">
        {err}
        <button type="button" className="insights-retry" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="insights-empty">
        Add categories in Settings to see insights and charts.
      </div>
    );
  }

  const fmt = (n: number) => formatCurrency(n, payload.currency);
  const tipNum = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? fmt(v) : '—');
  const momTop = payload.momBars.slice(0, 14);
  const barColors: Record<string, string> = {
    green: theme.green,
    yellow: theme.yellow,
    red: theme.red,
  };

  const burnData = payload.cumulativeFyBurn.map(p => ({
    dayOfFy: p.dayOfFy,
    Actual: p.actual,
    Expected: p.expected,
  }));

  const maxSpend = Math.max(
    1,
    ...payload.categoryBars.map(r => Math.max(r.spent, r.budget)),
  );

  return (
    <div className="insights-dashboard">
      <section className={statusBarClass(payload.fyPaceVisual)} aria-label="Financial year pace">
        <span className={statusPipClass(payload.fyPaceVisual)} aria-hidden="true" />
        <div>
          <div className="insights-status-title">{payload.fyStatusLabel}</div>
          <div className="insights-status-fy">{payload.fyLabel}</div>
        </div>
        <p className="insights-status-meta">{payload.fyStatusDetail}</p>
      </section>

      <div className="insights-layout">
        <div className="insights-main">
          <section className="insights-kpi-row" aria-label="Key metrics">
            <div className="insights-kpi">
              <div className="insights-kpi-label">FY avg monthly spend</div>
              <div className="insights-kpi-value">
                {payload.monthsElapsed > 0 && payload.yearActual > 0
                  ? fmt(payload.fyAvgMonthlySpend)
                  : '—'}
              </div>
              <div className="insights-kpi-hint">
                Actual to date ÷ {payload.monthsElapsed} FY month{payload.monthsElapsed !== 1 ? 's' : ''}{' '}
                elapsed
              </div>
            </div>
            <div className="insights-kpi">
              <div className="insights-kpi-label">Projected FY total</div>
              <div className="insights-kpi-value">
                {payload.yearBudget > 0 && payload.monthsElapsed > 0 && payload.yearActual > 0
                  ? fmt(payload.projectedYearTotal)
                  : '—'}
              </div>
              <div className="insights-kpi-hint">
                {payload.yearBudget <= 0
                  ? 'Set category monthly amounts'
                  : payload.projectedVsAnnualBudget > 0
                    ? `${fmt(payload.projectedVsAnnualBudget)} over annual budget`
                    : `${fmt(Math.abs(payload.projectedVsAnnualBudget))} under annual budget`}
              </div>
            </div>
            <div className="insights-kpi">
              <div className="insights-kpi-label">Vs linear FY pace</div>
              <div className="insights-kpi-value">
                {payload.actualVsExpectedPct === null
                  ? '—'
                  : `${payload.actualVsExpectedPct >= 0 ? '+' : ''}${Math.round(payload.actualVsExpectedPct)}%`}
              </div>
              <div className="insights-kpi-hint">
                {payload.actualVsExpectedPct === null
                  ? 'No expected baseline yet'
                  : `${fmt(payload.yearActual)} spent vs ${fmt(payload.expectedSpendFyToDate)} expected`}
              </div>
            </div>
            <div className="insights-kpi">
              <div className="insights-kpi-label">Top category (FY)</div>
              <div className="insights-kpi-value">
                {payload.biggestCategoryFy ? payload.biggestCategoryFy.name : '—'}
              </div>
              <div className="insights-kpi-hint">
                {payload.biggestCategoryFy ? fmt(payload.biggestCategoryFy.spent) : 'No spend yet'}
              </div>
            </div>
          </section>

          <section className="insights-panel" aria-label="FY cumulative spend pace">
            <h2 className="insights-panel-title">FY spend vs linear annual pace</h2>
            <p className="insights-panel-lede">
              Cumulative expense transactions from 1 Apr vs a straight line to your total annual budget (
              {payload.fyLabel}). Day {payload.fyDaysElapsed} of {payload.fyDaysTotal} in the FY.
            </p>
            <div className="insights-chart-box">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={burnData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                  <XAxis
                    dataKey="dayOfFy"
                    tick={{ fill: theme.textDim, fontSize: 10 }}
                    minTickGap={32}
                    label={{
                      value: 'Day of FY (from 1 Apr)',
                      position: 'insideBottom',
                      offset: -4,
                      fill: theme.muted,
                    }}
                  />
                  <YAxis
                    tick={{ fill: theme.textDim, fontSize: 11 }}
                    tickFormatter={v => {
                      const sym = getCurrencySymbol(payload.currency);
                      const n = Number(v);
                      return `${sym}${n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: `1px solid var(--border-muted)`,
                      borderRadius: 6,
                      color: 'var(--text)',
                    }}
                    formatter={
                      ((value: unknown, name: unknown) => [tipNum(value), String(name ?? '')]) as LooseTooltipFmt
                    }
                  />
                  <Legend wrapperStyle={{ color: theme.textDim }} />
                  <Line
                    type="monotone"
                    dataKey="Actual"
                    name="Actual (cumulative)"
                    stroke={theme.accent}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Expected"
                    name="Expected pace"
                    stroke={theme.muted}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="insights-panel" aria-label="Category spend vs annual budget">
            <h2 className="insights-panel-title">FY spend by category</h2>
            <p className="insights-panel-lede">
              Actual to date vs annual budget (monthly amount × 12), highest spend first.
            </p>
            <div className="insights-chart-box" style={{ height: Math.max(300, payload.categoryBars.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={payload.categoryBars}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, maxSpend * 1.05]}
                    tick={{ fill: theme.textDim, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fill: theme.textDim, fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: `1px solid var(--border-muted)`,
                      borderRadius: 6,
                    }}
                    formatter={
                      ((value: unknown, _n: unknown, item: unknown) => {
                        const row = (item as { payload?: (typeof payload.categoryBars)[number] })?.payload;
                        const base = tipNum(value);
                        if (!row) return [base, 'Spent'];
                        return [`${base} · budget ${fmt(row.budget)}`, 'Spent'];
                      }) as LooseTooltipFmt
                    }
                  />
                  <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                    {payload.categoryBars.map((e, i) => (
                      <Cell key={i} fill={barColors[e.barTone]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="insights-panel" aria-label="Latest FY month vs previous">
            <h2 className="insights-panel-title">Latest FY month vs previous</h2>
            <p className="insights-panel-lede">
              {payload.momBars.length > 0 && payload.momLabelA && payload.momLabelB
                ? `Comparing the most recent FY month with spend (${payload.momLabelA}) to the prior FY month (${payload.momLabelB}).`
                : 'Once two FY months have budget actuals, a month-over-month comparison appears here.'}
            </p>
            {payload.momBars.length > 0 ? (
              <div className="insights-chart-box" style={{ minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={momTop} margin={{ top: 8, right: 16, left: 0, bottom: 64 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: theme.textDim, fontSize: 10 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fill: theme.textDim, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface-2)',
                        border: `1px solid var(--border-muted)`,
                        borderRadius: 6,
                      }}
                      formatter={
                        ((value: unknown, name: unknown) => [tipNum(value), String(name ?? '')]) as LooseTooltipFmt
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="thisMonth"
                      name={payload.momLabelA || 'Latest'}
                      fill={theme.accent}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="lastMonth"
                      name={payload.momLabelB || 'Previous'}
                      fill={theme.muted}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="insights-chart-box insights-chart-box--empty">
                <p className="insights-feed-empty" style={{ margin: 0 }}>
                  No two consecutive FY months with spend yet.
                </p>
              </div>
            )}
          </section>

          {payload.hasAnnualData && payload.annualSeries.length > 0 && (
            <section className="insights-panel" aria-label="Annual trends by category">
              <h2 className="insights-panel-title">Spend trend by category (FY)</h2>
              <p className="insights-panel-lede">
                Mini charts Apr → Mar. Highlighted tiles are trending up (late FY vs early FY).
              </p>
              <div className="insights-annual-grid">
                {payload.annualSeries.map(s => (
                  <div
                    key={s.categoryId}
                    className={
                      s.trendingUp
                        ? 'insights-annual-card insights-annual-card--up'
                        : 'insights-annual-card'
                    }
                  >
                    <div className="insights-annual-head">
                      <span className="insights-annual-name">{s.name}</span>
                      {s.trendingUp && (
                        <span className="insights-annual-badge">Trending up</span>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={72}>
                      <LineChart
                        data={s.labels.map((l, i) => ({ l, v: s.values[i] }))}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="l" tick={{ fontSize: 9, fill: theme.textDim }} interval={2} />
                        <YAxis hide domain={[0, 'auto']} />
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={s.trendingUp ? theme.yellow : theme.accent}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="insights-feed-aside" aria-label="Insights feed">
          <h2 className="insights-feed-title">Insights</h2>
          {payload.insightFeed.length === 0 ? (
            <p className="insights-feed-empty">No automated insights yet. Import spending to see tips.</p>
          ) : (
            <ul className="insights-feed-list">
              {payload.insightFeed.map((item, i) => (
                <li key={i} className={insightBorderClass(item.type)}>
                  {item.message}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
