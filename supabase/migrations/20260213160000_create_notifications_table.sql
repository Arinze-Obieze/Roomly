-- Create notifications table
create table if not exists public.notifications (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('message', 'inquiry', 'match', 'system', 'security')),
    title text not null,
    message text not null,
    link text,
    is_read boolean not null default false,
    created_at timestamptz not null default now(),
    data jsonb default '{}'::jsonb,
    
    constraint notifications_pkey primary key (id)
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

-- Indexes
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);

-- Trigger to update updated_at if we had one, but we don't.
-- Optional: Trigger to clean up old notifications? Not for now.

-- Grant access to authenticated users
grant select, update on public.notifications to authenticated;
grant insert on public.notifications to service_role; -- Only system/triggers should insert usually, but strictly maybe authenticated for testing
grant insert on public.notifications to authenticated; -- Allow inserts for now for testing/triggers
