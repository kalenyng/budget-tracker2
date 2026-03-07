-- Clean up bad data for non-special users
-- Run this in Supabase SQL Editor

-- Zero out any budgets that were incorrectly created with non-zero values for non-special users
UPDATE budgets
SET budget_amount = 0
WHERE user_id != 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'
  AND budget_amount != 0;

-- Zero out monthly_amount for non-special users in categories
UPDATE categories
SET monthly_amount = 0
WHERE user_id != 'af80ffde-ac95-4457-81bf-4bc44d5b84e6';
