-- Recovery script to restore categories for your specific user
-- Run this in Supabase SQL Editor to restore your categories

-- First, ensure user_id columns exist (in case migration 010 hasn't been run)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Restore categories with default values for your user
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

-- Variable categories
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

-- Restore budgets for current month
-- Note: If budgets table still has old UNIQUE(category_id, month) constraint, 
-- this will work. If it's been updated to include user_id, the ON CONFLICT will still work.
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
  budget_amount = EXCLUDED.budget_amount,
  user_id = EXCLUDED.user_id;
