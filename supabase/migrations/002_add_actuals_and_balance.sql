-- Add actual spending table
CREATE TABLE actual_spending (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, month)
);

-- Add balance tracking table
CREATE TABLE monthly_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('GBP', 'ZAR')),
  starting_balance NUMERIC(12, 2),
  ending_balance NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, currency)
);

-- Indexes
CREATE INDEX idx_actual_spending_month ON actual_spending(month);
CREATE INDEX idx_actual_spending_category_month ON actual_spending(category_id, month);
CREATE INDEX idx_monthly_balances_month ON monthly_balances(month);
CREATE INDEX idx_monthly_balances_currency ON monthly_balances(currency);

-- RLS policies
ALTER TABLE actual_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for actual_spending" ON actual_spending
  FOR ALL USING (true);

CREATE POLICY "Allow all for monthly_balances" ON monthly_balances
  FOR ALL USING (true);
