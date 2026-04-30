-- Purge all app data for a single user without changing schema.
-- Target user: ed11f90b-a20f-451c-8c09-2cd85a2caf65

DO $$
DECLARE
  target_user_id UUID := 'ed11f90b-a20f-451c-8c09-2cd85a2caf65'::uuid;
  r RECORD;
  deleted_rows BIGINT;
BEGIN
  -- Delete from every public table that has a user_id column.
  -- This keeps table structure intact and works for future user-scoped tables too.
  FOR r IN
    SELECT
      c.table_schema,
      c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    EXECUTE format(
      'DELETE FROM %I.%I WHERE user_id = $1',
      r.table_schema,
      r.table_name
    ) USING target_user_id;

    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    RAISE NOTICE 'Deleted % rows from %.%', deleted_rows, r.table_schema, r.table_name;
  END LOOP;

  -- Optional: remove the auth user as well.
  -- Uncomment if you want the account itself removed, not just app data.
  -- DELETE FROM auth.users WHERE id = target_user_id;
END $$;
