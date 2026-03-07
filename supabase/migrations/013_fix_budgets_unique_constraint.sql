-- Fix budgets table unique constraint to include user_id
-- This allows multiple users to have budgets for the same category/month

-- Drop all possible old unique constraints (PostgreSQL auto-names them)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'budgets'
        AND constraint_type = 'UNIQUE'
        AND constraint_name NOT LIKE '%user%'
    ) LOOP
        EXECUTE 'ALTER TABLE budgets DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add new unique constraint that includes user_id
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_month_user_unique;
ALTER TABLE budgets ADD CONSTRAINT budgets_category_month_user_unique UNIQUE (category_id, month, user_id);
