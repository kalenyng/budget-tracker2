-- Seed categories with confirmed fixed monthly expenses FOR SPECIFIC USER ONLY
-- Fixed categories
INSERT INTO categories (name, monthly_amount, type, currency, category_group, user_id) VALUES
  ('Rent', 15000, 'fixed', 'ZAR', NULL, 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Medical Aid', 1779, 'fixed', 'ZAR', NULL, 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Gym', 505, 'fixed', 'ZAR', NULL, 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Electricity', 1500, 'fixed', 'ZAR', NULL, 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Water', 500, 'fixed', 'ZAR', NULL, 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Subscriptions', 787, 'fixed', 'ZAR', NULL, 'af80ffde-ac95-4457-81bf-4bc44d5b84e6')
ON CONFLICT (name, user_id) DO UPDATE SET
  monthly_amount = EXCLUDED.monthly_amount,
  type = EXCLUDED.type,
  currency = EXCLUDED.currency,
  category_group = EXCLUDED.category_group;

-- Variable categories (with estimated monthly amounts)
INSERT INTO categories (name, monthly_amount, type, currency, user_id) VALUES
  ('Groceries', 4000, 'variable', 'ZAR', 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Eating Out', 1200, 'variable', 'ZAR', 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Fuel', 1500, 'variable', 'ZAR', 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Transport (Uber/Bolt)', 300, 'variable', 'ZAR', 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Clothing', 0, 'variable', 'ZAR', 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'),
  ('Misc / Cash', 1000, 'variable', 'ZAR', 'af80ffde-ac95-4457-81bf-4bc44d5b84e6')
ON CONFLICT (name, user_id) DO UPDATE SET
  monthly_amount = EXCLUDED.monthly_amount,
  type = EXCLUDED.type,
  currency = EXCLUDED.currency;

-- Set initial budgets for current month using monthly_amount from categories (only for specific user)
INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id)
SELECT 
  id,
  date_trunc('month', CURRENT_DATE)::date,
  monthly_amount,
  0,
  'af80ffde-ac95-4457-81bf-4bc44d5b84e6'
FROM categories
WHERE user_id = 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'
ON CONFLICT (category_id, month) DO UPDATE SET
  budget_amount = EXCLUDED.budget_amount;
