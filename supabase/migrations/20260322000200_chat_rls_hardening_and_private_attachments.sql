-- Hardening for chat RLS + private attachment buckets.
-- This is a follow-up migration to 20260322000100_chat_contact_gating_rls.sql.

do $$
begin
  if to_regclass('public.conversations') is null then
    raise notice 'Table public.conversations not found; skipping chat hardening migration.';
    return;
  end if;
  if to_regclass('public.messages') is null then
    raise notice 'Table public.messages not found; skipping chat hardening migration.';
    return;
  end if;
end $$;

-- Ensure RLS is enabled (idempotent)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ── Policy hardening ──────────────────────────────────────────────────────
-- 1) Ensure tenant cannot set host_id arbitrarily on insert. Host must match property owner.
drop policy if exists conversations_insert_contact_gated on public.conversations;
create policy conversations_insert_contact_gated
on public.conversations
for insert
with check (
  tenant_id = auth.uid()
  and host_id = (
    select p.listed_by_user_id
    from public.properties p
    where p.id = conversations.property_id
  )
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
);

-- 2) Restrict message editing window and disallow editing attachment messages.
drop policy if exists messages_update_sender on public.messages;
create policy messages_update_sender
on public.messages
for update
using (
  sender_id = auth.uid()
  and attachment_type is null
  and created_at > (now() - interval '15 minutes')
)
with check (sender_id = auth.uid());

-- 3) Column-level UPDATE privileges to prevent participants from mutating identity/ownership columns.
do $$
begin
  -- conversations: only allow updating archived_by from the client role
  execute 'revoke update on public.conversations from anon, authenticated';
  execute 'grant update (archived_by) on public.conversations to authenticated';

  -- messages: only allow updating editable fields from the client role
  execute 'revoke update on public.messages from anon, authenticated';
  execute 'grant update (content, is_edited, edited_at) on public.messages to authenticated';
exception when others then
  -- In some environments the roles may differ; fail safe by doing nothing.
  raise notice 'Skipping GRANT/REVOKE adjustments: %', sqlerrm;
end $$;

-- ── Indexes (non-concurrent for Supabase migrations) ───────────────────────
create index if not exists idx_messages_conversation_created_at
  on public.messages (conversation_id, created_at desc);

create index if not exists idx_conversations_tenant_last_message_at
  on public.conversations (tenant_id, last_message_at desc);

create index if not exists idx_conversations_host_last_message_at
  on public.conversations (host_id, last_message_at desc);

-- Optional (recommended): add uniqueness on (property_id, tenant_id) once you've
-- verified there are no existing duplicates in production.
create index if not exists idx_conversations_property_tenant
  on public.conversations (property_id, tenant_id);

-- ── RPC: Fast unread count (avoids scanning messages) ─────────────────────
create or replace function public.get_chat_unread_count()
returns integer
language sql
stable
as $$
  select coalesce(sum(
    case
      when c.tenant_id = auth.uid() then coalesce(c.unread_count_tenant, 0)
      when c.host_id = auth.uid() then coalesce(c.unread_count_host, 0)
      else 0
    end
  ), 0)::int
  from public.conversations c
  where c.tenant_id = auth.uid() or c.host_id = auth.uid();
$$;

do $$
begin
  execute 'grant execute on function public.get_chat_unread_count() to authenticated';
exception when others then
  raise notice 'Skipping GRANT execute on get_chat_unread_count(): %', sqlerrm;
end $$;

-- ── Storage buckets: make sensitive attachments private ────────────────────
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage.buckets not found; skipping bucket privacy changes.';
    return;
  end if;

  update storage.buckets
     set public = false
   where id in ('message_attachments', 'buddy_attachments', 'support_attachments');
end $$;
