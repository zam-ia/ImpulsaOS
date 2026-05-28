alter table businesses enable row level security;
alter table business_members enable row level security;
alter table brand_profiles enable row level security;
alter table social_connections enable row level security;
alter table capture_campaigns enable row level security;
alter table bot_scenarios enable row level security;
alter table audiences enable row level security;
alter table products enable row level security;
alter table price_plans enable row level security;
alter table content_pillars enable row level security;
alter table content_ideas enable row level security;
alter table content_assets enable row level security;
alter table publications enable row level security;
alter table leads enable row level security;
alter table lead_events enable row level security;
alter table whatsapp_handoffs enable row level security;
alter table automation_flows enable row level security;
alter table automation_runs enable row level security;
alter table ai_runs enable row level security;
alter table analytics_snapshots enable row level security;
alter table audit_logs enable row level security;

create or replace function is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1
    from business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

create or replace function can_write_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from businesses b
    where b.id = target_business_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1
    from business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
      and bm.role in ('owner','admin','editor')
  );
$$;

create policy "members_can_view_businesses" on businesses for select using (owner_id = auth.uid() or is_business_member(id));
create policy "owner_can_insert_businesses" on businesses for insert with check (owner_id = auth.uid());
create policy "owner_can_update_businesses" on businesses for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "members_can_view_members" on business_members for select using (is_business_member(business_id));
create policy "owner_can_manage_members" on business_members for all using (
  exists (select 1 from businesses b where b.id = business_members.business_id and b.owner_id = auth.uid())
) with check (
  exists (select 1 from businesses b where b.id = business_members.business_id and b.owner_id = auth.uid())
);

create policy "members_read_brand_profiles" on brand_profiles for select using (is_business_member(business_id));
create policy "members_write_brand_profiles" on brand_profiles for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_social_connections" on social_connections for select using (is_business_member(business_id));
create policy "members_write_social_connections" on social_connections for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_capture_campaigns" on capture_campaigns for select using (is_business_member(business_id));
create policy "members_write_capture_campaigns" on capture_campaigns for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_bot_scenarios" on bot_scenarios for select using (is_business_member(business_id));
create policy "members_write_bot_scenarios" on bot_scenarios for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_audiences" on audiences for select using (is_business_member(business_id));
create policy "members_write_audiences" on audiences for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_products" on products for select using (is_business_member(business_id));
create policy "members_write_products" on products for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_price_plans" on price_plans for select using (
  exists (select 1 from products p where p.id = price_plans.product_id and is_business_member(p.business_id))
);
create policy "members_write_price_plans" on price_plans for all using (
  exists (select 1 from products p where p.id = price_plans.product_id and can_write_business(p.business_id))
) with check (
  exists (select 1 from products p where p.id = price_plans.product_id and can_write_business(p.business_id))
);

create policy "members_read_content_pillars" on content_pillars for select using (is_business_member(business_id));
create policy "members_write_content_pillars" on content_pillars for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_content_ideas" on content_ideas for select using (is_business_member(business_id));
create policy "members_write_content_ideas" on content_ideas for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_content_assets" on content_assets for select using (is_business_member(business_id));
create policy "members_write_content_assets" on content_assets for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_publications" on publications for select using (is_business_member(business_id));
create policy "members_write_publications" on publications for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_leads" on leads for select using (is_business_member(business_id));
create policy "members_write_leads" on leads for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_lead_events" on lead_events for select using (is_business_member(business_id));
create policy "members_write_lead_events" on lead_events for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_whatsapp_handoffs" on whatsapp_handoffs for select using (is_business_member(business_id));
create policy "members_write_whatsapp_handoffs" on whatsapp_handoffs for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_automation_flows" on automation_flows for select using (is_business_member(business_id));
create policy "members_write_automation_flows" on automation_flows for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_automation_runs" on automation_runs for select using (is_business_member(business_id));
create policy "members_write_automation_runs" on automation_runs for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_ai_runs" on ai_runs for select using (is_business_member(business_id));
create policy "members_write_ai_runs" on ai_runs for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_analytics_snapshots" on analytics_snapshots for select using (is_business_member(business_id));
create policy "members_write_analytics_snapshots" on analytics_snapshots for all using (can_write_business(business_id)) with check (can_write_business(business_id));

create policy "members_read_audit_logs" on audit_logs for select using (business_id is null or is_business_member(business_id));
create policy "members_write_audit_logs" on audit_logs for all using (business_id is null or can_write_business(business_id)) with check (business_id is null or can_write_business(business_id));
