-- Summarize categories with subscriptions grouped together
-- This query groups subscription-related categories and shows totals

WITH subscription_categories AS (
  SELECT id, name, currency
  FROM categories
  WHERE name IN (
    'Apple subscriptions',
    'ChatGPT',
    'F1 TV',
    'Microsoft',
    'Netflix',
    'Discovery Insurance',
    'Virgin Active'
  )
),
categorized_spending AS (
  SELECT 
    c.currency,
    CASE 
      WHEN sc.id IS NOT NULL THEN 'Subscriptions'
      ELSE c.name
    END AS category_group,
    c.name AS original_category,
    COALESCE(SUM(b.amount), 0) AS total_budget,
    COALESCE(SUM(a.amount), 0) AS total_actual,
    COALESCE(SUM(a.amount), 0) - COALESCE(SUM(b.amount), 0) AS variance,
    COUNT(DISTINCT b.month) AS months_with_budget
  FROM categories c
  LEFT JOIN subscription_categories sc ON c.id = sc.id
  LEFT JOIN budgets b ON c.id = b.category_id
  LEFT JOIN actual_spending a ON c.id = a.category_id AND b.month = a.month
  GROUP BY 
    c.currency,
    CASE 
      WHEN sc.id IS NOT NULL THEN 'Subscriptions'
      ELSE c.name
    END,
    c.name
)
SELECT 
  currency,
  category_group,
  COUNT(DISTINCT original_category) AS category_count,
  SUM(total_budget) AS total_budget,
  SUM(total_actual) AS total_actual,
  SUM(variance) AS total_variance,
  MAX(months_with_budget) AS months_tracked
FROM categorized_spending
GROUP BY currency, category_group
ORDER BY currency, total_budget DESC;

-- Alternative: Monthly summary with subscriptions grouped
-- Replace '2026-03-01' with your desired month
SELECT 
  c.currency,
  CASE 
    WHEN c.name IN (
      'Apple subscriptions', 'ChatGPT', 'F1 TV', 'Microsoft', 
      'Netflix', 'Discovery Insurance', 'Virgin Active'
    ) THEN 'Subscriptions'
    ELSE c.name
  END AS category_group,
  COALESCE(SUM(b.amount), 0) AS budget_total,
  COALESCE(SUM(a.amount), 0) AS actual_total,
  COALESCE(SUM(a.amount), 0) - COALESCE(SUM(b.amount), 0) AS variance
FROM categories c
LEFT JOIN budgets b ON c.id = b.category_id AND b.month = '2026-03-01'::date
LEFT JOIN actual_spending a ON c.id = a.category_id AND a.month = '2026-03-01'::date
GROUP BY 
  c.currency,
  CASE 
    WHEN c.name IN (
      'Apple subscriptions', 'ChatGPT', 'F1 TV', 'Microsoft', 
      'Netflix', 'Discovery Insurance', 'Virgin Active'
    ) THEN 'Subscriptions'
    ELSE c.name
  END
ORDER BY c.currency, budget_total DESC;
