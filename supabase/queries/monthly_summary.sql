-- Monthly summary with subscriptions grouped
-- Usage: Replace '2026-03-01' with your desired month date

WITH monthly_data AS (
  SELECT 
    c.id,
    c.name,
    c.currency,
    c.is_fixed,
    COALESCE(b.amount, 0) AS budget,
    COALESCE(a.amount, 0) AS actual
  FROM categories c
  LEFT JOIN budgets b ON c.id = b.category_id AND b.month = '2026-03-01'::date
  LEFT JOIN actual_spending a ON c.id = a.category_id AND a.month = '2026-03-01'::date
),
grouped_data AS (
  SELECT 
    currency,
    CASE 
      WHEN name IN (
        'Apple subscriptions', 'ChatGPT', 'F1 TV', 'Microsoft', 
        'Netflix', 'Discovery Insurance', 'Virgin Active'
      ) THEN 'Subscriptions'
      ELSE name
    END AS category_group,
    STRING_AGG(DISTINCT name, ', ' ORDER BY name) AS original_categories,
    BOOL_OR(is_fixed) AS is_fixed,
    SUM(budget) AS budget_total,
    SUM(actual) AS actual_total,
    SUM(actual) - SUM(budget) AS variance
  FROM monthly_data
  GROUP BY 
    currency,
    CASE 
      WHEN name IN (
        'Apple subscriptions', 'ChatGPT', 'F1 TV', 'Microsoft', 
        'Netflix', 'Discovery Insurance', 'Virgin Active'
      ) THEN 'Subscriptions'
      ELSE name
    END
)
SELECT 
  currency,
  category_group,
  original_categories,
  CASE WHEN is_fixed THEN 'Yes' ELSE 'No' END AS fixed,
  ROUND(budget_total::numeric, 2) AS budget,
  ROUND(actual_total::numeric, 2) AS actual,
  ROUND(variance::numeric, 2) AS variance,
  CASE 
    WHEN budget_total > 0 THEN ROUND((variance / budget_total * 100)::numeric, 1)
    ELSE 0
  END AS variance_pct
FROM grouped_data
ORDER BY currency, budget_total DESC;
