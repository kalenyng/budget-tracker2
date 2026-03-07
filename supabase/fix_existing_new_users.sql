-- Fix existing new users: set all their category monthly_amount to 0
-- (except for the special user who should keep their values)
-- Run this in Supabase SQL Editor to fix any users created before the trigger fix

UPDATE categories 
SET monthly_amount = 0
WHERE user_id != 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'::uuid
AND monthly_amount != 0;

-- Also update any budgets that were created with non-zero values for new users
UPDATE budgets
SET budget_amount = 0
WHERE user_id != 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'::uuid
AND budget_amount != 0
AND budget_amount IN (
  SELECT monthly_amount 
  FROM categories 
  WHERE categories.id = budgets.category_id 
  AND categories.user_id = budgets.user_id
  AND categories.monthly_amount != 0
);
