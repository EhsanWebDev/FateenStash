begin;

create table if not exists public.out_of_stock_items (
  inventory_id bigint primary key references public.inventory(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  qty_in_stock integer not null default 0,
  price_per_unit numeric(10, 2) not null,
  went_out_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.out_of_stock_items_dev (
  inventory_id bigint primary key references public.inventory_dev(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  qty_in_stock integer not null default 0,
  price_per_unit numeric(10, 2) not null,
  went_out_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_out_of_stock_items_went_out_at
  on public.out_of_stock_items (went_out_at);

create index if not exists idx_out_of_stock_items_dev_went_out_at
  on public.out_of_stock_items_dev (went_out_at);

create or replace function public.track_out_of_stock_items()
returns trigger
language plpgsql
as $$
declare
  target_table text := case when tg_table_name = 'inventory_dev'
    then 'out_of_stock_items_dev'
    else 'out_of_stock_items'
  end;
begin
  execute format('delete from public.%I where went_out_at < now() - interval ''3 months''', target_table);

  if new.qty_in_stock > 0 then
    execute format('delete from public.%I where inventory_id = $1', target_table)
    using new.id;
    return new;
  end if;

  execute format(
    'insert into public.%I (inventory_id, name, category, qty_in_stock, price_per_unit, went_out_at, updated_at)
     values ($1, $2, $3, $4, $5, now(), now())
     on conflict (inventory_id) do update set
       name = excluded.name,
       category = excluded.category,
       qty_in_stock = excluded.qty_in_stock,
       price_per_unit = excluded.price_per_unit,
       updated_at = now()',
    target_table
  )
  using new.id, new.name, new.category, new.qty_in_stock, new.price_per_unit;

  return new;
end $$;

drop trigger if exists track_inventory_out_of_stock on public.inventory;
create trigger track_inventory_out_of_stock
after insert or update of name, category, qty_in_stock, price_per_unit
on public.inventory
for each row
execute function public.track_out_of_stock_items();

drop trigger if exists track_inventory_dev_out_of_stock on public.inventory_dev;
create trigger track_inventory_dev_out_of_stock
after insert or update of name, category, qty_in_stock, price_per_unit
on public.inventory_dev
for each row
execute function public.track_out_of_stock_items();

insert into public.out_of_stock_items (inventory_id, name, category, qty_in_stock, price_per_unit, went_out_at, updated_at)
select id, name, category, qty_in_stock, price_per_unit, updated_at, updated_at
from public.inventory
where qty_in_stock = 0
on conflict (inventory_id) do nothing;

insert into public.out_of_stock_items_dev (inventory_id, name, category, qty_in_stock, price_per_unit, went_out_at, updated_at)
select id, name, category, qty_in_stock, price_per_unit, updated_at, updated_at
from public.inventory_dev
where qty_in_stock = 0
on conflict (inventory_id) do nothing;

delete from public.out_of_stock_items where went_out_at < now() - interval '3 months';
delete from public.out_of_stock_items_dev where went_out_at < now() - interval '3 months';

commit;
