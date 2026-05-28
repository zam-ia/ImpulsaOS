-- Competitor/research layer for autonomous organic capture.

alter table content_assets
  add column if not exists target_connection_ids jsonb not null default '[]'::jsonb,
  add column if not exists reference_image_urls jsonb not null default '[]'::jsonb;

alter table publications
  add column if not exists connection_id text;

alter table automation_flows
  add column if not exists research_mode text not null default 'manual_links',
  add column if not exists target_connection_ids jsonb not null default '[]'::jsonb,
  add column if not exists competitor_profile_ids jsonb not null default '[]'::jsonb;

create table if not exists competitor_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','tiktok','whatsapp')),
  name text not null,
  handle text,
  profile_url text,
  niche text,
  notes text,
  tracked_formats jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research_insights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source text not null check (source in ('own_content','competitor','internet','erex')),
  title text not null,
  summary text not null,
  recommendation text not null,
  confidence int not null default 0 check (confidence between 0 and 100),
  created_at timestamptz not null default now()
);

alter table competitor_profiles enable row level security;
alter table research_insights enable row level security;

create policy "members_select_competitor_profiles" on competitor_profiles for select using (
  exists (select 1 from business_members bm where bm.business_id = competitor_profiles.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = competitor_profiles.business_id and b.owner_id = auth.uid())
);

create policy "members_write_competitor_profiles" on competitor_profiles for all using (
  exists (select 1 from business_members bm where bm.business_id = competitor_profiles.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = competitor_profiles.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from business_members bm where bm.business_id = competitor_profiles.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = competitor_profiles.business_id and b.owner_id = auth.uid())
);

create policy "members_select_research_insights" on research_insights for select using (
  exists (select 1 from business_members bm where bm.business_id = research_insights.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = research_insights.business_id and b.owner_id = auth.uid())
);

create policy "members_write_research_insights" on research_insights for all using (
  exists (select 1 from business_members bm where bm.business_id = research_insights.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = research_insights.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from business_members bm where bm.business_id = research_insights.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = research_insights.business_id and b.owner_id = auth.uid())
);

drop trigger if exists trg_competitor_profiles_updated_at on competitor_profiles;
create trigger trg_competitor_profiles_updated_at before update on competitor_profiles
for each row execute function set_updated_at();

create index if not exists idx_competitor_profiles_business_active on competitor_profiles(business_id, is_active, updated_at desc);
create index if not exists idx_research_insights_business_created on research_insights(business_id, created_at desc);
