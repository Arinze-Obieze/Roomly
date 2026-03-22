-- Enforce "contact gating" for chats:
-- - tenant can start a conversation only if:
--     (a) they have an accepted interest for that property, OR
--     (b) property is public AND their compatibility score >= 51
--
-- Also adds baseline SELECT/INSERT policies so the app can continue to use
-- Supabase client-side writes safely.

do $$
begin
  if to_regclass('public.conversations') is null then
    raise notice 'Table public.conversations not found; skipping chat RLS migration.';
    return;
  end if;
  if to_regclass('public.messages') is null then
    raise notice 'Table public.messages not found; skipping chat RLS migration.';
    return;
  end if;
end $$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Helper predicate embedded into policies via EXISTS.

do $$
begin
  -- conversations: participants can read
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_select_participants'
  ) then
    execute $p$
      create policy conversations_select_participants
      on public.conversations
      for select
      using (tenant_id = auth.uid() or host_id = auth.uid())
    $p$;
  end if;

  -- conversations: tenant can insert only when contact is allowed
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_insert_contact_gated'
  ) then
    if to_regclass('public.property_interests') is null
      or to_regclass('public.compatibility_scores') is null
      or to_regclass('public.properties') is null then
      raise notice 'Missing dependency tables for contact gating; skipping conversations_insert_contact_gated policy.';
    else
    execute $p$
      create policy conversations_insert_contact_gated
      on public.conversations
      for insert
      with check (
        tenant_id = auth.uid()
        and (
          exists (
            select 1
            from public.property_interests pi
            where pi.seeker_id = auth.uid()
              and pi.property_id = conversations.property_id
              and pi.status = 'accepted'
          )
          or exists (
            select 1
            from public.properties p
            join public.compatibility_scores cs
              on cs.property_id = p.id
             and cs.seeker_id = auth.uid()
            where p.id = conversations.property_id
              and (p.is_public is true)
              and (p.privacy_setting is distinct from 'private')
              and cs.score >= 51
          )
        )
      )
    $p$;
    end if;
  end if;

  -- conversations: participants can update (e.g., archive/unarchive)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'conversations' and policyname = 'conversations_update_participants'
  ) then
    execute $p$
      create policy conversations_update_participants
      on public.conversations
      for update
      using (tenant_id = auth.uid() or host_id = auth.uid())
      with check (tenant_id = auth.uid() or host_id = auth.uid())
    $p$;
  end if;

  -- messages: participants can read
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_select_participants'
  ) then
    execute $p$
      create policy messages_select_participants
      on public.messages
      for select
      using (
        exists (
          select 1
          from public.conversations c
          where c.id = messages.conversation_id
            and (c.tenant_id = auth.uid() or c.host_id = auth.uid())
        )
      )
    $p$;
  end if;

  -- messages: participants can insert; sender must be current user
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_insert_participants'
  ) then
    execute $p$
      create policy messages_insert_participants
      on public.messages
      for insert
      with check (
        sender_id = auth.uid()
        and exists (
          select 1
          from public.conversations c
          where c.id = messages.conversation_id
            and (c.tenant_id = auth.uid() or c.host_id = auth.uid())
        )
      )
    $p$;
  end if;

  -- messages: sender can update their own message (edit)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_update_sender'
  ) then
    execute $p$
      create policy messages_update_sender
      on public.messages
      for update
      using (sender_id = auth.uid())
      with check (sender_id = auth.uid())
    $p$;
  end if;
end $$;
