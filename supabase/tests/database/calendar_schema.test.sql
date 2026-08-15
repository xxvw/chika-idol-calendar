begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, app;

select plan(29);

select has_schema('app', 'app schema exists');
select has_table('app', 'idol_groups', 'idol_groups exists');
select has_table('app', 'members', 'members exists');
select has_table('app', 'group_memberships', 'group_memberships exists');
select has_table('app', 'events', 'events exists');
select has_table('app', 'event_appearances', 'event_appearances exists');
select has_table('app', 'external_links', 'external_links exists');
select has_table('app', 'event_source_records', 'event provenance exists');

select is(
  app.normalize_search_text('  ＣＨＩＫＡ　アイドル  '),
  'chika あいどる',
  'NFKC, lowercase, whitespace and kana normalization are applied'
);

select is(
  app.normalize_search_text('ﾁｶ☆ドル'),
  'ちか☆どる',
  'half-width katakana is normalized'
);

select is(app.normalize_search_query('地下'), '地下', 'two-character search is accepted');

select throws_ok(
  $$select app.normalize_search_query('地')$$,
  '22023',
  'search query must contain at least 2 normalized characters',
  'one-character search is rejected'
);

insert into app.idol_groups (id, name, publication_status)
overriding system value
values (9001, 'テスト☆グループ', 'published');

insert into app.group_aliases (id, group_id, name)
overriding system value
values (9001, 9001, 'てすと別名');

insert into app.members (id, stage_name, publication_status)
overriding system value
values (9001, '試験メンバー', 'published');

insert into app.member_aliases (id, member_id, name)
overriding system value
values (9001, 9001, 'シケンちゃん');

insert into app.group_memberships (id, group_id, member_id, active_from, active_until)
overriding system value
values (9001, 9001, 9001, '2026-01-01', '2026-12-31');

insert into app.events (
  id,
  title,
  publication_status,
  start_date,
  end_date,
  starts_at,
  ends_at,
  ticket_status,
  min_price_jpy,
  max_price_jpy
)
overriding system value
values
  (9001, '地下アイドル大集合', 'published', '2026-08-16', '2026-08-16', '2026-08-16 10:00+09', '2026-08-16 20:00+09', 'on_sale', 2000, 4000),
  (9002, '翌年のライブ', 'published', '2027-08-16', '2027-08-16', '2027-08-16 10:00+09', '2027-08-16 20:00+09', 'on_sale', 2000, 4000);

insert into app.event_aliases (id, event_id, title)
overriding system value
values (9001, 9001, 'チカドル祭');

insert into app.venues (id, name, prefecture_code, publication_status)
overriding system value
values (9001, '試験会場', '13', 'published');

insert into app.event_venues (id, event_id, venue_id)
overriding system value
values (9001, 9001, 9001), (9002, 9002, 9001);

insert into app.event_stages (id, event_id, event_venue_id, name)
overriding system value
values (9001, 9001, 9001, 'メインステージ');

insert into app.event_appearances (id, event_id, event_stage_id, group_id, starts_at, ends_at)
overriding system value
values
  (9001, 9001, 9001, 9001, '2026-08-16 12:00+09', '2026-08-16 12:30+09'),
  (9002, 9002, null, 9001, '2027-08-16 12:00+09', '2027-08-16 12:30+09');

insert into app.tags (id, slug, name)
overriding system value
values (9001, 'festival', 'フェス');

insert into app.event_tags (event_id, tag_id) values (9001, 9001);

select is(
  (select normalized_name from app.idol_groups where id = 9001),
  'てすと☆ぐるーぷ',
  'generated group search name is normalized'
);

select results_eq(
  $$
    select group_id
    from app.group_aliases
    where normalized_name like '%' || app.normalize_search_query('別名') || '%'
  $$,
  $$values (9001::bigint)$$,
  'group alias substring search finds the group'
);

select results_eq(
  $$
    select member_id
    from app.member_aliases
    where normalized_name like app.normalize_search_query('しけん') || '%'
  $$,
  $$values (9001::bigint)$$,
  'member alias search normalizes katakana to hiragana'
);

select results_eq(
  $$
    select distinct e.id
    from app.events e
    left join app.event_aliases ea on ea.event_id = e.id
    where e.normalized_title like '%' || app.normalize_search_query('アイドル') || '%'
       or ea.normalized_title like '%' || app.normalize_search_query('アイドル') || '%'
    order by e.id
  $$,
  $$values (9001::bigint)$$,
  'event title substring search finds the event'
);

select results_eq(
  $$
    select e.id
    from app.events e
    where e.publication_status = 'published'
      and e.start_date >= '2026-08-01'
      and e.start_date < '2026-09-01'
      and e.ticket_status = any(array['on_sale'])
      and e.min_price_jpy <= 3000
      and e.max_price_jpy >= 3000
      and exists (
        select 1
        from app.event_venues ev
        join app.venues v on v.id = ev.venue_id
        where ev.event_id = e.id and v.prefecture_code = any(array['13'])
      )
      and exists (
        select 1 from app.event_tags et
        where et.event_id = e.id and et.tag_id = any(array[9001::bigint])
      )
    order by e.starts_at, e.id
  $$,
  $$values (9001::bigint)$$,
  'standard filters use AND across filter groups'
);

select results_eq(
  $$
    select distinct e.id
    from app.events e
    join app.event_appearances ea on ea.event_id = e.id
    join app.group_memberships gm on gm.group_id = ea.group_id
    where gm.member_id = 9001
      and gm.active_from <= e.start_date
      and (gm.active_until is null or gm.active_until >= e.start_date)
    order by e.id
  $$,
  $$values (9001::bigint)$$,
  'member filter follows membership active on event date'
);

select results_eq(
  $$
    select id from app.events
    where publication_status = 'published'
      and (starts_at, id) > ('2026-08-16 10:00+09'::timestamptz, 9001::bigint)
    order by starts_at, id
    limit 20
  $$,
  $$values (9002::bigint)$$,
  'event list uses keyset pagination'
);

select throws_ok(
  $$
    insert into app.events (title, start_date, end_date)
    values ('不正な期間', '2026-08-17', '2026-08-16')
  $$,
  '23514',
  null,
  'invalid event date range is rejected'
);

select throws_ok(
  $$
    insert into app.event_appearances (event_id, group_id, member_id)
    values (9001, 9001, 9001)
  $$,
  '23514',
  null,
  'appearance cannot reference both a group and a member'
);

select throws_ok(
  $$
    insert into app.event_stages (event_id, event_venue_id, name)
    values (9002, 9001, '不正なステージ')
  $$,
  '23503',
  null,
  'stage and event venue must belong to the same event'
);

select is(
  has_schema_privilege('anon', 'app', 'usage'),
  false,
  'anon cannot use app schema'
);

select is(
  has_schema_privilege('authenticated', 'app', 'usage'),
  false,
  'authenticated cannot use app schema'
);

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'app'
      and c.relkind = 'r'
      and c.relrowsecurity is false
  ),
  0,
  'RLS is enabled on every app table'
);

select lives_ok(
  $$
    insert into app.external_links (platform, link_type, url, canonical_url)
    values
      ('official', 'event_page', 'https://example.invalid/a', 'https://example.invalid/a'),
      ('official', 'event_page', 'https://example.invalid/b', 'https://example.invalid/b')
  $$,
  'multiple links without an external ID are allowed'
);

insert into app.external_links (platform, link_type, url, canonical_url, external_id)
values ('x', 'post', 'https://x.com/test/status/1', 'https://x.com/test/status/1', '1');

select throws_ok(
  $$
    insert into app.external_links (platform, link_type, url, canonical_url, external_id)
    values ('x', 'post', 'https://x.com/other/status/1', 'https://x.com/other/status/1', '1')
  $$,
  '23505',
  null,
  'non-null external IDs are unique per platform and link type'
);

insert into app.data_sources (id, source_type, name)
overriding system value
values (9001, 'manual', 'テスト入力');

select lives_ok(
  $$
    insert into app.event_source_records (event_id, source_id, observed_at)
    values
      (9001, 9001, '2026-08-16 00:00+09'),
      (9002, 9001, '2026-08-16 00:01+09')
  $$,
  'multiple source records without an external key are allowed'
);

insert into app.event_source_records (event_id, source_id, external_key, observed_at)
values (9001, 9001, 'source-event-1', '2026-08-16 00:02+09');

select throws_ok(
  $$
    insert into app.event_source_records (event_id, source_id, external_key, observed_at)
    values (9002, 9001, 'source-event-1', '2026-08-16 00:03+09')
  $$,
  '23505',
  null,
  'non-null source external keys are unique per source'
);

select * from finish();
rollback;
