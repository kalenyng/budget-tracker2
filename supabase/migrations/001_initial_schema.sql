-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL CHECK (currency IN ('GBP', 'ZAR')),
  is_fixed BOOLEAN DEFAULT FALSE,
  is_predefined BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('GBP', 'ZAR')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_suggested TEXT,
  is_manual_review BOOLEAN DEFAULT FALSE,
  csv_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, month)
);

-- Indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_currency ON transactions(currency);
CREATE INDEX idx_budgets_month ON budgets(month);
CREATE INDEX idx_budgets_category_month ON budgets(category_id, month);
CREATE INDEX idx_categories_currency ON categories(currency);

-- Row Level Security policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON categories
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON transactions
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON budgets
  FOR ALL USING (true);

-- For now, allow public access (you can restrict this later with auth)
CREATE POLICY "Allow public read" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read" ON budgets
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON budgets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON categories
  FOR UPDATE USING (true);

CREATE POLICY "Allow public update" ON transactions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public update" ON budgets
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON categories
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete" ON transactions
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete" ON budgets
  FOR DELETE USING (true);
