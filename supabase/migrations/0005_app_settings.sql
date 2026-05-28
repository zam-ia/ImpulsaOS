create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  sidebar_collapsed boolean not null default false,
  module_labels jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

alter table app_settings enable row level security;

create policy "members_select_app_settings" on app_settings for select using (
  exists (select 1 from business_members bm where bm.business_id = app_settings.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = app_settings.business_id and b.owner_id = auth.uid())
);

create policy "members_write_app_settings" on app_settings for all using (
  exists (select 1 from business_members bm where bm.business_id = app_settings.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = app_settings.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from business_members bm where bm.business_id = app_settings.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = app_settings.business_id and b.owner_id = auth.uid())
);

drop trigger if exists trg_app_settings_updated_at on app_settings;
create trigger trg_app_settings_updated_at before update on app_settings
for each row execute function set_updated_at();

create index if not exists idx_app_settings_business on app_settings(business_id);
