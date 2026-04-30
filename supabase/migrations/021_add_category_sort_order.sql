-- Add sort_order column to categories for user-defined ordering
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Backfill sort_order based on the existing display order (category_group, type, name)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        category_group ASC NULLS LAST,
        type DESC,
        name ASC
    ) - 1 AS rn
  FROM categories
)
UPDATE categories
SET sort_order = ranked.rn
FROM ranked
WHERE categories.id = ranked.id;

-- Add index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_categories_user_sort ON categories (user_id, sort_order ASC);
