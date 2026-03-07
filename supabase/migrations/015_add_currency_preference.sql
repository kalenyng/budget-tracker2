-- Add preferred_currency column to user_settings table
-- This stores the user's preferred currency for display throughout the app
-- Since user_settings uses key-value pairs with (user_id, key) unique constraint,
-- we'll add preferred_currency as a column that can be set on any row for a user.
-- When querying, we'll get the first row with preferred_currency set for that user.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT;

-- Set default for existing rows
UPDATE user_settings
SET preferred_currency = 'ZAR'
WHERE preferred_currency IS NULL;

-- Now make it NOT NULL with default
ALTER TABLE user_settings
  ALTER COLUMN preferred_currency SET NOT NULL,
  ALTER COLUMN preferred_currency SET DEFAULT 'ZAR';

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_preferred_currency ON user_settings(user_id, preferred_currency);

-- Note: Application code should set preferred_currency when creating/updating user_settings rows
-- When querying, use: SELECT DISTINCT ON (user_id) preferred_currency FROM user_settings WHERE user_id = ... ORDER BY user_id
