# Project Scope — Shop FF (Mobile & Gadget Repair Shop)

## Overview

Shop FF is a Progressive Web App (PWA) for managing a mobile/gadget repair shop. It tracks two revenue streams — **repair labor fees** and **parts sales from inventory** — and surfaces profit metrics on a dashboard. The app is designed to be installed on Android/iOS devices and Windows desktops.

---

## Business Model

### Revenue Streams

| Stream | Description |
|--------|-------------|
| **Repair Fees** | Customer brings a broken device; shop charges a flat or variable labor fee for the repair work. |
| **Parts Sales** | Parts are sourced from the shop's inventory (panels, batteries, chips, etc.) and sold/installed into customer devices at a markup. |

### Profit Calculation

| Metric | Formula |
|--------|---------|
| **Gross Revenue** | `SUM(repairs.fee)` + `SUM(sales.qty × sales.unit_price)` |
| **COGS** (Cost of Goods Sold) | `SUM(sales.qty × sales.unit_cost)` |
| **Gross Profit** | `Gross Revenue − COGS` |
| **Net Earnings** | `Repair Fees + (Parts Revenue − COGS)` — what the shop actually takes home |
| **Net Profit** | `Gross Profit` *(v1 has no additional expense tracking)* |

> **unit_cost** is the purchase price per part snapshotted from inventory at the time of the sale, so historical profit calculations remain accurate even if the inventory price changes later.

---

## Database Schema

### Existing Table: `inventory`

Tracks all parts stocked in the shop. See [`src/docs/db.md`](../src/docs/db.md) for the full schema and SQL migration.

**Categories:** `panel`, `strip`, `mic`, `chip`, `speaker`, `battery`, `connector`, `other`

---

### Table: `repairs`

Tracks each repair job taken in by the shop.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `bigint` (identity PK) | No | auto | Auto-incrementing primary key |
| `customer_name` | `text` | Yes | — | Customer's name (optional) |
| `device` | `text` | No | — | Device description, e.g. "iPhone 13", "Samsung A54" |
| `issue` | `text` | No | — | Description of the fault/problem |
| `fee` | `numeric(10,2)` | No | `0` | Labor fee charged to the customer (PKR) |
| `notes` | `text` | Yes | — | Internal notes about the repair |
| `created_at` | `timestamptz` | No | `now()` | When the job was logged |
| `updated_at` | `timestamptz` | No | `now()` | Auto-updated on every row change |

**SQL Migration:**

```sql
CREATE TABLE repairs (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name TEXT,
  device        TEXT           NOT NULL,
  issue         TEXT           NOT NULL,
  fee           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TRIGGER set_repairs_updated_at
  BEFORE UPDATE ON repairs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_repairs_created_at ON repairs (created_at DESC);
```

---

### Table: `sales`

Tracks individual part sales/installations. Each row represents one line item (one part type, one quantity, from one repair or standalone sale).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `bigint` (identity PK) | No | auto | Auto-incrementing primary key |
| `inventory_id` | `bigint` (FK) | No | — | References `inventory.id` |
| `repair_id` | `bigint` (FK) | Yes | `NULL` | References `repairs.id` — set if sold as part of a repair |
| `qty` | `integer` | No | `1` | Number of units sold |
| `unit_cost` | `numeric(10,2)` | No | — | Purchase price per unit at time of sale (snapshot) |
| `unit_price` | `numeric(10,2)` | No | — | Selling price per unit charged to customer |
| `created_at` | `timestamptz` | No | `now()` | When the sale was recorded |

**SQL Migration:**

```sql
CREATE TABLE sales (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inventory_id BIGINT         NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
  repair_id    BIGINT         REFERENCES repairs(id) ON DELETE SET NULL,
  qty          INTEGER        NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_cost    NUMERIC(10, 2) NOT NULL,
  unit_price   NUMERIC(10, 2) NOT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_inventory_id ON sales (inventory_id);
CREATE INDEX idx_sales_repair_id ON sales (repair_id);
CREATE INDEX idx_sales_created_at ON sales (created_at DESC);
```

---

### Table: `weekly_snapshots`

Archives weekly/period earnings when the user closes a period. Acts as the **sales history** for reviewing past performance. The latest snapshot's `period_end` timestamp serves as a watermark — the dashboard only shows earnings from data created after that point.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `bigint` (identity PK) | No | auto | Auto-incrementing primary key |
| `period_start` | `timestamptz` | No | — | Start of the archived period |
| `period_end` | `timestamptz` | No | — | End of the archived period (= when the user clicked "Close Week") |
| `month` | `integer` | No | — | Calendar month (1–12) for easy filtering |
| `year` | `integer` | No | — | Calendar year for easy filtering |
| `total_revenue` | `numeric(10,2)` | No | `0` | Repair fees + parts revenue |
| `repair_fees` | `numeric(10,2)` | No | `0` | Sum of completed repair fees |
| `parts_revenue` | `numeric(10,2)` | No | `0` | Sum of parts sold × unit_price |
| `cogs` | `numeric(10,2)` | No | `0` | Sum of parts sold × unit_cost |
| `gross_profit` | `numeric(10,2)` | No | `0` | total_revenue − COGS |
| `repairs_count` | `integer` | No | `0` | Number of completed repairs |
| `sales_count` | `integer` | No | `0` | Number of sale line items |
| `created_at` | `timestamptz` | No | `now()` | When the snapshot was created |

**SQL Migration:**

```sql
CREATE TABLE weekly_snapshots (
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

CREATE INDEX idx_weekly_snapshots_period ON weekly_snapshots (year, month);
```

---

## TypeScript Types

See `src/types/database.types.ts` for all row/insert/update types:

- `InventoryRow`, `InventoryInsert`, `InventoryUpdate`
- `RepairRow`, `RepairInsert`, `RepairUpdate`
- `SaleRow`, `SaleInsert`, `SaleUpdate`
- `WeeklySnapshotRow`, `WeeklySnapshotInsert`

---

## Feature Scope

### Tab 1 — Home (Dashboard)

**Purpose:** At-a-glance financial health and activity summary for the **current period** (since last weekly close).

| Section | Content |
|---------|---------|
| **Metric Cards** | This Period Revenue, Net Earnings (repair fees + parts profit), Repair Fees, Parts Revenue, **Stock Value** (`SUM(qty_in_stock × price_per_unit)`), Parts Profit (parts revenue − COGS) |
| **Weekly Revenue Link** | Button navigates to the dedicated Revenue page |
| **Recent Repairs** | Last 5 jobs with type badge (live from Supabase) |
| **Low Stock Alerts** | Inventory items with `qty_in_stock ≤ 2` |

**Watermark system:** The dashboard queries repairs and sales created _after_ the latest `weekly_snapshots.period_end`. When the user closes a week, the watermark advances and the dashboard metrics reset to zero for the new period.

---

### Revenue Page (`/revenue`)

**Purpose:** Detailed weekly earnings breakdown for the **current month only**.

| Section | Content |
|---------|---------|
| **Month Summary** | Aggregated totals across all archived weeks + current active period |
| **Current Period Card** | Live metrics since the last archive, with a **"Close & Archive Week"** button |
| **Archived Weeks** | Reverse-chronological list of closed periods from `weekly_snapshots` |

**Close & Archive Week flow:**

1. User clicks "Close & Archive Week" on the current period card.
2. A confirmation dialog explains the action and shows the net earnings being archived.
3. On confirm: current period metrics are calculated from live `repairs` + `sales` data, a new row is inserted into `weekly_snapshots`, and the dashboard watermark advances.
4. The dashboard and revenue page refresh — the current period starts from zero.
5. Raw repair and sales records are **never deleted** — only the aggregated snapshot is saved.

---

### Tab 2 — Stock (Inventory)

**Purpose:** Manage all parts in the shop's inventory.

| Action | Description |
|--------|-------------|
| **View** | List all parts, filterable by category, searchable by name/product number |
| **Add** | Add a new part (product number, name, category, qty, price) |
| **Edit** | Update any field including stock quantity and price |
| **Delete** | Remove a part (blocked if it has associated sales records) |
| **Stock-In** | Quick increment of `qty_in_stock` (receiving new shipment) |

---

### Tab 3 — Fee (Repairs & Sales)

**Purpose:** Log repair jobs, record fees, and attach parts sold during the job.

| Action | Description |
|--------|-------------|
| **View Repairs** | List all jobs, filterable by type |
| **Add Repair** | Log a repair or labor job |
| **Edit Repair** | Update fee, optional details, and notes |
| **Attach Parts** | Link sale line items to a repair (select from inventory, set sell price) |
| **Standalone Sale** | Record a part sale not attached to a repair job |

---

### Tab 4 — Settings

**Purpose:** App-level configuration.

| Setting | Description |
|---------|-------------|
| **Theme** | Light / Dark / System |
| **Currency** | Display label (default: PKR) |
| **Low Stock Threshold** | Alert level for stock warnings (default: 2) |
| **About** | App version, data source info |

---

## Out of Scope (v1)

- User authentication / multi-user access
- Expense tracking (rent, electricity, etc.)
- Customer database / history per customer
- Invoice / receipt generation
- Barcode scanning
- Push notifications

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Vite 8 + React 19 + TypeScript |
| Database | Supabase (PostgreSQL, no RLS) |
| UI Library | shadcn/ui + Tailwind CSS v4 |
| Icons | Lucide React |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa |
