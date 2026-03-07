-- Drop old tables if they exist
DROP TABLE IF EXISTS actual_spending CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS monthly_balances CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create simplified categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  monthly_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('fixed', 'variable')),
  currency TEXT NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budgets table for monthly budget tracking
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  budget_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, month)
);

-- Create monthly balances table
CREATE TABLE monthly_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  starting_balance NUMERIC(12, 2),
  ending_balance NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, currency)
);

-- Indexes for performance
CREATE INDEX idx_budgets_month ON budgets(month);
CREATE INDEX idx_budgets_category_month ON budgets(category_id, month);
CREATE INDEX idx_monthly_balances_month ON monthly_balances(month);
CREATE INDEX idx_categories_type ON categories(type);

-- Row Level Security policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust as needed for your auth setup)
CREATE POLICY "Allow all for categories" ON categories
  FOR ALL USING (true);

CREATE POLICY "Allow all for budgets" ON budgets
  FOR ALL USING (true);

CREATE POLICY "Allow all for monthly_balances" ON monthly_balances
  FOR ALL USING (true);
