-- First, ensure user_id column exists (migration 010 should have added it, but just in case)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Handle any existing categories with NULL user_id
-- Instead of deleting, we'll assign them to the specific user (af80ffde-ac95-4457-81bf-4bc44d5b84e6)
-- This preserves existing data. If you want to delete them instead, change this line.
-- Note: This only runs if there are categories with NULL user_id
UPDATE categories 
SET user_id = 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'::uuid 
WHERE user_id IS NULL 
AND EXISTS (SELECT 1 FROM auth.users WHERE id = 'af80ffde-ac95-4457-81bf-4bc44d5b84e6'::uuid);

-- Drop the old unique constraint on name (if it exists)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Drop the new constraint if it already exists (in case migration was partially run)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_user_id_unique;

-- Add a new unique constraint on (name, user_id) so names are unique per user
-- Note: This will fail if there are duplicate (name, user_id) pairs, but that shouldn't happen
ALTER TABLE categories ADD CONSTRAINT categories_name_user_id_unique UNIQUE (name, user_id);

-- Function to create basic categories for new users (with monthly_amount = 0)
CREATE OR REPLACE FUNCTION setup_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Create basic categories for the new user with monthly_amount = 0
  -- Use a loop to handle each category individually to avoid constraint issues
  INSERT INTO categories (name, monthly_amount, type, currency, category_group, user_id) VALUES
    ('Rent', 0, 'fixed', 'ZAR', NULL, NEW.id),
    ('Medical Aid', 0, 'fixed', 'ZAR', NULL, NEW.id),
    ('Gym', 0, 'fixed', 'ZAR', NULL, NEW.id),
    ('Electricity', 0, 'fixed', 'ZAR', NULL, NEW.id),
    ('Water', 0, 'fixed', 'ZAR', NULL, NEW.id),
    ('Subscriptions', 0, 'fixed', 'ZAR', NULL, NEW.id),
    ('Groceries', 0, 'variable', 'ZAR', NULL, NEW.id),
    ('Eating Out', 0, 'variable', 'ZAR', NULL, NEW.id),
    ('Fuel', 0, 'variable', 'ZAR', NULL, NEW.id),
    ('Transport (Uber/Bolt)', 0, 'variable', 'ZAR', NULL, NEW.id),
    ('Clothing', 0, 'variable', 'ZAR', NULL, NEW.id),
    ('Misc / Cash', 0, 'variable', 'ZAR', NULL, NEW.id)
  ON CONFLICT (name, user_id) DO UPDATE SET
    monthly_amount = 0;  -- Force monthly_amount to 0 even if category exists
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating categories for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create categories when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION setup_new_user_categories();
