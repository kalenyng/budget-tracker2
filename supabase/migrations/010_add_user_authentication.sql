-- Add user_id columns to all tables for multi-user support
-- This migration adds user_id to all tables and updates RLS policies

-- Add user_id to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Add user_id to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Add user_id to incomes table
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);

-- Add user_id to monthly_balances table
ALTER TABLE monthly_balances ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_monthly_balances_user_id ON monthly_balances(user_id);

-- Update user_settings to use user_id instead of global key
-- First, drop the unique constraint on key
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_key_key;
-- Add user_id column
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Make key unique per user
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_key_unique UNIQUE (user_id, key);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Drop all existing RLS policies (only for tables that exist)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON budgets;
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

-- Create new RLS policies that filter by user_id
-- Categories: users can only see/modify their own categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets: users can only see/modify their own budgets
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Incomes: users can only see/modify their own incomes
CREATE POLICY "Users can view own incomes" ON incomes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomes" ON incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomes" ON incomes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomes" ON incomes
  FOR DELETE USING (auth.uid() = user_id);

-- Monthly balances: users can only see/modify their own balances
CREATE POLICY "Users can view own monthly_balances" ON monthly_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly_balances" ON monthly_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly_balances" ON monthly_balances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly_balances" ON monthly_balances
  FOR DELETE USING (auth.uid() = user_id);

-- User settings: users can only see/modify their own settings
CREATE POLICY "Users can view own user_settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically set user_id
CREATE TRIGGER set_categories_user_id
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_budgets_user_id
  BEFORE INSERT ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_incomes_user_id
  BEFORE INSERT ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_monthly_balances_user_id
  BEFORE INSERT ON monthly_balances
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_settings_user_id
  BEFORE INSERT ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();
