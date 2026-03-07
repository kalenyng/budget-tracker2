-- Fix the trigger function to ensure monthly_amount is always 0 for new users
CREATE OR REPLACE FUNCTION setup_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Create basic categories for the new user with monthly_amount = 0
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
