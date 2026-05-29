-- AI short video generation compatible with MoneyPrinterTurbo-style tasks.

alter table content_assets
  drop constraint if exists content_assets_asset_type_check;

alter table content_assets
  add constraint content_assets_asset_type_check
  check (asset_type in ('copy','script','image','carousel','story','reel_cover','visual_prompt','video'));

alter table content_assets
  add column if not exists video_config jsonb not null default '{}'::jsonb,
  add column if not exists video_task jsonb not null default '{}'::jsonb;

create table if not exists video_generation_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  asset_id uuid references content_assets(id) on delete set null,
  provider text not null default 'moneyprinter',
  external_task_id text,
  status text not null default 'queued' check (status in ('draft','queued','processing','completed','failed')),
  progress int not null default 0 check (progress between 0 and 100),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  videos jsonb not null default '[]'::jsonb,
  combined_videos jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table video_generation_tasks enable row level security;

create policy "members_select_video_generation_tasks" on video_generation_tasks for select using (
  exists (select 1 from business_members bm where bm.business_id = video_generation_tasks.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = video_generation_tasks.business_id and b.owner_id = auth.uid())
);

create policy "members_write_video_generation_tasks" on video_generation_tasks for all using (
  exists (select 1 from business_members bm where bm.business_id = video_generation_tasks.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = video_generation_tasks.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from business_members bm where bm.business_id = video_generation_tasks.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = video_generation_tasks.business_id and b.owner_id = auth.uid())
);

drop trigger if exists trg_video_generation_tasks_updated_at on video_generation_tasks;
create trigger trg_video_generation_tasks_updated_at before update on video_generation_tasks
for each row execute function set_updated_at();

create index if not exists idx_video_generation_tasks_business_status on video_generation_tasks(business_id, status, created_at desc);
create index if not exists idx_video_generation_tasks_asset on video_generation_tasks(asset_id);
