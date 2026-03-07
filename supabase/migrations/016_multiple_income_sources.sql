-- Remove the old unique constraint that only allowed one income per month/currency/user
-- Multiple income sources means multiple rows per month
ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_month_currency_user_unique;
ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_month_currency_key;

-- Add a source_name column to identify each income source
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS source_name TEXT NOT NULL DEFAULT 'Income';

-- Add is_template column - marks rows that define the persistent income sources for a user
-- When true, this row is the "template" that appears each month
-- When false (or null), this is a monthly entry with an actual amount
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;

-- New unique constraint: one entry per source per month per user
ALTER TABLE incomes ADD CONSTRAINT incomes_source_month_user_unique 
  UNIQUE (source_name, month, user_id);

-- Index for loading templates quickly
CREATE INDEX IF NOT EXISTS idx_incomes_template ON incomes(user_id, is_template) WHERE is_template = true;
