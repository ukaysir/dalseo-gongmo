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

insert into public.impact_items (
  external_id,
  title,
  category,
  source_name,
  source_url,
  address,
  dong,
  lat,
  lng,
  starts_at,
  ends_at,
  opinion_due_at,
  summary,
  plain_summary,
  impacts,
  action_guide,
  department,
  contact
)
values
  (
    'sample-urban-1',
    '월성권 생활도로 정비 도시관리계획 주민의견청취',
    'urban_plan',
    '달서구 고시공고',
    'https://dalseo.daegu.kr/',
    '대구광역시 달서구 월성동 281 일원',
    '월성동',
    35.8293,
    128.5304,
    '2026-07-01',
    '2026-08-12',
    '2026-07-18',
    '월성동 일대 생활도로 폭원 조정과 보행환경 개선을 위한 도시관리계획 변경안 열람 공고입니다.',
    '월성동 주변 도로와 보행로를 정비하는 계획입니다. 집이나 가게가 근처라면 통행 방식, 주차, 보행 동선에 영향이 있을 수 있습니다.',
    array['보행', '주차', '상권', '통학'],
    '공고문 열람 후 의견이 있으면 마감일 전 도시디자인과로 의견서를 제출합니다.',
    '도시디자인과',
    '053-000-0000'
  ),
  (
    'sample-traffic-1',
    '상인역네거리 야간 차로 부분 통제',
    'traffic',
    '대구 교통통제 정보',
    'https://car.daegu.go.kr/',
    '대구광역시 달서구 상인동 상인역네거리',
    '상인동',
    35.8181,
    128.5378,
    '2026-07-03',
    '2026-07-05',
    null,
    '상수도관 점검 공사로 상인역네거리 일부 차로가 야간 시간대 제한됩니다.',
    '상인역 근처를 밤에 차량으로 이동하면 정체나 우회가 필요할 수 있습니다. 버스 정류장 접근도 평소보다 불편할 수 있습니다.',
    array['통행', '대중교통', '소음', '주차'],
    '야간 이동은 월배로 우회 경로를 확인하고, 영업장은 배달 동선을 사전에 안내합니다.',
    '교통행정과',
    '053-000-0000'
  ),
  (
    'sample-event-1',
    '두류공원 문화행사 주변 주차 혼잡 예고',
    'event',
    '달서구 보도자료',
    'https://dalseo.daegu.kr/',
    '대구광역시 달서구 공원순환로 36',
    '두류동',
    35.8527,
    128.5582,
    '2026-07-11',
    '2026-07-12',
    null,
    '두류공원 일대 문화행사 개최로 주변 도로와 공영주차장 혼잡이 예상됩니다.',
    '행사 기간 두류공원 주변은 주차와 차량 이동이 평소보다 어렵습니다. 대중교통 이용이나 방문 시간 조정이 필요합니다.',
    array['주차', '통행', '소음', '상권'],
    '행사장 방문자는 대중교통을 이용하고, 인근 주민은 행사 시간대 차량 이동을 피하는 것이 좋습니다.',
    '문화관광과',
    '053-000-0000'
  )
on conflict do nothing;
