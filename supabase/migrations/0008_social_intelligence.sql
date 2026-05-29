-- Social content intelligence layer.
-- Normalizes public/connected post metrics from Meta, TikTok, Instagram exports,
-- OCR, transcription workers and manual CSV imports.

create table if not exists social_post_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  competitor_profile_id uuid references competitor_profiles(id) on delete set null,
  red_social text not null check (red_social in ('facebook','instagram','tiktok','whatsapp')),
  cuenta text not null,
  url_post text not null,
  fecha_publicacion timestamptz not null,
  tipo_contenido text not null,
  duracion_video int not null default 0,
  likes int not null default 0,
  comentarios int not null default 0,
  shares int not null default 0,
  views int not null default 0,
  engagement_rate numeric(8,2) not null default 0,
  hook_textual text,
  hook_verbal text,
  hook_visual text,
  categoria_hook text not null default 'desconocido',
  formato_detectado text not null default 'desconocido',
  tema text,
  cta text,
  score_viralidad int not null default 0 check (score_viralidad between 0 and 100),
  provider text not null default 'manual_csv',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, url_post)
);

create table if not exists social_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  snapshot_date date not null default current_date,
  comentarios_promedio int not null default 0,
  likes_promedio int not null default 0,
  formato_ganador text not null default 'pendiente',
  hook_dominante text not null default 'desconocido',
  formatos_vigilar jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, snapshot_date)
);

alter table social_post_metrics enable row level security;
alter table social_metric_snapshots enable row level security;

create policy "members_select_social_post_metrics" on social_post_metrics for select using (
  exists (select 1 from business_members bm where bm.business_id = social_post_metrics.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = social_post_metrics.business_id and b.owner_id = auth.uid())
);

create policy "members_write_social_post_metrics" on social_post_metrics for all using (
  exists (select 1 from business_members bm where bm.business_id = social_post_metrics.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = social_post_metrics.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from business_members bm where bm.business_id = social_post_metrics.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = social_post_metrics.business_id and b.owner_id = auth.uid())
);

create policy "members_select_social_metric_snapshots" on social_metric_snapshots for select using (
  exists (select 1 from business_members bm where bm.business_id = social_metric_snapshots.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = social_metric_snapshots.business_id and b.owner_id = auth.uid())
);

create policy "members_write_social_metric_snapshots" on social_metric_snapshots for all using (
  exists (select 1 from business_members bm where bm.business_id = social_metric_snapshots.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = social_metric_snapshots.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from business_members bm where bm.business_id = social_metric_snapshots.business_id and bm.user_id = auth.uid())
  or exists (select 1 from businesses b where b.id = social_metric_snapshots.business_id and b.owner_id = auth.uid())
);

create index if not exists idx_social_post_metrics_business_date
  on social_post_metrics(business_id, red_social, fecha_publicacion desc);

create index if not exists idx_social_post_metrics_viral
  on social_post_metrics(business_id, score_viralidad desc);

create index if not exists idx_social_post_metrics_engagement
  on social_post_metrics(business_id, engagement_rate desc);

create index if not exists idx_social_metric_snapshots_business_date
  on social_metric_snapshots(business_id, snapshot_date desc);
