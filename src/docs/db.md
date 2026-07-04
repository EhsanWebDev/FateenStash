# Database Reference - Shop Inventory

## Overview

The database is hosted on [Supabase](https://supabase.com). The app uses `inventory` / `repairs` in production and `inventory_dev` / `repairs_dev` when `VITE_TABLE_SUFFIX=_dev`.

---

## Table: `inventory`

Stores parts stocked in the shop.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `bigint` identity PK | No | auto | Primary key |
| `product_number` | `text` | No | - | Unique product/part number |
| `name` | `text` | No | - | Part name |
| `category` | `text` | No | `'other'` | `jack`, `mic`, `speaker`, `panel`, `strip`, `other` |
| `qty_in_stock` | `integer` | No | `0` | Quantity available |
| `price_per_unit` | `numeric(10,2)` | No | - | Item price/cost in PKR |
| `created_at` | `timestamptz` | No | `now()` | Created timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Updated timestamp |

`inventory_dev` has the same shape.

---

## Table: `repairs`

Stores repair/labor jobs. A repair can attach one inventory item directly through `inventory_item_id`.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `bigint` identity PK | No | auto | Primary key |
| `fee` | `numeric(10,2)` | No | `0` | Customer charge / labor fee |
| `job_type` | `text` | No | `'repair'` | `repair` or `labor` |
| `inventory_item_id` | `bigint` FK | Yes | `null` | Attached inventory item |
| `inventory_item_qty` | `integer` | Yes | `null` | Attached quantity |
| `inventory_item_name` | `text` | Yes | `null` | Snapshot of item name when attached |
| `inventory_item_price` | `numeric(10,2)` | Yes | `null` | Snapshot of item price when attached |
| `created_at` | `timestamptz` | No | `now()` | Created timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Updated timestamp |

`repairs_dev` has the same shape, but references `inventory_dev`.

---

## Repair Inventory Attachment Migration

Run this in the Supabase SQL Editor.

```sql
begin;

-- Undo old join-table approach, if it exists.
drop table if exists public.repair_items_dev cascade;
drop table if exists public.repair_items cascade;

alter table public.repairs drop column if exists profit;
alter table public.repairs drop column if exists item_details;
alter table public.repairs drop column if exists item_price;
alter table public.repairs drop column if exists gross_profit;

alter table public.repairs_dev drop column if exists profit;
alter table public.repairs_dev drop column if exists item_details;
alter table public.repairs_dev drop column if exists item_price;
alter table public.repairs_dev drop column if exists gross_profit;

-- One attached inventory item per repair.
alter table public.repairs
  add column if not exists inventory_item_id bigint,
  add column if not exists inventory_item_qty integer,
  add column if not exists inventory_item_name text,
  add column if not exists inventory_item_price numeric(10, 2);

alter table public.repairs_dev
  add column if not exists inventory_item_id bigint,
  add column if not exists inventory_item_qty integer,
  add column if not exists inventory_item_name text,
  add column if not exists inventory_item_price numeric(10, 2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'repairs_inventory_item_id_fkey'
  ) then
    alter table public.repairs
      add constraint repairs_inventory_item_id_fkey
      foreign key (inventory_item_id)
      references public.inventory(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'repairs_dev_inventory_item_id_fkey'
  ) then
    alter table public.repairs_dev
      add constraint repairs_dev_inventory_item_id_fkey
      foreign key (inventory_item_id)
      references public.inventory_dev(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'repairs_inventory_item_qty_check'
  ) then
    alter table public.repairs
      add constraint repairs_inventory_item_qty_check
      check (inventory_item_id is null or inventory_item_qty > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'repairs_dev_inventory_item_qty_check'
  ) then
    alter table public.repairs_dev
      add constraint repairs_dev_inventory_item_qty_check
      check (inventory_item_id is null or inventory_item_qty > 0);
  end if;
end $$;

create index if not exists idx_repairs_inventory_item_id
  on public.repairs (inventory_item_id);

create index if not exists idx_repairs_dev_inventory_item_id
  on public.repairs_dev (inventory_item_id);

create or replace function public.set_repair_inventory_snapshot()
returns trigger
language plpgsql
as $$
declare
  item_name text;
  item_price numeric(10, 2);
begin
  if new.inventory_item_id is null then
    new.inventory_item_qty := null;
    new.inventory_item_name := null;
    new.inventory_item_price := null;
    return new;
  end if;

  if tg_table_name = 'repairs_dev' then
    select name, price_per_unit
    into item_name, item_price
    from public.inventory_dev
    where id = new.inventory_item_id;
  else
    select name, price_per_unit
    into item_name, item_price
    from public.inventory
    where id = new.inventory_item_id;
  end if;

  if not found then
    raise exception 'Inventory item % not found', new.inventory_item_id;
  end if;

  if tg_op = 'INSERT' then
    new.inventory_item_name := item_name;
    new.inventory_item_price := item_price;
    new.inventory_item_qty := coalesce(new.inventory_item_qty, 1);
  elsif new.inventory_item_id is distinct from old.inventory_item_id then
    new.inventory_item_name := item_name;
    new.inventory_item_price := item_price;
    new.inventory_item_qty := coalesce(new.inventory_item_qty, 1);
  end if;

  return new;
end $$;

drop trigger if exists set_repairs_inventory_snapshot on public.repairs;
create trigger set_repairs_inventory_snapshot
before insert or update of inventory_item_id, inventory_item_qty
on public.repairs
for each row
execute function public.set_repair_inventory_snapshot();

drop trigger if exists set_repairs_dev_inventory_snapshot on public.repairs_dev;
create trigger set_repairs_dev_inventory_snapshot
before insert or update of inventory_item_id, inventory_item_qty
on public.repairs_dev
for each row
execute function public.set_repair_inventory_snapshot();

commit;
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |
| `VITE_TABLE_SUFFIX` | Optional table suffix, e.g. `_dev` |

---

## TypeScript Types

Located at `src/types/database.types.ts`.

```typescript
import type {
  InventoryRow,
  InventoryInsert,
  InventoryUpdate,
  RepairRow,
  RepairInsert,
  RepairUpdate,
} from "../types/database.types"
```

---

## Usage Examples

### Attach an inventory item while creating a repair

```typescript
const { error } = await supabase.from("repairs").insert({
  job_type: "repair",
  fee: 2500,
  inventory_item_id: 42,
  inventory_item_qty: 1,
})
```

### Fetch repairs with attached item snapshots

```typescript
const { data, error } = await supabase
  .from("repairs")
  .select("id, job_type, fee, inventory_item_name, inventory_item_price, inventory_item_qty, created_at")
  .order("created_at", { ascending: false })
```

### Fetch original live inventory details

```typescript
const { data, error } = await supabase
  .from("repairs")
  .select("*, inventory:inventory_item_id(id, name, price_per_unit, qty_in_stock)")
  .eq("id", repairId)
  .single()
```
