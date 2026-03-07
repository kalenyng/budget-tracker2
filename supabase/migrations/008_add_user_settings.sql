-- Create user_settings table for storing user preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO user_settings (key, value) VALUES
  ('show_currency_conversion', 'true'),
  ('base_currency', 'ZAR'),
  ('conversion_currency', 'GBP')
ON CONFLICT (key) DO NOTHING;

-- Index for settings lookup
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(key);

-- Row Level Security policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for user_settings" ON user_settings
  FOR ALL USING (true);
