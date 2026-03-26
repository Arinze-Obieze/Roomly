-- Persist the conversation initiator so Sent/Received tab logic does not
-- depend on inferring from the first message at read time.

do $$
begin
  if to_regclass('public.conversations') is null then
    raise notice 'Table public.conversations not found; skipping started_by_user_id migration.';
    return;
  end if;
end $$;

alter table public.conversations
  add column if not exists started_by_user_id uuid references public.users(id) on delete set null;

alter table public.conversations
  add column if not exists last_message_sender_id uuid references public.users(id) on delete set null;

with first_messages as (
  select distinct on (m.conversation_id)
    m.conversation_id,
    m.sender_id
  from public.messages m
  order by m.conversation_id, m.created_at asc, m.id asc
),
last_messages as (
  select distinct on (m.conversation_id)
    m.conversation_id,
    m.sender_id
  from public.messages m
  order by m.conversation_id, m.created_at desc, m.id desc
)
update public.conversations c
set
  started_by_user_id = coalesce(c.started_by_user_id, fm.sender_id),
  last_message_sender_id = coalesce(c.last_message_sender_id, lm.sender_id)
from first_messages fm
left join last_messages lm on lm.conversation_id = fm.conversation_id
where c.id = fm.conversation_id;

update public.conversations
set started_by_user_id = tenant_id
where started_by_user_id is null
  and tenant_id is not null;

create index if not exists idx_conversations_started_by_user_id
  on public.conversations (started_by_user_id);
