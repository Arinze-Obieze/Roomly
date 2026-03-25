-- Person-to-person interest workflow for find-people and private profile discovery.
-- This complements property_interests instead of overloading it.
--
-- Why a separate table:
-- - property_interests is seeker -> property only
-- - find-people needs user -> user interest records
-- - host -> seeker and seeker -> host should both be representable
-- - the interests dashboard can later merge both property and person interests cleanly

create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_people_interest_update_rules()
returns trigger
language plpgsql
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if new.interest_kind <> old.interest_kind
     or new.initiator_user_id <> old.initiator_user_id
     or new.target_user_id <> old.target_user_id
     or new.context_property_id is distinct from old.context_property_id
     or new.compatibility_score is distinct from old.compatibility_score
     or new.source_surface <> old.source_surface
     or new.created_at <> old.created_at then
    raise exception 'Immutable people interest fields cannot be changed';
  end if;

  if actor_id = old.target_user_id then
    if new.status <> old.status then
      if old.status <> 'pending' then
        raise exception 'Only pending people interests can be decided';
      end if;
      if new.status not in ('accepted', 'rejected') then
        raise exception 'Targets may only accept or reject a people interest';
      end if;
      new.acted_at = coalesce(new.acted_at, now());
      new.acted_by_user_id = actor_id;
      if new.status = 'accepted' then
        new.reveal_state = 'revealed';
      end if;
    end if;
    return new;
  end if;

  if actor_id = old.initiator_user_id then
    if new.status = old.status and new.message is not distinct from old.message and new.reveal_state = old.reveal_state then
      return new;
    end if;

    if old.status <> 'pending' then
      raise exception 'Only pending people interests can be withdrawn';
    end if;
    if new.status <> 'withdrawn' then
      raise exception 'Initiators may only withdraw their people interest';
    end if;
    if new.message is distinct from old.message or new.reveal_state <> old.reveal_state then
      raise exception 'Initiators may not edit message or reveal state during withdrawal';
    end if;
    new.acted_at = coalesce(new.acted_at, now());
    new.acted_by_user_id = actor_id;
    return new;
  end if;

  raise exception 'Unauthorized people interest update';
end;
$$;

create table if not exists public.people_interests (
  id uuid primary key default gen_random_uuid(),
  interest_kind text not null
    check (interest_kind in ('host_to_seeker', 'seeker_to_host', 'buddy')),
  initiator_user_id uuid not null
    references public.users(id) on delete cascade,
  target_user_id uuid not null
    references public.users(id) on delete cascade,
  context_property_id uuid null
    references public.properties(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  compatibility_score numeric(5,2) null
    check (compatibility_score is null or (compatibility_score >= 0 and compatibility_score <= 100)),
  message text null,
  source_surface text not null default 'find_people',
  reveal_state text not null default 'blurred'
    check (reveal_state in ('blurred', 'revealed')),
  acted_by_user_id uuid null
    references public.users(id) on delete set null,
  acted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_interests_no_self_interest
    check (initiator_user_id <> target_user_id),
  constraint people_interests_host_requires_property
    check (
      interest_kind <> 'host_to_seeker'
      or context_property_id is not null
    )
);

create unique index if not exists people_interests_unique_with_property
  on public.people_interests (interest_kind, initiator_user_id, target_user_id, context_property_id)
  where context_property_id is not null;

create unique index if not exists people_interests_unique_without_property
  on public.people_interests (interest_kind, initiator_user_id, target_user_id)
  where context_property_id is null;

create index if not exists idx_people_interests_target_created_at
  on public.people_interests (target_user_id, created_at desc);

create index if not exists idx_people_interests_initiator_created_at
  on public.people_interests (initiator_user_id, created_at desc);

create index if not exists idx_people_interests_property
  on public.people_interests (context_property_id)
  where context_property_id is not null;

drop trigger if exists set_people_interests_updated_at on public.people_interests;
create trigger set_people_interests_updated_at
before update on public.people_interests
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists enforce_people_interest_update_rules on public.people_interests;
create trigger enforce_people_interest_update_rules
before update on public.people_interests
for each row
execute function public.enforce_people_interest_update_rules();

alter table public.people_interests enable row level security;

drop policy if exists people_interests_select_participants on public.people_interests;
create policy people_interests_select_participants
on public.people_interests
for select
using (
  initiator_user_id = auth.uid()
  or target_user_id = auth.uid()
);

drop policy if exists people_interests_insert_initiator on public.people_interests;
create policy people_interests_insert_initiator
on public.people_interests
for insert
with check (
  initiator_user_id = auth.uid()
  and target_user_id <> auth.uid()
  and (
    interest_kind <> 'host_to_seeker'
    or exists (
      select 1
      from public.properties p
      where p.id = people_interests.context_property_id
        and p.listed_by_user_id = auth.uid()
        and p.is_active is true
        and p.approval_status = 'approved'
    )
  )
);

drop policy if exists people_interests_update_target on public.people_interests;
create policy people_interests_update_target
on public.people_interests
for update
using (
  target_user_id = auth.uid()
)
with check (
  target_user_id = auth.uid()
);

drop policy if exists people_interests_update_initiator_withdraw on public.people_interests;
create policy people_interests_update_initiator_withdraw
on public.people_interests
for update
using (
  initiator_user_id = auth.uid()
)
with check (
  initiator_user_id = auth.uid()
);

do $$
begin
  execute 'grant select, insert, update on public.people_interests to authenticated';
exception when others then
  raise notice 'Skipping GRANT on public.people_interests: %', sqlerrm;
end $$;

comment on table public.people_interests is
  'User-to-user interests for find-people, private-profile reveal flow, and future buddy/host-seeker matching.';
