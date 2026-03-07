-- Allow currency changes in categories table
-- Remove the CHECK constraint that restricts currency to only 'ZAR'
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_currency_check;

-- Add new constraint to allow common currencies
ALTER TABLE categories ADD CONSTRAINT categories_currency_check 
  CHECK (currency IN ('ZAR', 'GBP', 'USD', 'EUR'));

-- Update monthly_balances to allow more currencies
ALTER TABLE monthly_balances DROP CONSTRAINT IF EXISTS monthly_balances_currency_check;
ALTER TABLE monthly_balances ADD CONSTRAINT monthly_balances_currency_check 
  CHECK (currency IN ('ZAR', 'GBP', 'USD', 'EUR'));

-- Update incomes to allow more currencies
ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_currency_check;
ALTER TABLE incomes ADD CONSTRAINT incomes_currency_check 
  CHECK (currency IN ('ZAR', 'GBP', 'USD', 'EUR'));
