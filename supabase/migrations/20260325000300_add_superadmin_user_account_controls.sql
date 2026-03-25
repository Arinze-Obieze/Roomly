alter table public.users
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  add column if not exists suspended_at timestamptz null,
  add column if not exists suspended_by_user_id uuid null
    references public.users(id) on delete set null,
  add column if not exists suspension_reason text null;

create index if not exists idx_users_account_status
  on public.users (account_status);

comment on column public.users.account_status is
  'Canonical account lifecycle status used by superadmin controls. active users can use the app; suspended users are blocked.';

comment on column public.users.suspended_at is
  'Timestamp when a superadmin suspended this account.';

comment on column public.users.suspended_by_user_id is
  'Superadmin who suspended this account.';

comment on column public.users.suspension_reason is
  'Human-readable reason for the suspension for audit and support follow-up.';

