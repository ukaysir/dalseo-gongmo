create extension if not exists "pgcrypto";

create table if not exists public.impact_items (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  source_id text,
  title text not null,
  category text not null check (
    category in (
      'traffic',
      'construction',
      'urban_plan',
      'council',
      'public_notice',
      'event',
      'safety',
      'parking',
      'heat',
      'facility',
      'welfare',
      'environment'
    )
  ),
  source_name text not null,
  source_url text not null,
  source_type text,
  source_status text,
  address text not null,
  dong text not null,
  lat double precision not null,
  lng double precision not null,
  starts_at date,
  ends_at date,
  opinion_due_at date,
  summary text not null,
  plain_summary text not null,
  impacts text[] not null default '{}',
  action_guide text not null,
  department text not null,
  contact text not null,
  impact_radius_m integer,
  location_confidence text,
  summary_confidence text,
  urgency text,
  raw_text_path text,
  collected_at timestamptz,
  is_demo boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists impact_items_updated_at_idx
  on public.impact_items (updated_at desc);

create index if not exists impact_items_category_idx
  on public.impact_items (category);

create index if not exists impact_items_dong_idx
  on public.impact_items (dong);

create index if not exists impact_items_source_id_idx
  on public.impact_items (source_id);

alter table public.impact_items enable row level security;

drop policy if exists "Public impact items are readable" on public.impact_items;

create policy "Public impact items are readable"
  on public.impact_items
  for select
  using (true);

create table if not exists public.sources (
  id text primary key,
  name text not null,
  url text not null,
  kind text not null,
  category text not null check (
    category in (
      'traffic',
      'construction',
      'urban_plan',
      'council',
      'public_notice',
      'event',
      'safety',
      'parking',
      'heat',
      'facility',
      'welfare',
      'environment'
    )
  ),
  priority text check (priority in ('high', 'medium', 'low')),
  expected_fields text[] default '{}',
  collection_risk text,
  make_collected_item boolean not null default false,
  status integer,
  source_status text,
  error_message text,
  raw_file text,
  title text,
  text_preview text,
  collected_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists sources_collected_at_idx
  on public.sources (collected_at desc);

create index if not exists sources_category_idx
  on public.sources (category);

alter table public.sources enable row level security;

drop policy if exists "Public sources are readable" on public.sources;

create policy "Public sources are readable"
  on public.sources
  for select
  using (true);

create table if not exists public.collection_reports (
  id text primary key,
  report jsonb not null,
  collected_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.collection_reports enable row level security;

drop policy if exists "Public collection reports are readable" on public.collection_reports;

create policy "Public collection reports are readable"
  on public.collection_reports
  for select
  using (true);
