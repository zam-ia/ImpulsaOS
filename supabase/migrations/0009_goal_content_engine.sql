-- Goal-first content engine and creator analysis MVP.

alter type content_status add value if not exists 'idea_generated';
alter type content_status add value if not exists 'idea_approved';
alter type content_status add value if not exists 'script_generated';
alter type content_status add value if not exists 'copy_generated';
alter type content_status add value if not exists 'design_generated';
alter type content_status add value if not exists 'pending_recording';
alter type content_status add value if not exists 'pending_file';
alter type content_status add value if not exists 'ready_to_publish';
alter type content_status add value if not exists 'measured';
alter type content_status add value if not exists 'reusable';
alter type content_status add value if not exists 'archived';

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  type text not null check (type in ('followers_growth','lead_generation','course_sales','brand_positioning','community_engagement','audience_reactivation')),
  target_number int not null default 0,
  current_number int not null default 0,
  start_date date not null default current_date,
  end_date date not null,
  channels jsonb not null default '[]'::jsonb,
  product_id uuid references products(id) on delete set null,
  audience text,
  restrictions jsonb not null default '[]'::jsonb,
  main_strategy text,
  status text not null default 'active' check (status in ('draft','active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goal_plans (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  diagnostic text,
  gap int not null default 0,
  recommended_strategy text,
  content_pillars jsonb not null default '[]'::jsonb,
  monthly_production jsonb not null default '{}'::jsonb,
  priority_ideas jsonb not null default '[]'::jsonb,
  scripts_to_record jsonb not null default '[]'::jsonb,
  suggested_calendar jsonb not null default '[]'::jsonb,
  kpis jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique(goal_id)
);

alter table content_ideas
  add column if not exists goal_id uuid references goals(id) on delete set null,
  add column if not exists sales_score int not null default 0 check (sales_score between 0 and 100),
  add column if not exists priority text not null default 'medium' check (priority in ('high','medium','low')),
  add column if not exists production_difficulty text not null default 'medium' check (production_difficulty in ('low','medium','high'));

alter table content_assets
  add column if not exists goal_id uuid references goals(id) on delete set null,
  add column if not exists recording_checklist jsonb not null default '[]'::jsonb,
  add column if not exists suggested_scenes jsonb not null default '[]'::jsonb,
  add column if not exists suggested_takes jsonb not null default '[]'::jsonb;

create table if not exists scripts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  idea_id uuid references content_ideas(id) on delete cascade,
  asset_id uuid references content_assets(id) on delete set null,
  script_type text not null default 'reel_talking_head',
  title text not null,
  objective text,
  suggested_duration int not null default 30,
  hook_verbal text,
  hook_visual text,
  body text,
  scenes jsonb not null default '[]'::jsonb,
  takes jsonb not null default '[]'::jsonb,
  screen_text jsonb not null default '[]'::jsonb,
  cta text,
  difficulty text not null default 'medium',
  checklist jsonb not null default '[]'::jsonb,
  status content_status not null default 'script_generated',
  created_at timestamptz not null default now()
);

create table if not exists copies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  idea_id uuid references content_ideas(id) on delete cascade,
  asset_id uuid references content_assets(id) on delete set null,
  channel text not null,
  initial_hook text,
  body text,
  main_benefit text,
  cta text,
  hashtags jsonb not null default '[]'::jsonb,
  link_url text,
  product_id uuid references products(id) on delete set null,
  status content_status not null default 'copy_generated',
  created_at timestamptz not null default now()
);

create table if not exists flyers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  idea_id uuid references content_ideas(id) on delete set null,
  asset_id uuid references content_assets(id) on delete set null,
  format text not null,
  recommended_channel text,
  headline text,
  subtitle text,
  cta text,
  logo_url text,
  brand_colors jsonb not null default '{}'::jsonb,
  image_url text,
  preview_url text,
  status content_status not null default 'design_generated',
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  asset_id uuid references content_assets(id) on delete cascade,
  status content_status not null default 'needs_review',
  validation jsonb not null default '{}'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  asset_id uuid references content_assets(id) on delete cascade,
  channel text not null,
  scheduled_date date not null,
  scheduled_time time not null default '10:00',
  status content_status not null default 'scheduled',
  published_url text,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  asset_id uuid references content_assets(id) on delete set null,
  task_type text not null check (task_type in ('record_video','upload_file','approve_piece','publish_manual','measure_result')),
  title text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','in_progress','done','blocked','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists creators (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  type text not null default 'direct_competitor',
  niche text,
  country text,
  audience text,
  relevance_level text not null default 'medium',
  notes text,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists creator_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','tiktok','whatsapp')),
  username text,
  profile_url text not null,
  account_status text not null default 'pending',
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists creator_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','tiktok','whatsapp')),
  post_url text not null,
  post_type text,
  published_at timestamptz,
  caption text,
  hook text,
  topic text,
  format text,
  cta text,
  likes int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  saves int not null default 0,
  views int not null default 0,
  hashtags jsonb not null default '[]'::jsonb,
  performance_score int not null default 0,
  created_at timestamptz not null default now(),
  unique(creator_id, post_url)
);

create table if not exists analysis_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  creator_id uuid references creators(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  mode text not null default 'manual_assisted',
  status text not null default 'queued',
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists content_patterns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  creator_id uuid references creators(id) on delete cascade,
  platform text,
  pattern_type text not null,
  title text not null,
  description text,
  evidence_posts jsonb not null default '[]'::jsonb,
  opportunity_score int not null default 0 check (opportunity_score between 0 and 100),
  adaptation_notes text,
  created_at timestamptz not null default now()
);

create table if not exists adaptable_ideas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source_creator_id uuid references creators(id) on delete set null,
  source_pattern_id uuid references content_patterns(id) on delete set null,
  goal_id uuid references goals(id) on delete set null,
  idea_title text not null,
  adapted_angle text,
  suggested_format text,
  suggested_channel text,
  risk_of_copying text not null default 'medium',
  opportunity_score int not null default 0 check (opportunity_score between 0 and 100),
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists content_engine_inputs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  source text not null default 'content_analysis',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table goals enable row level security;
alter table goal_plans enable row level security;
alter table scripts enable row level security;
alter table copies enable row level security;
alter table flyers enable row level security;
alter table approvals enable row level security;
alter table schedules enable row level security;
alter table tasks enable row level security;
alter table creators enable row level security;
alter table creator_accounts enable row level security;
alter table creator_posts enable row level security;
alter table analysis_runs enable row level security;
alter table content_patterns enable row level security;
alter table adaptable_ideas enable row level security;
alter table content_engine_inputs enable row level security;

create index if not exists idx_goals_business_status on goals(business_id, status, created_at desc);
create index if not exists idx_content_ideas_goal on content_ideas(goal_id, status, created_at desc);
create index if not exists idx_content_assets_goal on content_assets(goal_id, status, created_at desc);
create index if not exists idx_schedules_goal_date on schedules(goal_id, scheduled_date, scheduled_time);
create index if not exists idx_tasks_goal_status on tasks(goal_id, status, due_at);
create index if not exists idx_creators_business_status on creators(business_id, status, updated_at desc);
create index if not exists idx_creator_posts_creator_score on creator_posts(creator_id, performance_score desc);
create index if not exists idx_patterns_business_score on content_patterns(business_id, opportunity_score desc);
create index if not exists idx_adaptable_ideas_goal_score on adaptable_ideas(goal_id, opportunity_score desc);

do $$
declare
  table_name text;
  business_tables text[] := array[
    'goals','goal_plans','scripts','copies','flyers','approvals','schedules','tasks',
    'creators','creator_posts','analysis_runs','content_patterns','adaptable_ideas','content_engine_inputs'
  ];
begin
  foreach table_name in array business_tables loop
    execute format('drop policy if exists %I on %I', 'members_select_' || table_name, table_name);
    execute format('drop policy if exists %I on %I', 'members_write_' || table_name, table_name);
    execute format(
      'create policy %I on %I for select using (
        exists (select 1 from business_members bm where bm.business_id = %I.business_id and bm.user_id = auth.uid())
        or exists (select 1 from businesses b where b.id = %I.business_id and b.owner_id = auth.uid())
      )',
      'members_select_' || table_name,
      table_name,
      table_name,
      table_name
    );
    execute format(
      'create policy %I on %I for all using (
        exists (select 1 from business_members bm where bm.business_id = %I.business_id and bm.user_id = auth.uid())
        or exists (select 1 from businesses b where b.id = %I.business_id and b.owner_id = auth.uid())
      ) with check (
        exists (select 1 from business_members bm where bm.business_id = %I.business_id and bm.user_id = auth.uid())
        or exists (select 1 from businesses b where b.id = %I.business_id and b.owner_id = auth.uid())
      )',
      'members_write_' || table_name,
      table_name,
      table_name,
      table_name,
      table_name,
      table_name
    );
  end loop;
end $$;

drop policy if exists members_select_creator_accounts on creator_accounts;
drop policy if exists members_write_creator_accounts on creator_accounts;

create policy "members_select_creator_accounts" on creator_accounts for select using (
  exists (
    select 1
    from creators c
    left join business_members bm on bm.business_id = c.business_id
    left join businesses b on b.id = c.business_id
    where c.id = creator_accounts.creator_id
      and (bm.user_id = auth.uid() or b.owner_id = auth.uid())
  )
);

create policy "members_write_creator_accounts" on creator_accounts for all using (
  exists (
    select 1
    from creators c
    left join business_members bm on bm.business_id = c.business_id
    left join businesses b on b.id = c.business_id
    where c.id = creator_accounts.creator_id
      and (bm.user_id = auth.uid() or b.owner_id = auth.uid())
  )
) with check (
  exists (
    select 1
    from creators c
    left join business_members bm on bm.business_id = c.business_id
    left join businesses b on b.id = c.business_id
    where c.id = creator_accounts.creator_id
      and (bm.user_id = auth.uid() or b.owner_id = auth.uid())
  )
);
