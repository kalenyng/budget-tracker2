-- Combine all subscription categories into a single "Subscriptions" category

-- First, create a temporary table to store aggregated subscription budgets
CREATE TEMP TABLE temp_subscription_budgets AS
SELECT 
  b.month,
  SUM(b.budget_amount) AS total_budget,
  SUM(b.actual_amount) AS total_actual
FROM budgets b
INNER JOIN categories c ON b.category_id = c.id
WHERE c.category_group = 'Subscriptions' OR c.name IN ('ChatGPT', 'Microsoft', 'Netflix', 'Mobile Data')
GROUP BY b.month;

-- Create the combined Subscriptions category (if it doesn't exist)
INSERT INTO categories (name, monthly_amount, type, currency, category_group)
SELECT 'Subscriptions', 
       COALESCE(SUM(monthly_amount), 0),
       'fixed',
       'ZAR',
       NULL
FROM categories
WHERE category_group = 'Subscriptions' OR name IN ('ChatGPT', 'Microsoft', 'Netflix', 'Mobile Data')
ON CONFLICT (name) DO UPDATE SET
  monthly_amount = EXCLUDED.monthly_amount;

-- Get the new Subscriptions category ID
DO $$
DECLARE
  subscriptions_id UUID;
BEGIN
  SELECT id INTO subscriptions_id FROM categories WHERE name = 'Subscriptions';
  
  -- Migrate budgets to the new Subscriptions category
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount)
  SELECT subscriptions_id, month, total_budget, total_actual
  FROM temp_subscription_budgets
  ON CONFLICT (category_id, month) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount,
    actual_amount = EXCLUDED.actual_amount;
  
  -- Delete old subscription categories and their budgets (CASCADE will handle budgets)
  DELETE FROM categories 
  WHERE (category_group = 'Subscriptions' OR name IN ('ChatGPT', 'Microsoft', 'Netflix', 'Mobile Data'))
    AND name != 'Subscriptions';
END $$;

-- Drop the temporary table
DROP TABLE temp_subscription_budgets;
