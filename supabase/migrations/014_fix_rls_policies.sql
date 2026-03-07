-- Fix RLS policies to ensure proper per-user data isolation
-- This migration replaces existing policies with properly scoped ones

-- Enable RLS on all tables (idempotent)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be too permissive
DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON budgets;
DROP POLICY IF EXISTS "Allow all for categories" ON categories;
DROP POLICY IF EXISTS "Allow all for budgets" ON budgets;
DROP POLICY IF EXISTS "Allow all for monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Allow all for incomes" ON incomes;
DROP POLICY IF EXISTS "Allow all for user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow public read" ON categories;
DROP POLICY IF EXISTS "Allow public read" ON budgets;
DROP POLICY IF EXISTS "Allow public insert" ON categories;
DROP POLICY IF EXISTS "Allow public insert" ON budgets;
DROP POLICY IF EXISTS "Allow public update" ON categories;
DROP POLICY IF EXISTS "Allow public update" ON budgets;
DROP POLICY IF EXISTS "Allow public delete" ON categories;
DROP POLICY IF EXISTS "Allow public delete" ON budgets;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can view own monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Users can insert own monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Users can update own monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Users can delete own monthly_balances" ON monthly_balances;
DROP POLICY IF EXISTS "Users can view own user_settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own user_settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own user_settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own user_settings" ON user_settings;

-- Categories: Create properly scoped policies
CREATE POLICY "select_own" ON categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- Budgets: Create properly scoped policies
CREATE POLICY "select_own" ON budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON budgets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON budgets
  FOR DELETE USING (user_id = auth.uid());

-- Incomes: Create properly scoped policies
CREATE POLICY "select_own" ON incomes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON incomes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON incomes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON incomes
  FOR DELETE USING (user_id = auth.uid());

-- Monthly balances: Create properly scoped policies
CREATE POLICY "select_own" ON monthly_balances
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON monthly_balances
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON monthly_balances
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON monthly_balances
  FOR DELETE USING (user_id = auth.uid());

-- User settings: Create properly scoped policies
CREATE POLICY "select_own" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON user_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON user_settings
  FOR DELETE USING (user_id = auth.uid());
