-- Create incomes table for monthly income tracking
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR' CHECK (currency = 'ZAR'),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, currency)
);

-- Indexes for performance
CREATE INDEX idx_incomes_month ON incomes(month);

-- Row Level Security policies
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for incomes" ON incomes
  FOR ALL USING (true);
