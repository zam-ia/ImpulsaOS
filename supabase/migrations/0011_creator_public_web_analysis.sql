-- Public web and provider-backed creator analysis snapshots.

alter table creator_accounts
  add column if not exists followers_count int,
  add column if not exists following_count int,
  add column if not exists posts_count int,
  add column if not exists profile_title text,
  add column if not exists profile_description text,
  add column if not exists profile_image_url text,
  add column if not exists last_fetch_status text,
  add column if not exists last_fetch_error text;

alter table creator_posts
  add column if not exists source text not null default 'manual',
  add column if not exists raw_snapshot jsonb not null default '{}'::jsonb;

alter table creators
  add column if not exists profile_summary text,
  add column if not exists profile_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists analysis_source text,
  add column if not exists analysis_notes text;
