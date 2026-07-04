-- Simpler Job Sales UX migration
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
  table_name text;
  constraint_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['repairs', 'repairs_dev'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS job_type TEXT NOT NULL DEFAULT ''repair''', table_name);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) NOT NULL DEFAULT 0', table_name);
    EXECUTE format('UPDATE %I SET job_type = ''repair'' WHERE job_type IS NULL', table_name);
    EXECUTE format('DROP INDEX IF EXISTS idx_%I_status', table_name);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS status', table_name);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS customer_name', table_name);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS device', table_name);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS issue', table_name);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS notes', table_name);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = to_regclass(format('public.%I', table_name))
        AND conname = table_name || '_job_type_check'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I CHECK (job_type IN (''repair'', ''labor''))',
        table_name,
        table_name || '_job_type_check'
      );
    END IF;
  END LOOP;

  FOREACH table_name IN ARRAY ARRAY['inventory', 'inventory_dev'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    FOR constraint_name IN
      SELECT c.conname
      FROM pg_constraint c
      WHERE c.conrelid = to_regclass(format('public.%I', table_name))
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%category%'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', table_name, constraint_name);
    END LOOP;

    EXECUTE format(
      'UPDATE %I
       SET category = CASE
         WHEN category = ''connector'' THEN ''jack''
         WHEN category IN (''panel'', ''strip'', ''mic'', ''speaker'') THEN category
         ELSE ''other''
       END',
      table_name
    );

    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I CHECK (category IN (''jack'', ''mic'', ''speaker'', ''panel'', ''strip'', ''other''))',
      table_name,
      table_name || '_category_check'
    );
  END LOOP;
END $$;
