create schema if not exists app;

revoke all on schema app from public;
revoke all on schema app from anon;
revoke all on schema app from authenticated;

create extension if not exists pg_trgm with schema extensions;

create or replace function app.normalize_search_text(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select trim(
    regexp_replace(
      translate(
        lower(normalize(value, NFKC)),
        'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶヽヾ',
        'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんゔゕゖゝゞ'
      ),
      '[[:space:]　]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function app.normalize_search_query(value text)
returns text
language plpgsql
immutable
strict
parallel safe
set search_path = ''
as $$
declare
  normalized text := app.normalize_search_text(value);
begin
  if char_length(normalized) < 2 then
    raise exception using
      errcode = '22023',
      message = 'search query must contain at least 2 normalized characters';
  end if;
  return normalized;
end;
$$;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create table app.idol_groups (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 200),
  normalized_name text generated always as (app.normalize_search_text(name)) stored,
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'hiatus', 'disbanded')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived', 'merged')),
  formed_on date,
  disbanded_on date,
  merged_into_id bigint references app.idol_groups(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (disbanded_on is null or formed_on is null or disbanded_on >= formed_on),
  check (merged_into_id is null or merged_into_id <> id),
  check ((publication_status = 'merged') = (merged_into_id is not null))
);

create table app.group_aliases (
  id bigint generated always as identity primary key,
  group_id bigint not null references app.idol_groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  normalized_name text generated always as (app.normalize_search_text(name)) stored,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  unique (group_id, normalized_name),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create table app.members (
  id bigint generated always as identity primary key,
  stage_name text not null check (char_length(trim(stage_name)) between 1 and 200),
  normalized_stage_name text generated always as (app.normalize_search_text(stage_name)) stored,
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('active', 'inactive', 'retired')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived', 'merged')),
  merged_into_id bigint references app.members(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (merged_into_id is null or merged_into_id <> id),
  check ((publication_status = 'merged') = (merged_into_id is not null))
);

create table app.member_aliases (
  id bigint generated always as identity primary key,
  member_id bigint not null references app.members(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 200),
  normalized_name text generated always as (app.normalize_search_text(name)) stored,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  unique (member_id, normalized_name),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create table app.group_memberships (
  id bigint generated always as identity primary key,
  group_id bigint not null references app.idol_groups(id) on delete restrict,
  member_id bigint not null references app.members(id) on delete restrict,
  role_name text,
  active_from date not null,
  active_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, member_id, active_from),
  check (active_until is null or active_until >= active_from)
);

create table app.event_series (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 300),
  normalized_name text generated always as (app.normalize_search_text(name)) stored,
  description text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.events (
  id bigint generated always as identity primary key,
  series_id bigint references app.event_series(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 300),
  normalized_title text generated always as (app.normalize_search_text(title)) stored,
  description text,
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived', 'merged')),
  schedule_status text not null default 'scheduled'
    check (schedule_status in ('scheduled', 'postponed', 'cancelled', 'completed')),
  start_date date not null,
  end_date date not null,
  doors_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  time_zone text not null default 'Asia/Tokyo',
  ticket_status text not null default 'unknown'
    check (ticket_status in ('unknown', 'not_on_sale', 'on_sale', 'sold_out', 'ended', 'door')),
  min_price_jpy integer,
  max_price_jpy integer,
  is_online boolean not null default false,
  merged_into_id bigint references app.events(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (starts_at is null or doors_at is null or starts_at >= doors_at),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check (min_price_jpy is null or min_price_jpy >= 0),
  check (max_price_jpy is null or max_price_jpy >= 0),
  check (min_price_jpy is null or max_price_jpy is null or max_price_jpy >= min_price_jpy),
  check (merged_into_id is null or merged_into_id <> id),
  check ((publication_status = 'merged') = (merged_into_id is not null))
);

create table app.event_aliases (
  id bigint generated always as identity primary key,
  event_id bigint not null references app.events(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  normalized_title text generated always as (app.normalize_search_text(title)) stored,
  created_at timestamptz not null default now(),
  unique (event_id, normalized_title)
);

create table app.venues (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 300),
  normalized_name text generated always as (app.normalize_search_text(name)) stored,
  prefecture_code text check (prefecture_code is null or prefecture_code ~ '^(0[1-9]|[1-3][0-9]|4[0-7])$'),
  city text,
  street_address text,
  latitude numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  time_zone text not null default 'Asia/Tokyo',
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.event_venues (
  id bigint generated always as identity primary key,
  event_id bigint not null references app.events(id) on delete cascade,
  venue_id bigint not null references app.venues(id) on delete restrict,
  venue_role text not null default 'primary'
    check (venue_role in ('primary', 'secondary', 'online')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_id, venue_id),
  unique (event_id, id)
);

create table app.event_stages (
  id bigint generated always as identity primary key,
  event_id bigint not null references app.events(id) on delete cascade,
  event_venue_id bigint not null,
  name text not null check (char_length(trim(name)) between 1 and 200),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (event_id, event_venue_id, name),
  unique (event_id, id),
  foreign key (event_id, event_venue_id)
    references app.event_venues(event_id, id) on delete cascade
);

create table app.event_appearances (
  id bigint generated always as identity primary key,
  event_id bigint not null references app.events(id) on delete cascade,
  event_stage_id bigint,
  group_id bigint references app.idol_groups(id) on delete restrict,
  member_id bigint references app.members(id) on delete restrict,
  starts_at timestamptz,
  ends_at timestamptz,
  appearance_status text not null default 'scheduled'
    check (appearance_status in ('scheduled', 'cancelled', 'completed')),
  billing_order integer check (billing_order is null or billing_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (event_id, event_stage_id)
    references app.event_stages(event_id, id) on delete cascade,
  check (num_nonnulls(group_id, member_id) = 1),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table app.tags (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique check (char_length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);

create table app.group_tags (
  group_id bigint not null references app.idol_groups(id) on delete cascade,
  tag_id bigint not null references app.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, tag_id)
);

create table app.event_tags (
  event_id bigint not null references app.events(id) on delete cascade,
  tag_id bigint not null references app.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, tag_id)
);

create table app.external_links (
  id bigint generated always as identity primary key,
  platform text not null
    check (platform in ('x', 'official', 'ticketing', 'streaming', 'other')),
  link_type text not null
    check (link_type in ('profile', 'post', 'event_page', 'ticket', 'stream', 'other')),
  url text not null check (url ~ '^https://'),
  canonical_url text not null unique check (canonical_url ~ '^https://'),
  external_id text,
  label text,
  x_author_handle text check (x_author_handle is null or x_author_handle ~ '^[A-Za-z0-9_]{1,15}$'),
  published_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (platform = 'x' or x_author_handle is null),
  check (platform = 'x' or link_type <> 'post')
);

create table app.group_external_links (
  group_id bigint not null references app.idol_groups(id) on delete cascade,
  external_link_id bigint not null references app.external_links(id) on delete cascade,
  relation_type text not null check (relation_type in ('profile', 'official', 'source')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (group_id, external_link_id, relation_type)
);

create table app.member_external_links (
  member_id bigint not null references app.members(id) on delete cascade,
  external_link_id bigint not null references app.external_links(id) on delete cascade,
  relation_type text not null check (relation_type in ('profile', 'official', 'source')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (member_id, external_link_id, relation_type)
);

create table app.event_external_links (
  event_id bigint not null references app.events(id) on delete cascade,
  external_link_id bigint not null references app.external_links(id) on delete cascade,
  relation_type text not null
    check (relation_type in ('official', 'source', 'ticket', 'stream', 'social')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (event_id, external_link_id, relation_type)
);

create table app.data_sources (
  id bigint generated always as identity primary key,
  source_type text not null
    check (source_type in ('manual', 'x', 'official_site', 'ticketing', 'other')),
  name text not null check (char_length(trim(name)) between 1 and 200),
  base_url text check (base_url is null or base_url ~ '^https://'),
  trust_level smallint not null default 0 check (trust_level between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, name)
);

create table app.group_source_records (
  group_id bigint not null references app.idol_groups(id) on delete cascade,
  source_id bigint not null references app.data_sources(id) on delete restrict,
  source_url text check (source_url is null or source_url ~ '^https://'),
  external_key text,
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  primary key (group_id, source_id, observed_at)
);

create table app.member_source_records (
  member_id bigint not null references app.members(id) on delete cascade,
  source_id bigint not null references app.data_sources(id) on delete restrict,
  source_url text check (source_url is null or source_url ~ '^https://'),
  external_key text,
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  primary key (member_id, source_id, observed_at)
);

create table app.event_source_records (
  event_id bigint not null references app.events(id) on delete cascade,
  source_id bigint not null references app.data_sources(id) on delete restrict,
  source_url text check (source_url is null or source_url ~ '^https://'),
  external_key text,
  observed_at timestamptz not null default now(),
  verified_at timestamptz,
  primary key (event_id, source_id, observed_at)
);

create index idx_idol_groups_normalized_name_pattern
  on app.idol_groups (normalized_name text_pattern_ops);
create index idx_idol_groups_normalized_name_trgm
  on app.idol_groups using gin (normalized_name extensions.gin_trgm_ops);
create index idx_group_aliases_normalized_name_pattern
  on app.group_aliases (normalized_name text_pattern_ops);
create index idx_group_aliases_normalized_name_trgm
  on app.group_aliases using gin (normalized_name extensions.gin_trgm_ops);
create index idx_group_aliases_group_id on app.group_aliases (group_id);

create index idx_members_normalized_name_pattern
  on app.members (normalized_stage_name text_pattern_ops);
create index idx_members_normalized_name_trgm
  on app.members using gin (normalized_stage_name extensions.gin_trgm_ops);
create index idx_member_aliases_normalized_name_pattern
  on app.member_aliases (normalized_name text_pattern_ops);
create index idx_member_aliases_normalized_name_trgm
  on app.member_aliases using gin (normalized_name extensions.gin_trgm_ops);
create index idx_member_aliases_member_id on app.member_aliases (member_id);
create index idx_memberships_member_period
  on app.group_memberships (member_id, active_from, active_until, group_id);
create index idx_memberships_group_period
  on app.group_memberships (group_id, active_from, active_until, member_id);

create index idx_event_series_normalized_name_pattern
  on app.event_series (normalized_name text_pattern_ops);
create index idx_event_series_normalized_name_trgm
  on app.event_series using gin (normalized_name extensions.gin_trgm_ops);
create index idx_events_normalized_title_pattern
  on app.events (normalized_title text_pattern_ops);
create index idx_events_normalized_title_trgm
  on app.events using gin (normalized_title extensions.gin_trgm_ops);
create index idx_event_aliases_normalized_title_pattern
  on app.event_aliases (normalized_title text_pattern_ops);
create index idx_event_aliases_normalized_title_trgm
  on app.event_aliases using gin (normalized_title extensions.gin_trgm_ops);
create index idx_event_aliases_event_id on app.event_aliases (event_id);
create index idx_events_published_start
  on app.events (start_date, starts_at, id)
  where publication_status = 'published';
create index idx_events_published_starts_at
  on app.events (starts_at, id)
  where publication_status = 'published' and starts_at is not null;
create index idx_events_status_start
  on app.events (schedule_status, start_date, id)
  where publication_status = 'published';
create index idx_events_ticket_start
  on app.events (ticket_status, start_date, id)
  where publication_status = 'published';
create index idx_events_price_start
  on app.events (min_price_jpy, max_price_jpy, start_date, id)
  where publication_status = 'published';
create index idx_events_series_id on app.events (series_id);

create index idx_venues_prefecture on app.venues (prefecture_code, id);
create index idx_venues_normalized_name_trgm
  on app.venues using gin (normalized_name extensions.gin_trgm_ops);
create index idx_event_venues_venue_event on app.event_venues (venue_id, event_id);
create index idx_event_stages_event_venue on app.event_stages (event_id, event_venue_id);
create index idx_appearances_event on app.event_appearances (event_id, event_stage_id, billing_order, id);
create index idx_appearances_group_event
  on app.event_appearances (group_id, event_id)
  where group_id is not null;
create index idx_appearances_member_event
  on app.event_appearances (member_id, event_id)
  where member_id is not null;
create index idx_group_tags_tag_group on app.group_tags (tag_id, group_id);
create index idx_event_tags_tag_event on app.event_tags (tag_id, event_id);
create index idx_external_links_platform_type on app.external_links (platform, link_type, id);
create unique index idx_external_links_external_id
  on app.external_links (platform, link_type, external_id)
  where external_id is not null;
create index idx_group_links_link on app.group_external_links (external_link_id, group_id);
create index idx_member_links_link on app.member_external_links (external_link_id, member_id);
create index idx_event_links_link on app.event_external_links (external_link_id, event_id);
create index idx_group_sources_source on app.group_source_records (source_id, group_id);
create unique index idx_group_sources_external_key
  on app.group_source_records (source_id, external_key)
  where external_key is not null;
create index idx_member_sources_source on app.member_source_records (source_id, member_id);
create unique index idx_member_sources_external_key
  on app.member_source_records (source_id, external_key)
  where external_key is not null;
create index idx_event_sources_source on app.event_source_records (source_id, event_id);
create unique index idx_event_sources_external_key
  on app.event_source_records (source_id, external_key)
  where external_key is not null;

create trigger set_idol_groups_updated_at before update on app.idol_groups
  for each row execute function app.set_updated_at();
create trigger set_members_updated_at before update on app.members
  for each row execute function app.set_updated_at();
create trigger set_memberships_updated_at before update on app.group_memberships
  for each row execute function app.set_updated_at();
create trigger set_event_series_updated_at before update on app.event_series
  for each row execute function app.set_updated_at();
create trigger set_events_updated_at before update on app.events
  for each row execute function app.set_updated_at();
create trigger set_venues_updated_at before update on app.venues
  for each row execute function app.set_updated_at();
create trigger set_appearances_updated_at before update on app.event_appearances
  for each row execute function app.set_updated_at();
create trigger set_data_sources_updated_at before update on app.data_sources
  for each row execute function app.set_updated_at();

alter table app.idol_groups enable row level security;
alter table app.group_aliases enable row level security;
alter table app.members enable row level security;
alter table app.member_aliases enable row level security;
alter table app.group_memberships enable row level security;
alter table app.event_series enable row level security;
alter table app.events enable row level security;
alter table app.event_aliases enable row level security;
alter table app.venues enable row level security;
alter table app.event_venues enable row level security;
alter table app.event_stages enable row level security;
alter table app.event_appearances enable row level security;
alter table app.tags enable row level security;
alter table app.group_tags enable row level security;
alter table app.event_tags enable row level security;
alter table app.external_links enable row level security;
alter table app.group_external_links enable row level security;
alter table app.member_external_links enable row level security;
alter table app.event_external_links enable row level security;
alter table app.data_sources enable row level security;
alter table app.group_source_records enable row level security;
alter table app.member_source_records enable row level security;
alter table app.event_source_records enable row level security;

revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;

alter default privileges in schema app revoke all on tables from public, anon, authenticated;
alter default privileges in schema app revoke all on sequences from public, anon, authenticated;
alter default privileges in schema app revoke all on functions from public, anon, authenticated;
