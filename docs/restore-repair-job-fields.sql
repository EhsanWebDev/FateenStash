begin;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['repairs', 'repairs_dev'] loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format('alter table public.%I add column if not exists fee numeric(10, 2) not null default 0', table_name);
    execute format('alter table public.%I add column if not exists gross_profit numeric(10, 2) not null default 0', table_name);
    execute format('alter table public.%I add column if not exists item_price numeric(10, 2) not null default 0', table_name);
    execute format('alter table public.%I add column if not exists item_details text', table_name);
    execute format(
      'alter table public.%I add column if not exists profit numeric(10, 2) generated always as (gross_profit - item_price) stored',
      table_name
    );

    execute format(
      'update public.%I
       set gross_profit = fee
       where gross_profit = 0 and fee > 0',
      table_name
    );

    execute format(
      'update public.%I
       set fee = gross_profit
       where fee = 0 and gross_profit > 0',
      table_name
    );
  end loop;
end $$;

commit;
