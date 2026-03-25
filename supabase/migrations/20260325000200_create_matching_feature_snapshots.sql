create table if not exists public.matching_user_features (
  user_id uuid primary key
    references public.users(id) on delete cascade,
  profile_completion_state text not null default 'missing'
    check (profile_completion_state in ('missing', 'partial', 'complete')),
  has_lifestyle boolean not null default false,
  has_preferences boolean not null default false,
  privacy_setting text not null default 'public'
    check (privacy_setting in ('public', 'private')),
  current_city_normalized text null,
  budget_min numeric null,
  budget_max numeric null,
  preferred_property_types text[] not null default '{}',
  interests text[] not null default '{}',
  schedule_type text null,
  cleanliness_level integer null,
  social_level integer null,
  noise_tolerance integer null,
  age_years integer null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_matching_user_features_completion
  on public.matching_user_features (profile_completion_state);

create index if not exists idx_matching_user_features_city
  on public.matching_user_features (current_city_normalized);

create table if not exists public.matching_property_features (
  property_id uuid primary key
    references public.properties(id) on delete cascade,
  host_user_id uuid not null
    references public.users(id) on delete cascade,
  approval_status text null,
  is_active boolean not null default false,
  is_private boolean not null default false,
  city_normalized text null,
  state_normalized text null,
  price_per_month numeric null,
  price_band text null
    check (price_band in ('budget', 'mid', 'premium') or price_band is null),
  property_type text null,
  offering_type text null,
  available_from date null,
  media_count integer not null default 0,
  has_media boolean not null default false,
  host_schedule_type text null,
  host_interests text[] not null default '{}',
  freshness_bucket text null
    check (freshness_bucket in ('new', 'warm', 'stale') or freshness_bucket is null),
  updated_at timestamptz not null default now()
);

create index if not exists idx_matching_property_features_host
  on public.matching_property_features (host_user_id);

create index if not exists idx_matching_property_features_status
  on public.matching_property_features (approval_status, is_active);

create index if not exists idx_matching_property_features_city
  on public.matching_property_features (city_normalized);

comment on table public.matching_user_features is
  'Precomputed user-level matching features for fast discovery and future ML feature export.';

comment on table public.matching_property_features is
  'Precomputed property-level matching features for fast discovery, candidate generation, and future ML feature export.';
