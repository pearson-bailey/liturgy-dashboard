create table public.planning_center_service_types (
  id uuid primary key default gen_random_uuid(),
  planning_center_id text not null unique,
  name text not null,
  archived_at timestamptz,
  planning_center_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.planning_center_plans (
  id uuid primary key default gen_random_uuid(),
  planning_center_id text not null unique,
  service_type_id uuid not null references public.planning_center_service_types(id),
  title text not null,
  series_title text,
  service_date date not null,
  display_dates text,
  planning_center_url text,
  planning_center_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_date_type_idx on public.planning_center_plans(service_date, service_type_id);
create table public.planning_center_plan_items (
  id uuid primary key default gen_random_uuid(),
  planning_center_id text not null unique,
  plan_id uuid not null references public.planning_center_plans(id) on delete cascade,
  title text not null,
  description text not null default '',
  html_details text not null default '',
  item_type text not null check (item_type in ('item','header','media')),
  sequence integer not null,
  service_position text,
  raw_section_title text,
  liturgical_movement text not null check (liturgical_movement in
    ('pre-service','god-calls','god-convicts-and-cleanses','god-renews','god-sends')),
  element_key text not null,
  planning_center_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_plan_sequence_idx on public.planning_center_plan_items(plan_id, sequence);
create index items_movement_element_idx on public.planning_center_plan_items(liturgical_movement, element_key);
create table public.scripture_references (
  id uuid primary key default gen_random_uuid(),
  plan_item_id uuid not null references public.planning_center_plan_items(id) on delete cascade,
  raw_reference text not null,
  canonical_reference text not null,
  source_field text not null,
  provenance jsonb not null default '[]'::jsonb check (jsonb_typeof(provenance) = 'array'),
  start_book text not null,
  start_chapter integer not null check (start_chapter > 0),
  start_verse integer check (start_verse > 0),
  end_book text not null,
  end_chapter integer not null check (end_chapter > 0),
  end_verse integer check (end_verse > 0),
  created_at timestamptz not null default now(),
  unique(plan_item_id, canonical_reference)
);
create table public.scripture_chapter_usages (
  scripture_reference_id uuid not null references public.scripture_references(id) on delete cascade,
  book text not null,
  chapter integer not null check (chapter > 0),
  primary key(scripture_reference_id, book, chapter)
);
create index chapter_book_idx on public.scripture_chapter_usages(book, chapter);
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running','completed','failed')),
  kind text not null default 'sync' check (kind in ('sync','reparse')),
  sync_start_date date not null,
  sync_end_date date not null,
  service_types_processed integer not null default 0,
  plans_processed integer not null default 0,
  items_processed integer not null default 0,
  scripture_references_found integer not null default 0,
  error_message text,
  check (sync_start_date <= sync_end_date)
);
create unique index one_running_sync_idx on public.sync_runs((status)) where status = 'running';
create index sync_runs_started_idx on public.sync_runs(started_at desc);

-- Authenticated invited users can read. Only server service-role operations write.
do $$ declare t text; begin
  foreach t in array array['planning_center_service_types','planning_center_plans',
    'planning_center_plan_items','scripture_references','scripture_chapter_usages','sync_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy invited_read on public.%I for select to authenticated using (auth.uid() is not null)', t);
  end loop;
end $$;

-- A relational projection only: counting/filter policy remains in the service.
create view public.scripture_usage_rows with (security_invoker = true) as
select u.scripture_reference_id, u.book, u.chapter,
  r.canonical_reference, r.raw_reference, r.source_field, r.provenance,
  i.id as item_id, i.title as element_title, i.element_key, i.liturgical_movement,
  i.raw_section_title, i.sequence, p.id as plan_id, p.title as plan_title,
  p.service_date, p.planning_center_url, st.id as service_type_id, st.name as service_type_name
from public.scripture_chapter_usages u
join public.scripture_references r on r.id = u.scripture_reference_id
join public.planning_center_plan_items i on i.id = r.plan_item_id
join public.planning_center_plans p on p.id = i.plan_id
join public.planning_center_service_types st on st.id = p.service_type_id;
revoke all on public.scripture_usage_rows from anon, authenticated;
grant select on public.scripture_usage_rows to authenticated, service_role;

create function public.acquire_sync(p_user uuid, p_start date, p_end date, p_kind text)
returns uuid language plpgsql security invoker set search_path = public as $$
declare result uuid;
begin
  perform pg_advisory_xact_lock(714092);
  update sync_runs set status='failed', completed_at=now(),
    error_message='Interrupted run: the synchronization lease expired.'
    where status='running' and heartbeat_at < now() - interval '10 minutes';
  if exists(select 1 from sync_runs where status='running') then
    raise exception 'Synchronization already running' using errcode='55P03';
  end if;
  insert into sync_runs(started_by,status,sync_start_date,sync_end_date,kind)
    values(p_user,'running',p_start,p_end,p_kind) returning id into result;
  return result;
end $$;

-- Fences every atomic write against stale workers. SQL performs persistence only;
-- classification, parsing, and payload construction happen in the sync service.
create function public.replace_plan(p_run uuid, p_service_type jsonb, p_plan jsonb, p_items jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare st_id uuid; pl_id uuid; it_id uuid; ref_id uuid;
  item jsonb; ref jsonb; chapter_row jsonb;
begin
  perform 1 from sync_runs where id=p_run and status='running'
    and heartbeat_at > now() - interval '10 minutes' for update;
  if not found then raise exception 'Synchronization lease lost' using errcode='55P03'; end if;
  update sync_runs set heartbeat_at=now() where id=p_run;
  insert into planning_center_service_types(planning_center_id,name,archived_at,planning_center_updated_at)
    values(p_service_type->>'planning_center_id',p_service_type->>'name',
      (p_service_type->>'archived_at')::timestamptz,(p_service_type->>'planning_center_updated_at')::timestamptz)
    on conflict(planning_center_id) do update set name=excluded.name, archived_at=excluded.archived_at,
      planning_center_updated_at=excluded.planning_center_updated_at,updated_at=now()
    returning id into st_id;
  insert into planning_center_plans(planning_center_id,service_type_id,title,series_title,service_date,
    display_dates,planning_center_url,planning_center_updated_at)
    values(p_plan->>'planning_center_id',st_id,p_plan->>'title',p_plan->>'series_title',
      (p_plan->>'service_date')::date,p_plan->>'display_dates',p_plan->>'planning_center_url',
      (p_plan->>'planning_center_updated_at')::timestamptz)
    on conflict(planning_center_id) do update set service_type_id=excluded.service_type_id,
      title=excluded.title,series_title=excluded.series_title,service_date=excluded.service_date,
      display_dates=excluded.display_dates,planning_center_url=excluded.planning_center_url,
      planning_center_updated_at=excluded.planning_center_updated_at,updated_at=now()
    returning id into pl_id;
  delete from planning_center_plan_items where plan_id=pl_id and planning_center_id not in
    (select value->>'planning_center_id' from jsonb_array_elements(p_items));
  for item in select value from jsonb_array_elements(p_items) loop
    insert into planning_center_plan_items(planning_center_id,plan_id,title,description,html_details,
      item_type,sequence,service_position,raw_section_title,liturgical_movement,element_key,planning_center_updated_at)
    values(item->>'planning_center_id',pl_id,item->>'title',item->>'description',item->>'html_details',
      item->>'item_type',(item->>'sequence')::integer,item->>'service_position',item->>'raw_section_title',
      item->>'liturgical_movement',item->>'element_key',(item->>'planning_center_updated_at')::timestamptz)
    on conflict(planning_center_id) do update set plan_id=excluded.plan_id,title=excluded.title,
      description=excluded.description,html_details=excluded.html_details,item_type=excluded.item_type,
      sequence=excluded.sequence,service_position=excluded.service_position,
      raw_section_title=excluded.raw_section_title,liturgical_movement=excluded.liturgical_movement,
      element_key=excluded.element_key,planning_center_updated_at=excluded.planning_center_updated_at,updated_at=now()
    returning id into it_id;
    delete from scripture_references where plan_item_id=it_id;
    for ref in select value from jsonb_array_elements(item->'references') loop
      insert into scripture_references(plan_item_id,raw_reference,canonical_reference,source_field,provenance,
        start_book,start_chapter,start_verse,end_book,end_chapter,end_verse)
      values(it_id,ref->>'raw_reference',ref->>'canonical_reference',ref->>'source_field',ref->'provenance',
        ref->>'start_book',(ref->>'start_chapter')::integer,(ref->>'start_verse')::integer,
        ref->>'end_book',(ref->>'end_chapter')::integer,(ref->>'end_verse')::integer) returning id into ref_id;
      for chapter_row in select value from jsonb_array_elements(ref->'chapters') loop
        insert into scripture_chapter_usages values(ref_id,chapter_row->>'book',(chapter_row->>'chapter')::integer);
      end loop;
    end loop;
  end loop;
  return pl_id;
end $$;
revoke all on function public.acquire_sync(uuid,date,date,text) from public, anon, authenticated;
revoke all on function public.replace_plan(uuid,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.acquire_sync(uuid,date,date,text) to service_role;
grant execute on function public.replace_plan(uuid,jsonb,jsonb,jsonb) to service_role;
