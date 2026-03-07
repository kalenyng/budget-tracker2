-- =============================================================
-- DUMMY DATA SEED SCRIPT
-- Clears all data for the target user and inserts realistic
-- South African budget dummy data for Apr 2025 – Mar 2026.
--
-- HOW TO USE:
--   Replace 'your@email.com' below with your Supabase account email.
--
-- Run this in the Supabase SQL editor.
-- =============================================================

DO $$
DECLARE
  v_user_email TEXT := 'your@email.com';   -- <-- CHANGE THIS
  v_user_id    UUID;

  -- Category IDs
  c_rent          UUID;
  c_medical       UUID;
  c_gym           UUID;
  c_electricity   UUID;
  c_water         UUID;
  c_subscriptions UUID;
  c_savings       UUID;
  c_groceries     UUID;
  c_eating_out    UUID;
  c_fuel          UUID;
  c_transport     UUID;
  c_clothing      UUID;
  c_entertainment UUID;
  c_misc          UUID;

  -- Month dates (12 months: Apr 2025 – Mar 2026)
  m_apr25 DATE := '2025-04-01';
  m_may25 DATE := '2025-05-01';
  m_jun25 DATE := '2025-06-01';
  m_jul25 DATE := '2025-07-01';
  m_aug25 DATE := '2025-08-01';
  m_sep25 DATE := '2025-09-01';
  m_oct25 DATE := '2025-10-01';
  m_nov25 DATE := '2025-11-01';
  m_dec25 DATE := '2025-12-01';
  m_jan26 DATE := '2026-01-01';
  m_feb26 DATE := '2026-02-01';
  m_mar26 DATE := '2026-03-01';

BEGIN

  -- ===========================================================
  -- 0. RESOLVE USER ID FROM EMAIL
  -- ===========================================================

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email "%". Update v_user_email at the top of this script.', v_user_email;
  END IF;

  RAISE NOTICE 'Running seed for user: % (%)', v_user_email, v_user_id;

  -- ===========================================================
  -- 1. CLEAR ALL EXISTING DATA FOR THIS USER
  -- ===========================================================

  DELETE FROM budgets           WHERE user_id = v_user_id;
  DELETE FROM incomes           WHERE user_id = v_user_id;
  DELETE FROM monthly_balances  WHERE user_id = v_user_id;
  DELETE FROM user_settings     WHERE user_id = v_user_id;
  DELETE FROM categories        WHERE user_id = v_user_id;

  -- ===========================================================
  -- 2. INSERT CATEGORIES
  -- ===========================================================

  INSERT INTO categories (name, monthly_amount, type, category_group, user_id) VALUES
    ('Rent',                  15000, 'fixed',    NULL, v_user_id),
    ('Medical Aid',            1900, 'fixed',    NULL, v_user_id),
    ('Gym',                     550, 'fixed',    NULL, v_user_id),
    ('Electricity',            1600, 'fixed',    NULL, v_user_id),
    ('Water',                   520, 'fixed',    NULL, v_user_id),
    ('Subscriptions',           890, 'fixed',    NULL, v_user_id),
    ('Savings / Investments',  5000, 'fixed',    NULL, v_user_id),
    ('Groceries',              4500, 'variable', NULL, v_user_id),
    ('Eating Out',             1500, 'variable', NULL, v_user_id),
    ('Fuel',                   1800, 'variable', NULL, v_user_id),
    ('Transport (Uber/Bolt)',   400, 'variable', NULL, v_user_id),
    ('Clothing',               1000, 'variable', NULL, v_user_id),
    ('Entertainment',           800, 'variable', NULL, v_user_id),
    ('Misc / Cash',            1200, 'variable', NULL, v_user_id)
  ON CONFLICT (name, user_id) DO UPDATE SET
    monthly_amount = EXCLUDED.monthly_amount,
    type           = EXCLUDED.type,
    category_group = EXCLUDED.category_group;

  -- Fetch IDs
  SELECT id INTO c_rent          FROM categories WHERE name = 'Rent'                  AND user_id = v_user_id;
  SELECT id INTO c_medical       FROM categories WHERE name = 'Medical Aid'           AND user_id = v_user_id;
  SELECT id INTO c_gym           FROM categories WHERE name = 'Gym'                   AND user_id = v_user_id;
  SELECT id INTO c_electricity   FROM categories WHERE name = 'Electricity'           AND user_id = v_user_id;
  SELECT id INTO c_water         FROM categories WHERE name = 'Water'                 AND user_id = v_user_id;
  SELECT id INTO c_subscriptions FROM categories WHERE name = 'Subscriptions'         AND user_id = v_user_id;
  SELECT id INTO c_savings       FROM categories WHERE name = 'Savings / Investments' AND user_id = v_user_id;
  SELECT id INTO c_groceries     FROM categories WHERE name = 'Groceries'             AND user_id = v_user_id;
  SELECT id INTO c_eating_out    FROM categories WHERE name = 'Eating Out'            AND user_id = v_user_id;
  SELECT id INTO c_fuel          FROM categories WHERE name = 'Fuel'                  AND user_id = v_user_id;
  SELECT id INTO c_transport     FROM categories WHERE name = 'Transport (Uber/Bolt)' AND user_id = v_user_id;
  SELECT id INTO c_clothing      FROM categories WHERE name = 'Clothing'              AND user_id = v_user_id;
  SELECT id INTO c_entertainment FROM categories WHERE name = 'Entertainment'         AND user_id = v_user_id;
  SELECT id INTO c_misc          FROM categories WHERE name = 'Misc / Cash'           AND user_id = v_user_id;

  -- ===========================================================
  -- 3. INSERT BUDGETS  (budget_amount / actual_amount)
  --    Running balance:
  --      Apr 25 start: R30 000  → end: R47 800
  --      May 25 start: R47 800  → end: R57 600
  --      Jun 25 start: R57 600  → end: R69 500  (higher electricity – winter)
  --      Jul 25 start: R69 500  → end: R82 200
  --      Aug 25 start: R82 200  → end: R92 700
  --      Sep 25 start: R92 700  → end: R109 400
  --      Oct 25 start: R109 400 → end: R119 200
  --      Nov 25 start: R119 200 → end: R124 500 (Black Friday blowout)
  --      Dec 25 start: R124 500 → end: R143 000 (bonus + Xmas spend)
  --      Jan 26 start: R143 000 → end: R159 400
  --      Feb 26 start: R159 400 → end: R178 000
  --      Mar 26 start: R178 000 → end: NULL     (month in progress)
  -- ===========================================================

  -- ---- APRIL 2025 ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_apr25, 15000, 15000, v_user_id),
    (c_medical,       m_apr25,  1900,  1900, v_user_id),
    (c_gym,           m_apr25,   550,   550, v_user_id),
    (c_electricity,   m_apr25,  1600,  1420, v_user_id),
    (c_water,         m_apr25,   520,   498, v_user_id),
    (c_subscriptions, m_apr25,   890,   890, v_user_id),
    (c_savings,       m_apr25,  5000,  5000, v_user_id),
    (c_groceries,     m_apr25,  4500,  4320, v_user_id),
    (c_eating_out,    m_apr25,  1500,  1680, v_user_id),
    (c_fuel,          m_apr25,  1800,  1750, v_user_id),
    (c_transport,     m_apr25,   400,   280, v_user_id),
    (c_clothing,      m_apr25,  1000,     0, v_user_id),
    (c_entertainment, m_apr25,   800,   650, v_user_id),
    (c_misc,          m_apr25,  1200,   980, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- MAY 2025 ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_may25, 15000, 15000, v_user_id),
    (c_medical,       m_may25,  1900,  1900, v_user_id),
    (c_gym,           m_may25,   550,   550, v_user_id),
    (c_electricity,   m_may25,  1600,  1510, v_user_id),
    (c_water,         m_may25,   520,   505, v_user_id),
    (c_subscriptions, m_may25,   890,   890, v_user_id),
    (c_savings,       m_may25,  5000,  5000, v_user_id),
    (c_groceries,     m_may25,  4500,  4680, v_user_id),
    (c_eating_out,    m_may25,  1500,  1250, v_user_id),
    (c_fuel,          m_may25,  1800,  1920, v_user_id),
    (c_transport,     m_may25,   400,   350, v_user_id),
    (c_clothing,      m_may25,  1000,  2200, v_user_id),  -- winter clothes
    (c_entertainment, m_may25,   800,   580, v_user_id),
    (c_misc,          m_may25,  1200,  1050, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- JUNE 2025 (peak winter – higher electricity) ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_jun25, 15000, 15000, v_user_id),
    (c_medical,       m_jun25,  1900,  1900, v_user_id),
    (c_gym,           m_jun25,   550,   550, v_user_id),
    (c_electricity,   m_jun25,  1600,  2100, v_user_id),
    (c_water,         m_jun25,   520,   488, v_user_id),
    (c_subscriptions, m_jun25,   890,   890, v_user_id),
    (c_savings,       m_jun25,  5000,  5000, v_user_id),
    (c_groceries,     m_jun25,  4500,  4150, v_user_id),
    (c_eating_out,    m_jun25,  1500,   890, v_user_id),
    (c_fuel,          m_jun25,  1800,  1680, v_user_id),
    (c_transport,     m_jun25,   400,   420, v_user_id),
    (c_clothing,      m_jun25,  1000,     0, v_user_id),
    (c_entertainment, m_jun25,   800,   350, v_user_id),
    (c_misc,          m_jun25,  1200,   920, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- JULY 2025 (peak winter) ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_jul25, 15000, 15000, v_user_id),
    (c_medical,       m_jul25,  1900,  1900, v_user_id),
    (c_gym,           m_jul25,   550,   550, v_user_id),
    (c_electricity,   m_jul25,  1600,  2350, v_user_id),
    (c_water,         m_jul25,   520,   480, v_user_id),
    (c_subscriptions, m_jul25,   890,   890, v_user_id),
    (c_savings,       m_jul25,  5000,  5000, v_user_id),
    (c_groceries,     m_jul25,  4500,  4420, v_user_id),
    (c_eating_out,    m_jul25,  1500,  1100, v_user_id),
    (c_fuel,          m_jul25,  1800,  1750, v_user_id),
    (c_transport,     m_jul25,   400,   310, v_user_id),
    (c_clothing,      m_jul25,  1000,   380, v_user_id),
    (c_entertainment, m_jul25,   800,   680, v_user_id),
    (c_misc,          m_jul25,  1200,  1150, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- AUGUST 2025 ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_aug25, 15000, 15000, v_user_id),
    (c_medical,       m_aug25,  1900,  1900, v_user_id),
    (c_gym,           m_aug25,   550,   550, v_user_id),
    (c_electricity,   m_aug25,  1600,  2050, v_user_id),
    (c_water,         m_aug25,   520,   510, v_user_id),
    (c_subscriptions, m_aug25,   890,   890, v_user_id),
    (c_savings,       m_aug25,  5000,  5000, v_user_id),
    (c_groceries,     m_aug25,  4500,  4580, v_user_id),
    (c_eating_out,    m_aug25,  1500,  1340, v_user_id),
    (c_fuel,          m_aug25,  1800,  1890, v_user_id),
    (c_transport,     m_aug25,   400,   360, v_user_id),
    (c_clothing,      m_aug25,  1000,     0, v_user_id),
    (c_entertainment, m_aug25,   800,   720, v_user_id),
    (c_misc,          m_aug25,  1200,   870, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- SEPTEMBER 2025 (spring – entertainment up) ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_sep25, 15000, 15000, v_user_id),
    (c_medical,       m_sep25,  1900,  1900, v_user_id),
    (c_gym,           m_sep25,   550,   550, v_user_id),
    (c_electricity,   m_sep25,  1600,  1620, v_user_id),
    (c_water,         m_sep25,   520,   498, v_user_id),
    (c_subscriptions, m_sep25,   890,   890, v_user_id),
    (c_savings,       m_sep25,  5000,  5000, v_user_id),
    (c_groceries,     m_sep25,  4500,  4280, v_user_id),
    (c_eating_out,    m_sep25,  1500,  1560, v_user_id),
    (c_fuel,          m_sep25,  1800,  1820, v_user_id),
    (c_transport,     m_sep25,   400,   390, v_user_id),
    (c_clothing,      m_sep25,  1000,   850, v_user_id),
    (c_entertainment, m_sep25,   800,  1200, v_user_id),
    (c_misc,          m_sep25,  1200,   980, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- OCTOBER 2025 ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_oct25, 15000, 15000, v_user_id),
    (c_medical,       m_oct25,  1900,  1900, v_user_id),
    (c_gym,           m_oct25,   550,   550, v_user_id),
    (c_electricity,   m_oct25,  1600,  1480, v_user_id),
    (c_water,         m_oct25,   520,   515, v_user_id),
    (c_subscriptions, m_oct25,   890,   890, v_user_id),
    (c_savings,       m_oct25,  5000,  5000, v_user_id),
    (c_groceries,     m_oct25,  4500,  4650, v_user_id),
    (c_eating_out,    m_oct25,  1500,  1780, v_user_id),
    (c_fuel,          m_oct25,  1800,  1950, v_user_id),
    (c_transport,     m_oct25,   400,   440, v_user_id),
    (c_clothing,      m_oct25,  1000,  1200, v_user_id),
    (c_entertainment, m_oct25,   800,   920, v_user_id),
    (c_misc,          m_oct25,  1200,  1080, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- NOVEMBER 2025 (Black Friday blowout) ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_nov25, 15000, 15000, v_user_id),
    (c_medical,       m_nov25,  1900,  1900, v_user_id),
    (c_gym,           m_nov25,   550,   550, v_user_id),
    (c_electricity,   m_nov25,  1600,  1390, v_user_id),
    (c_water,         m_nov25,   520,   505, v_user_id),
    (c_subscriptions, m_nov25,   890,   890, v_user_id),
    (c_savings,       m_nov25,  5000,  5000, v_user_id),
    (c_groceries,     m_nov25,  4500,  5200, v_user_id),
    (c_eating_out,    m_nov25,  1500,  2100, v_user_id),
    (c_fuel,          m_nov25,  1800,  1850, v_user_id),
    (c_transport,     m_nov25,   400,   520, v_user_id),
    (c_clothing,      m_nov25,  1000,  3500, v_user_id),  -- Black Friday
    (c_entertainment, m_nov25,   800,  1100, v_user_id),
    (c_misc,          m_nov25,  1200,  1350, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- DECEMBER 2025 (Christmas + year-end bonus) ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_dec25, 15000, 15000, v_user_id),
    (c_medical,       m_dec25,  1900,  1900, v_user_id),
    (c_gym,           m_dec25,   550,     0, v_user_id),  -- gym closed / holiday
    (c_electricity,   m_dec25,  1600,  1750, v_user_id),
    (c_water,         m_dec25,   520,   530, v_user_id),
    (c_subscriptions, m_dec25,   890,   890, v_user_id),
    (c_savings,       m_dec25,  5000,     0, v_user_id),  -- skipped in Dec
    (c_groceries,     m_dec25,  4500,  6800, v_user_id),  -- Christmas
    (c_eating_out,    m_dec25,  1500,  3500, v_user_id),
    (c_fuel,          m_dec25,  1800,  2100, v_user_id),  -- holiday travel
    (c_transport,     m_dec25,   400,   650, v_user_id),
    (c_clothing,      m_dec25,  1000,     0, v_user_id),
    (c_entertainment, m_dec25,   800,  2200, v_user_id),  -- parties / events
    (c_misc,          m_dec25,  1200,  2400, v_user_id)   -- gifts
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- JANUARY 2026 ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_jan26, 15000, 15000, v_user_id),
    (c_medical,       m_jan26,  1900,  1900, v_user_id),
    (c_gym,           m_jan26,   550,   550, v_user_id),
    (c_electricity,   m_jan26,  1600,  1748, v_user_id),
    (c_water,         m_jan26,   520,   490, v_user_id),
    (c_subscriptions, m_jan26,   890,   890, v_user_id),
    (c_savings,       m_jan26,  5000,  5000, v_user_id),
    (c_groceries,     m_jan26,  4500,  4823, v_user_id),
    (c_eating_out,    m_jan26,  1500,  2105, v_user_id),
    (c_fuel,          m_jan26,  1800,  1650, v_user_id),
    (c_transport,     m_jan26,   400,   310, v_user_id),
    (c_clothing,      m_jan26,  1000,     0, v_user_id),
    (c_entertainment, m_jan26,   800,   950, v_user_id),
    (c_misc,          m_jan26,  1200,   875, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- FEBRUARY 2026 ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_feb26, 15000, 15000, v_user_id),
    (c_medical,       m_feb26,  1900,  1900, v_user_id),
    (c_gym,           m_feb26,   550,   550, v_user_id),
    (c_electricity,   m_feb26,  1600,  1512, v_user_id),
    (c_water,         m_feb26,   520,   505, v_user_id),
    (c_subscriptions, m_feb26,   890,   890, v_user_id),
    (c_savings,       m_feb26,  5000,  5000, v_user_id),
    (c_groceries,     m_feb26,  4500,  4210, v_user_id),
    (c_eating_out,    m_feb26,  1500,  1380, v_user_id),
    (c_fuel,          m_feb26,  1800,  1920, v_user_id),
    (c_transport,     m_feb26,   400,   455, v_user_id),
    (c_clothing,      m_feb26,  1000,  1650, v_user_id),
    (c_entertainment, m_feb26,   800,   720, v_user_id),
    (c_misc,          m_feb26,  1200,  1100, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ---- MARCH 2026 (current month – actuals partially filled) ----
  INSERT INTO budgets (category_id, month, budget_amount, actual_amount, user_id) VALUES
    (c_rent,          m_mar26, 15000, 15000, v_user_id),
    (c_medical,       m_mar26,  1900,  1900, v_user_id),
    (c_gym,           m_mar26,   550,   550, v_user_id),
    (c_electricity,   m_mar26,  1600,     0, v_user_id),
    (c_water,         m_mar26,   520,     0, v_user_id),
    (c_subscriptions, m_mar26,   890,   890, v_user_id),
    (c_savings,       m_mar26,  5000,     0, v_user_id),
    (c_groceries,     m_mar26,  4500,  1870, v_user_id),
    (c_eating_out,    m_mar26,  1500,   640, v_user_id),
    (c_fuel,          m_mar26,  1800,   900, v_user_id),
    (c_transport,     m_mar26,   400,   120, v_user_id),
    (c_clothing,      m_mar26,  1000,     0, v_user_id),
    (c_entertainment, m_mar26,   800,   250, v_user_id),
    (c_misc,          m_mar26,  1200,   430, v_user_id)
  ON CONFLICT (category_id, month, user_id) DO UPDATE SET
    budget_amount = EXCLUDED.budget_amount, actual_amount = EXCLUDED.actual_amount;

  -- ===========================================================
  -- 4. INSERT INCOME SOURCES
  --    Templates live at month = '1970-01-01' (app convention).
  --    Monthly rows are the actual amounts per month.
  -- ===========================================================

  -- Income source templates (salary 25k + dividends 10k = 35k base)
  INSERT INTO incomes (source_name, month, amount, currency, description, is_template, user_id) VALUES
    ('Primary Salary',  '1970-01-01', 25000, 'ZAR', 'Monthly net salary',       true, v_user_id),
    ('Dividends',       '1970-01-01', 10000, 'ZAR', 'Investment dividends',      true, v_user_id),
    ('Freelance Work',  '1970-01-01',     0, 'ZAR', 'Contract / side projects', true, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET
    amount = EXCLUDED.amount, description = EXCLUDED.description;

  -- Monthly income actuals
  -- Freelance is sporadic and small. Some months dip into savings.
  -- Apr 2025: 25k + 10k + 3.5k freelance = 38 500  →  surplus ~3 600
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_apr25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_apr25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_apr25,  3500, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- May 2025: 25k + 10k + 0 = 35 000  →  deficit ~2 400 (overspent on clothing)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_may25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_may25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_may25,     0, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Jun 2025: 25k + 10k + 0 = 35 000  →  surplus ~700 (barely – winter electricity)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_jun25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_jun25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_jun25,     0, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Jul 2025: 25k + 10k + 1.5k = 36 500  →  deficit ~500 (peak winter bills)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_jul25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_jul25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_jul25,  1500, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Aug 2025: 25k + 10k + 0 = 35 000  →  deficit ~700
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_aug25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_aug25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_aug25,     0, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Sep 2025: 25k + 10k + 4.2k = 39 200  →  surplus ~2 700 (good freelance month)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_sep25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_sep25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_sep25,  4200, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Oct 2025: 25k + 10k + 800 = 35 800  →  deficit ~1 600
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_oct25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_oct25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_oct25,   800, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Nov 2025: 25k + 10k + 0 = 35 000  →  deficit ~5 900 (Black Friday blowout)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_nov25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_nov25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_nov25,     0, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Dec 2025: 25k + 10k + 5k bonus = 40 000  →  surplus ~2 300 (bonus rescues Xmas)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_dec25, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_dec25, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_dec25,  5000, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Jan 2026: 25k + 10k + 2.5k = 37 500  →  surplus ~1 200
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_jan26, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_jan26, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_jan26,  2500, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Feb 2026: 25k + 10k + 4k = 39 000  →  surplus ~2 200
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_feb26, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_feb26, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_feb26,  4000, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- Mar 2026: 25k + 10k + 0 = 35 000  (month in progress, no freelance yet)
  INSERT INTO incomes (source_name, month, amount, currency, is_template, user_id) VALUES
    ('Primary Salary', m_mar26, 25000, 'ZAR', false, v_user_id),
    ('Dividends',      m_mar26, 10000, 'ZAR', false, v_user_id),
    ('Freelance Work', m_mar26,     0, 'ZAR', false, v_user_id)
  ON CONFLICT (source_name, month, user_id) DO UPDATE SET amount = EXCLUDED.amount;

  -- ===========================================================
  -- 5. INSERT MONTHLY BALANCES
  -- ===========================================================

  -- Balances reflect realistic tight budget: +R2-4k good months, -R1-6k bad months
  INSERT INTO monthly_balances (month, currency, starting_balance, ending_balance, user_id) VALUES
    (m_apr25, 'ZAR',  28000,  31600, v_user_id),  -- +3 600 (freelance helped)
    (m_may25, 'ZAR',  31600,  29200, v_user_id),  -- -2 400 (overspent on clothing)
    (m_jun25, 'ZAR',  29200,  29900, v_user_id),  -- +  700 (barely survived winter)
    (m_jul25, 'ZAR',  29900,  29400, v_user_id),  -- -  500 (peak electricity)
    (m_aug25, 'ZAR',  29400,  28700, v_user_id),  -- -  700 (dipped into savings)
    (m_sep25, 'ZAR',  28700,  31400, v_user_id),  -- +2 700 (good freelance month)
    (m_oct25, 'ZAR',  31400,  29800, v_user_id),  -- -1 600 (over on eating out & fuel)
    (m_nov25, 'ZAR',  29800,  23900, v_user_id),  -- -5 900 (Black Friday blowout)
    (m_dec25, 'ZAR',  23900,  26200, v_user_id),  -- +2 300 (bonus rescued Christmas)
    (m_jan26, 'ZAR',  26200,  27400, v_user_id),  -- +1 200 (quiet month)
    (m_feb26, 'ZAR',  27400,  29600, v_user_id),  -- +2 200 (good freelance)
    (m_mar26, 'ZAR',  29600,   NULL, v_user_id);  -- month in progress

  -- ===========================================================
  -- 6. INSERT USER SETTINGS
  -- ===========================================================

  INSERT INTO user_settings (key, value, preferred_currency, user_id) VALUES
    ('base_currency',            'ZAR', 'ZAR', v_user_id),
    ('show_currency_conversion', 'false', 'ZAR', v_user_id)
  ON CONFLICT (user_id, key) DO UPDATE SET
    value              = EXCLUDED.value,
    preferred_currency = EXCLUDED.preferred_currency;

  RAISE NOTICE 'Dummy data inserted successfully for user %', v_user_id;

END $$;
