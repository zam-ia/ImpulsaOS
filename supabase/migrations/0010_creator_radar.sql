-- Creator radar workflow: lightweight profile registration, analysis progress,
-- manual-assisted posts and content-engine handoff.

alter table creators
  add column if not exists posts_analyzed int not null default 0,
  add column if not exists avg_likes numeric not null default 0,
  add column if not exists avg_comments numeric not null default 0,
  add column if not exists winning_format text,
  add column if not exists dominant_hook text,
  add column if not exists opportunity_score numeric not null default 0,
  add column if not exists last_analyzed_at timestamptz;

alter table creator_accounts
  add column if not exists handle text;

alter table creator_posts
  add column if not exists account_id uuid references creator_accounts(id) on delete set null,
  add column if not exists hook_type text,
  add column if not exists intention text,
  add column if not exists thumbnail_url text,
  add column if not exists duration_seconds int not null default 0;

alter table analysis_runs
  add column if not exists progress int not null default 0 check (progress between 0 and 100),
  add column if not exists current_step text,
  add column if not exists started_at timestamptz;

alter table content_patterns
  add column if not exists analysis_run_id uuid references analysis_runs(id) on delete cascade,
  add column if not exists why_it_works text,
  add column if not exists risk_of_copying text;

alter table adaptable_ideas
  add column if not exists suggested_hook text,
  add column if not exists recommended_objective text;

alter table content_engine_inputs
  add column if not exists creator_id uuid references creators(id) on delete cascade,
  add column if not exists analysis_run_id uuid references analysis_runs(id) on delete cascade,
  add column if not exists insight_payload jsonb not null default '{}'::jsonb,
  add column if not exists sent_to_engine_at timestamptz;

create index if not exists idx_analysis_runs_creator_created on analysis_runs(creator_id, created_at desc);
create index if not exists idx_creator_accounts_creator on creator_accounts(creator_id, platform);
create index if not exists idx_creator_posts_account_score on creator_posts(account_id, performance_score desc);
create index if not exists idx_engine_inputs_creator_created on content_engine_inputs(creator_id, created_at desc);
