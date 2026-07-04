-- ============================================================
-- Seed script for _dev tables — Shop FF
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- -------------------------------------------------------
-- 1. inventory_dev
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_dev (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_number  TEXT           NOT NULL UNIQUE,
  name            TEXT           NOT NULL,
  category        TEXT           NOT NULL DEFAULT 'other'
                    CHECK (category IN ('jack','mic','speaker','panel','strip','other')),
  qty_in_stock    INTEGER        NOT NULL DEFAULT 0,
  price_per_unit  NUMERIC(10, 2) NOT NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_dev_updated_at ON inventory_dev;
CREATE TRIGGER update_inventory_dev_updated_at
  BEFORE UPDATE ON inventory_dev
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

INSERT INTO inventory_dev (product_number, name, category, qty_in_stock, price_per_unit) VALUES
  ('x680-pnl',   'Infinix x680 Panel',          'panel',     2,  1720),
  ('s-a54-pnl',  'Samsung A54 Panel',            'panel',     5,  3200),
  ('ip13-pnl',   'iPhone 13 Panel (OLED)',        'panel',     3,  8500),
  ('s-a34-pnl',  'Samsung A34 Panel',            'panel',     1,  2800),
  ('ip13-bat',   'iPhone 13 Battery',            'other',     4,  2500),
  ('s-a54-bat',  'Samsung A54 Battery',          'other',     2,  1400),
  ('uni-mic-01', 'Universal Mic Chip (small)',   'mic',       10,  350),
  ('spk-8ohm',   '8Ω Earpiece Speaker',          'speaker',   7,  280),
  ('spk-loud-01','Loud Speaker (generic)',       'speaker',   1,  620),
  ('s-a54-chg',  'Samsung A54 USB-C Jack',       'jack',      1,  480),
  ('ip-ltng-01', 'iPhone Lightning Jack',        'jack',      6,  950),
  ('pm-chip-a',  'Power Management IC (Type-A)', 'other',     8, 1100)
ON CONFLICT (product_number) DO NOTHING;

-- -------------------------------------------------------
-- 2. repairs_dev
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS repairs_dev (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_type      TEXT           NOT NULL DEFAULT 'repair'
                  CHECK (job_type IN ('repair', 'labor')),
  fee           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

ALTER TABLE repairs_dev DROP COLUMN IF EXISTS customer_name;
ALTER TABLE repairs_dev DROP COLUMN IF EXISTS device;
ALTER TABLE repairs_dev DROP COLUMN IF EXISTS issue;
ALTER TABLE repairs_dev DROP COLUMN IF EXISTS notes;

DROP TRIGGER IF EXISTS set_repairs_dev_updated_at ON repairs_dev;
CREATE TRIGGER set_repairs_dev_updated_at
  BEFORE UPDATE ON repairs_dev
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_repairs_dev_created_at ON repairs_dev (created_at DESC);

INSERT INTO repairs_dev (job_type, fee, created_at) VALUES
  ('repair', 5500, now() - interval '18 days'),
  ('repair', 2000, now() - interval '15 days'),
  ('repair', 1800, now() - interval '12 days'),
  ('repair', 1500, now() - interval '10 days'),
  ('repair',  900, now() - interval '8 days'),
  ('repair',  800, now() - interval '6 days'),
  ('labor',   500, now() - interval '5 days'),
  ('repair', 2800, now() - interval '3 days'),
  ('repair',    0, now() - interval '2 days'),
  ('repair',  600, now() - interval '1 day'),
  ('repair', 2500, now())
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- 3. sales_dev  (references inventory_dev & repairs_dev by their generated IDs)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales_dev (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inventory_id BIGINT         NOT NULL,
  repair_id    BIGINT,
  qty          INTEGER        NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_cost    NUMERIC(10, 2) NOT NULL,
  unit_price   NUMERIC(10, 2) NOT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_dev_inventory_id ON sales_dev (inventory_id);
CREATE INDEX IF NOT EXISTS idx_sales_dev_repair_id    ON sales_dev (repair_id);
CREATE INDEX IF NOT EXISTS idx_sales_dev_created_at   ON sales_dev (created_at DESC);

-- Insert sales that reference the inventory and repairs rows we just created.
-- We resolve IDs dynamically so the script is safe to re-run on a fresh schema.
DO $$
DECLARE
  inv_ip13_pnl   BIGINT; inv_sa54_bat   BIGINT; inv_x680_pnl   BIGINT;
  inv_ltng       BIGINT; inv_mic        BIGINT; inv_spk_loud   BIGINT;
  rep_iphone13_1 BIGINT; rep_sa54_bat   BIGINT; rep_x680       BIGINT;
  rep_iphone13_4 BIGINT; rep_mic        BIGINT; rep_oppo       BIGINT;
BEGIN
  SELECT id INTO inv_ip13_pnl   FROM inventory_dev WHERE product_number = 'ip13-pnl';
  SELECT id INTO inv_sa54_bat   FROM inventory_dev WHERE product_number = 's-a54-bat';
  SELECT id INTO inv_x680_pnl   FROM inventory_dev WHERE product_number = 'x680-pnl';
  SELECT id INTO inv_ltng       FROM inventory_dev WHERE product_number = 'ip-ltng-01';
  SELECT id INTO inv_mic        FROM inventory_dev WHERE product_number = 'uni-mic-01';
  SELECT id INTO inv_spk_loud   FROM inventory_dev WHERE product_number = 'spk-loud-01';

  SELECT id INTO rep_iphone13_1 FROM repairs_dev ORDER BY created_at ASC OFFSET 0 LIMIT 1;
  SELECT id INTO rep_sa54_bat   FROM repairs_dev ORDER BY created_at ASC OFFSET 1 LIMIT 1;
  SELECT id INTO rep_x680       FROM repairs_dev ORDER BY created_at ASC OFFSET 2 LIMIT 1;
  SELECT id INTO rep_iphone13_4 FROM repairs_dev ORDER BY created_at ASC OFFSET 3 LIMIT 1;
  SELECT id INTO rep_mic        FROM repairs_dev ORDER BY created_at ASC OFFSET 4 LIMIT 1;
  SELECT id INTO rep_oppo       FROM repairs_dev ORDER BY created_at ASC OFFSET 5 LIMIT 1;

  INSERT INTO sales_dev (inventory_id, repair_id, qty, unit_cost, unit_price, created_at) VALUES
    (inv_ip13_pnl,  rep_iphone13_1, 1, 8500, 10000, now() - interval '18 days'),
    (inv_sa54_bat,  rep_sa54_bat,   1, 1400,  2000, now() - interval '15 days'),
    (inv_x680_pnl,  rep_x680,       1, 1720,  2200, now() - interval '12 days'),
    (inv_ltng,      rep_iphone13_4, 1,  950,  1500, now() - interval '10 days'),
    (inv_mic,       rep_mic,        1,  350,   900, now() - interval '8 days'),
    (inv_spk_loud,  rep_oppo,       1,  620,   800, now() - interval '6 days'),
    -- Standalone sale (no repair)
    (inv_ip13_pnl,  NULL,           1, 8500,  9800, now() - interval '4 days');
END $$;

-- -------------------------------------------------------
-- 4. weekly_snapshots_dev  (2 archived weeks earlier this month)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_snapshots_dev (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  period_start   TIMESTAMPTZ    NOT NULL,
  period_end     TIMESTAMPTZ    NOT NULL,
  month          INTEGER        NOT NULL,
  year           INTEGER        NOT NULL,
  total_revenue  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  repair_fees    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  parts_revenue  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cogs           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  gross_profit   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  repairs_count  INTEGER        NOT NULL DEFAULT 0,
  sales_count    INTEGER        NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_dev_period ON weekly_snapshots_dev (year, month);

-- Week 1 of this month (days 1–7)
INSERT INTO weekly_snapshots_dev
  (period_start, period_end, month, year, total_revenue, repair_fees, parts_revenue, cogs, gross_profit, repairs_count, sales_count)
VALUES (
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '7 days',
  EXTRACT(MONTH FROM now())::int,
  EXTRACT(YEAR  FROM now())::int,
  19700, 7300, 12400, 10450, 9250, 3, 3
);

-- Week 2 of this month (days 7–14)
INSERT INTO weekly_snapshots_dev
  (period_start, period_end, month, year, total_revenue, repair_fees, parts_revenue, cogs, gross_profit, repairs_count, sales_count)
VALUES (
  date_trunc('month', now()) + interval '7 days',
  date_trunc('month', now()) + interval '14 days',
  EXTRACT(MONTH FROM now())::int,
  EXTRACT(YEAR  FROM now())::int,
  14500, 5700, 8800, 7270, 7230, 3, 3
);
