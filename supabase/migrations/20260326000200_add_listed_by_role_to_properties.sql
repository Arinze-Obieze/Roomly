do $$
begin
  if to_regclass('public.properties') is null then
    raise notice 'Table public.properties not found; skipping listed_by_role migration.';
    return;
  end if;
end $$;

alter table public.properties
  add column if not exists listed_by_role text;

update public.properties
set listed_by_role = coalesce(listed_by_role, 'live_out_landlord')
where listed_by_role is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_listed_by_role_check'
  ) then
    alter table public.properties
      add constraint properties_listed_by_role_check
      check (listed_by_role in ('live_in_landlord', 'live_out_landlord', 'current_tenant', 'agent'))
      not valid;
  end if;
end $$;

alter table public.properties
  validate constraint properties_listed_by_role_check;
