create extension if not exists pgcrypto;

do $$ begin
  create type app_role as enum ('owner','admin','editor','viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft','needs_review','approved','scheduled','published','rejected','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_stage as enum ('new','contacted','qualified','proposal_sent','won','lost','nurture');
exception when duplicate_object then null; end $$;

do $$ begin
  create type workflow_run_status as enum ('queued','running','success','failed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type qa_status as enum ('approved','needs_review','blocked');
exception when duplicate_object then null; end $$;

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  niche text,
  description text,
  website text,
  timezone text not null default 'America/Lima',
  status text not null default 'active',
  whatsapp_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null,
  role app_role not null default 'editor',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists brand_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  colors jsonb not null default '{}'::jsonb,
  fonts jsonb not null default '{}'::jsonb,
  tone text,
  visual_style text,
  forbidden_words jsonb not null default '[]'::jsonb,
  logo_url text,
  reference_assets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists social_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','tiktok','whatsapp')),
  label text not null,
  handle text,
  profile_url text,
  external_id text,
  publish_mode text not null default 'manual' check (publish_mode in ('api','manual','handoff')),
  token_status text not null default 'missing' check (token_status in ('missing','configured','expired','manual')),
  is_active boolean not null default false,
  notes text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, platform)
);

create table if not exists capture_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id uuid,
  name text not null,
  objective text not null default 'captar_leads' check (objective in ('captar_leads','agendar','vender','nutrir')),
  channels jsonb not null default '[]'::jsonb,
  cadence text not null default 'weekly' check (cadence in ('daily','weekly','manual')),
  bot_mode text not null default 'assist' check (bot_mode in ('off','assist','bot')),
  ai_config jsonb not null default '{}'::jsonb,
  lead_magnet text,
  tracked_keyword text,
  whatsapp_cta text,
  status text not null default 'draft' check (status in ('draft','active','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bot_scenarios (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references capture_campaigns(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  intent text not null,
  trigger_phrases jsonb not null default '[]'::jsonb,
  possible_replies jsonb not null default '[]'::jsonb,
  qualification_questions jsonb not null default '[]'::jsonb,
  next_action text not null default 'suggest_reply' check (next_action in ('suggest_reply','create_lead','send_whatsapp_link','escalate_human')),
  risk_level text not null default 'low' check (risk_level in ('low','medium','high')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audiences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  pains jsonb not null default '[]'::jsonb,
  desires jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  language_style text,
  awareness_level text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  category text,
  description text,
  benefits jsonb not null default '[]'::jsonb,
  target_audience text,
  guarantee text,
  availability text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists price_plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  currency text not null default 'PEN',
  regular_price numeric(12,2),
  promo_price numeric(12,2),
  promo_start date,
  promo_end date,
  terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists content_pillars (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  objective text not null check (objective in ('viralidad','valor','autoridad','prueba_social','venta','comunidad','reciclaje')),
  frequency_per_week int not null default 1,
  examples jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  pillar_id uuid references content_pillars(id) on delete set null,
  title text not null,
  angle text,
  hook text,
  format text,
  objective text not null check (objective in ('viralidad','valor','autoridad','prueba_social','venta','comunidad','reciclaje')),
  viral_score int not null default 0 check (viral_score between 0 and 100),
  status content_status not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists content_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  idea_id uuid references content_ideas(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  asset_type text not null check (asset_type in ('copy','script','image','carousel','story','reel_cover')),
  channel text not null,
  title text,
  body text,
  cta text,
  prompt text,
  design_url text,
  qa_score int check (qa_score between 0 and 100),
  qa_status qa_status not null default 'needs_review',
  status content_status not null default 'draft',
  risk_flags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists publications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  asset_id uuid not null references content_assets(id) on delete cascade,
  channel text not null check (channel in ('facebook_page','instagram_business','tiktok','manual')),
  scheduled_at timestamptz,
  published_at timestamptz,
  platform_post_id text,
  status content_status not null default 'scheduled',
  metrics jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text,
  phone text,
  channel text,
  source_post_id text,
  source_campaign text,
  interest text,
  interest_level int not null default 0,
  stage lead_stage not null default 'new',
  score int not null default 0,
  assigned_to uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists whatsapp_handoffs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  suggested_message text,
  final_message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists automation_flows (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('manual','schedule','daily','weekly','webhook')),
  trigger_config jsonb not null default '{}'::jsonb,
  nodes_json jsonb not null default '[]'::jsonb,
  edges_json jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references automation_flows(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  status workflow_run_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  tokens_used int not null default 0,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_type text not null,
  input_hash text,
  output jsonb not null default '{}'::jsonb,
  token_in int default 0,
  token_out int default 0,
  cost_estimate numeric(12,6) default 0,
  quality_score int,
  created_at timestamptz not null default now()
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  snapshot_date date not null,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, snapshot_date)
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete set null,
  actor_user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_businesses_updated_at on businesses;
create trigger trg_businesses_updated_at before update on businesses for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products for each row execute function set_updated_at();

drop trigger if exists trg_content_assets_updated_at on content_assets;
create trigger trg_content_assets_updated_at before update on content_assets for each row execute function set_updated_at();

drop trigger if exists trg_automation_flows_updated_at on automation_flows;
create trigger trg_automation_flows_updated_at before update on automation_flows for each row execute function set_updated_at();

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at before update on leads for each row execute function set_updated_at();

drop trigger if exists trg_social_connections_updated_at on social_connections;
create trigger trg_social_connections_updated_at before update on social_connections for each row execute function set_updated_at();

drop trigger if exists trg_capture_campaigns_updated_at on capture_campaigns;
create trigger trg_capture_campaigns_updated_at before update on capture_campaigns for each row execute function set_updated_at();

drop trigger if exists trg_bot_scenarios_updated_at on bot_scenarios;
create trigger trg_bot_scenarios_updated_at before update on bot_scenarios for each row execute function set_updated_at();
