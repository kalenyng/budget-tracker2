-- Add category_group column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_group TEXT;

-- Create index for category_group
CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(category_group);

-- Update existing subscription categories to be grouped
UPDATE categories SET category_group = 'Subscriptions' 
WHERE name IN ('ChatGPT', 'Microsoft', 'Netflix', 'Mobile Data');
