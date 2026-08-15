import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import os from "node:os";
import process from "node:process";
import { URL } from "node:url";
import pg from "pg";

const SEED = 20260816;
const profiles = {
  ci: {
    groups: 100,
    members: 500,
    memberships: 600,
    venues: 50,
    events: 1_000,
    appearancesPerEvent: 5,
    linksPerEvent: 2,
    tagsPerEvent: 2,
  },
  medium: {
    groups: 2_000,
    members: 10_000,
    memberships: 12_000,
    venues: 1_000,
    events: 100_000,
    appearancesPerEvent: 5,
    linksPerEvent: 2,
    tagsPerEvent: 2,
  },
  large: {
    groups: 10_000,
    members: 50_000,
    memberships: 60_000,
    venues: 5_000,
    events: 1_000_000,
    appearancesPerEvent: 5,
    linksPerEvent: 2,
    tagsPerEvent: 2,
  },
};

function argument(name, fallback) {
  const prefix = `--${name}=`;
  return (
    process.argv
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length) ?? fallback
  );
}

const profileName = argument("profile", "ci");
const profile = profiles[profileName];
if (!profile) {
  throw new Error(`Unknown profile: ${profileName}. Use ci, medium, or large.`);
}

const outputPath = argument("output", "");
const iterations = Number(
  argument("iterations", profileName === "ci" ? "20" : "200"),
);
const warmups = Number(argument("warmups", profileName === "ci" ? "5" : "20"));
const connectionString =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:55422/postgres";
const databaseUrl = new URL(connectionString);
if (!new Set(["127.0.0.1", "localhost", "::1"]).has(databaseUrl.hostname)) {
  throw new Error(
    "Database benchmarks are destructive and may only target a local Supabase database.",
  );
}

const client = new pg.Client({
  connectionString,
  application_name: "chika-idol-calendar-benchmark",
});

function percentile(sorted, ratio) {
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)
  ];
}

function round(value) {
  return Math.round(value * 1_000) / 1_000;
}

async function timedQuery(text, values) {
  const started = performance.now();
  const result = await client.query(text, values);
  return {
    durationMs: performance.now() - started,
    rowCount: result.rowCount ?? result.rows.length,
  };
}

function collectSequentialScans(plan, relations = []) {
  if (plan["Node Type"] === "Seq Scan" && plan["Relation Name"]) {
    relations.push(plan["Relation Name"]);
  }
  for (const child of plan.Plans ?? [])
    collectSequentialScans(child, relations);
  return [...new Set(relations)].sort();
}

async function seedDatabase(config) {
  const started = performance.now();
  const appearances = config.events * config.appearancesPerEvent;
  const links = config.events * config.linksPerEvent;
  const eventTags = config.events * config.tagsPerEvent;

  await client.query("begin");
  try {
    await client.query("set local synchronous_commit = off");
    await client.query(`
      truncate table
        app.event_source_records,
        app.member_source_records,
        app.group_source_records,
        app.data_sources,
        app.event_external_links,
        app.member_external_links,
        app.group_external_links,
        app.external_links,
        app.event_tags,
        app.group_tags,
        app.tags,
        app.event_appearances,
        app.event_stages,
        app.event_venues,
        app.venues,
        app.event_aliases,
        app.events,
        app.event_series,
        app.group_memberships,
        app.member_aliases,
        app.members,
        app.group_aliases,
        app.idol_groups
      restart identity cascade
    `);

    await client.query(
      `insert into app.idol_groups (name, lifecycle_status, publication_status, formed_on)
       select
         case when n % 997 = 0 then '銀河特別星団 ' else '合成アイドル星団 ' end || lpad(n::text, 6, '0'),
         case when n % 29 = 0 then 'hiatus' else 'active' end,
         'published',
         date '2018-01-01' + (n % 2000)
       from generate_series(1, $1) n`,
      [config.groups],
    );
    await client.query(
      `insert into app.group_aliases (group_id, name)
       select id,
         case when id % 997 = 0 then '銀河特別星団 別名 ' else '別名スター ' end || lpad(id::text, 6, '0')
       from app.idol_groups`,
    );

    await client.query(
      `insert into app.members (stage_name, lifecycle_status, publication_status)
       select
         case when n % 991 = 0 then '銀河ルナ ' else '合成メンバー ' end || lpad(n::text, 7, '0'),
         'active',
         'published'
       from generate_series(1, $1) n`,
      [config.members],
    );
    await client.query(
      `insert into app.member_aliases (member_id, name)
       select id,
         case when id % 991 = 0 then '銀河ルナ 別名 ' else 'ルナ別名 ' end || lpad(id::text, 7, '0')
       from app.members`,
    );
    await client.query(
      `insert into app.group_memberships (group_id, member_id, active_from, active_until)
       select
         ((n - 1) % $2) + 1,
         ((n - 1) % $3) + 1,
         date '2020-01-01' + (n % 365),
         null
       from generate_series(1, $1) n`,
      [config.memberships, config.groups, config.members],
    );

    await client.query(
      `insert into app.event_series (name, publication_status)
       select '合成ライブシリーズ ' || lpad(n::text, 4, '0'), 'published'
       from generate_series(1, greatest(100, $1 / 1000)) n`,
      [config.events],
    );
    await client.query(
      `insert into app.venues (name, prefecture_code, city, publication_status)
       select
         '合成ライブハウス ' || lpad(n::text, 5, '0'),
         lpad((((n - 1) % 47) + 1)::text, 2, '0'),
         '合成市 ' || ((n - 1) % 200),
         'published'
       from generate_series(1, $1) n`,
      [config.venues],
    );
    await client.query(
      `insert into app.events (
         series_id, title, publication_status, schedule_status, start_date, end_date,
         doors_at, starts_at, ends_at, ticket_status, min_price_jpy, max_price_jpy
       )
       select
         ((n - 1) % greatest(100, $1 / 1000)) + 1,
         case when n % 997 = 0 then '銀河特別公演 ' else '合成ライブ ' end || lpad(n::text, 8, '0'),
         case when n % 20 = 0 then 'draft' else 'published' end,
         case when n % 101 = 0 then 'cancelled' else 'scheduled' end,
         date '2025-01-01' + (n % 1825),
         date '2025-01-01' + (n % 1825),
         (date '2025-01-01' + (n % 1825))::timestamptz + interval '9 hours',
         (date '2025-01-01' + (n % 1825))::timestamptz + interval '10 hours',
         (date '2025-01-01' + (n % 1825))::timestamptz + interval '18 hours',
         (array['unknown', 'not_on_sale', 'on_sale', 'sold_out', 'ended', 'door'])[(n % 6) + 1],
         (n % 50) * 100,
         (n % 50) * 100 + 3000
       from generate_series(1, $1) n`,
      [config.events],
    );
    await client.query(
      `insert into app.event_aliases (event_id, title)
       select id,
         case when id % 997 = 0 then '銀河特別公演 別名 ' else '月夜限定公演 ' end || lpad(id::text, 8, '0')
       from app.events where id % 10 = 0`,
    );
    await client.query(
      `insert into app.event_venues (event_id, venue_id)
       select id, ((id - 1) % $1) + 1 from app.events`,
      [config.venues],
    );
    await client.query(
      `insert into app.event_stages (event_id, event_venue_id, name)
       select id, id, 'メインステージ' from app.events`,
    );
    await client.query(
      `insert into app.event_appearances (
         event_id, event_stage_id, group_id, member_id, starts_at, ends_at, billing_order
       )
       select
         ((n - 1) / $2) + 1,
         ((n - 1) / $2) + 1,
         case when ((n - 1) % $2) + 1 < $2 then ((n - 1) % $3) + 1 else null end,
         case when ((n - 1) % $2) + 1 = $2 then ((n - 1) % $4) + 1 else null end,
         e.starts_at + (((n - 1) % $2) * interval '45 minutes'),
         e.starts_at + (((n - 1) % $2) * interval '45 minutes') + interval '30 minutes',
         ((n - 1) % $2) + 1
       from generate_series(1, $1) n
       join app.events e on e.id = ((n - 1) / $2) + 1`,
      [appearances, config.appearancesPerEvent, config.groups, config.members],
    );

    await client.query(
      `insert into app.tags (slug, name)
       select 'tag-' || lpad(n::text, 3, '0'), '合成タグ ' || lpad(n::text, 3, '0')
       from generate_series(1, 100) n`,
    );
    await client.query(
      `insert into app.event_tags (event_id, tag_id)
       select ((n - 1) / $2) + 1, ((n - 1) % 100) + 1
       from generate_series(1, $1) n
       on conflict do nothing`,
      [eventTags, config.tagsPerEvent],
    );
    await client.query(
      `insert into app.group_tags (group_id, tag_id)
       select id, ((id - 1) % 100) + 1 from app.idol_groups`,
    );

    await client.query(
      `insert into app.external_links (
         id, platform, link_type, url, canonical_url, external_id, x_author_handle, published_at
       ) overriding system value
       select
         n,
         case when n % $2 = 1 then 'x' else 'ticketing' end,
         case when n % $2 = 1 then 'post' else 'ticket' end,
         case when n % $2 = 1
           then 'https://x.com/synthetic_idol/status/' || ((n - 1) / $2 + 1)
           else 'https://tickets.example.invalid/events/' || ((n - 1) / $2 + 1)
         end,
         case when n % $2 = 1
           then 'https://x.com/synthetic_idol/status/' || ((n - 1) / $2 + 1)
           else 'https://tickets.example.invalid/events/' || ((n - 1) / $2 + 1)
         end,
         case when n % $2 = 1 then 'x-post-' else 'ticket-' end || ((n - 1) / $2 + 1),
         case when n % $2 = 1 then 'synthetic_idol' else null end,
         case when n % $2 = 1 then now() - (((n - 1) / $2) % 365) * interval '1 day' else null end
       from generate_series(1, $1) n`,
      [links, config.linksPerEvent],
    );
    await client.query(
      `insert into app.event_external_links (event_id, external_link_id, relation_type, is_primary)
       select
         ((n - 1) / $2) + 1,
         n,
         case when n % $2 = 1 then 'social' else 'ticket' end,
         n % $2 = 1
       from generate_series(1, $1) n`,
      [links, config.linksPerEvent],
    );

    await client.query(
      `insert into app.data_sources (source_type, name, base_url, trust_level)
       values ('manual', '合成ベンチマーク', 'https://example.invalid/benchmark', 100)`,
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }

  await client.query("analyze app.idol_groups");
  await client.query("analyze app.group_aliases");
  await client.query("analyze app.members");
  await client.query("analyze app.member_aliases");
  await client.query("analyze app.group_memberships");
  await client.query("analyze app.events");
  await client.query("analyze app.event_aliases");
  await client.query("analyze app.event_venues");
  await client.query("analyze app.event_appearances");
  await client.query("analyze app.event_tags");
  await client.query("analyze app.external_links");

  return {
    durationMs: performance.now() - started,
    appearances,
    links,
    eventTags,
  };
}

const benchmarkQueries = [
  {
    name: "event_title_substring",
    sql: `
      with hits as (
        select id as event_id from app.events where normalized_title like $1
        union
        select event_id from app.event_aliases where normalized_title like $1
      )
      select e.id, e.title, e.start_date
      from hits h join app.events e on e.id = h.event_id
      where e.publication_status = 'published'
      order by e.start_date, e.id limit 50`,
    values: ["%銀河特別%"],
  },
  {
    name: "group_alias_substring",
    sql: `
      with hits as (
        select id as group_id from app.idol_groups where normalized_name like $1
        union
        select group_id from app.group_aliases where normalized_name like $1
      )
      select g.id, g.name from hits h join app.idol_groups g on g.id = h.group_id
      where g.publication_status = 'published' order by g.id limit 50`,
    values: ["%銀河特別星団%"],
  },
  {
    name: "member_alias_substring",
    sql: `
      with hits as (
        select id as member_id from app.members where normalized_stage_name like $1
        union
        select member_id from app.member_aliases where normalized_name like $1
      )
      select m.id, m.stage_name from hits h join app.members m on m.id = h.member_id
      where m.publication_status = 'published' order by m.id limit 50`,
    values: ["%銀河るな%"],
  },
  {
    name: "date_prefecture_filter",
    sql: `
      select e.id, e.title, e.start_date
      from app.events e
      where e.publication_status = 'published'
        and e.start_date >= $1 and e.start_date < $2
        and exists (
          select 1 from app.event_venues ev
          join app.venues v on v.id = ev.venue_id
          where ev.event_id = e.id and v.prefecture_code = any($3::text[])
        )
      order by e.start_date, e.id limit 50`,
    values: ["2026-08-01", "2026-08-08", ["13", "14"]],
  },
  {
    name: "group_event_filter",
    sql: `
      select e.id, e.title, e.start_date
      from app.events e
      where e.publication_status = 'published'
        and e.start_date >= $1 and e.start_date < $2
        and exists (
          select 1 from app.event_appearances ea
          where ea.event_id = e.id and ea.group_id = any($3::bigint[])
        )
      order by e.start_date, e.id limit 50`,
    values: ["2025-01-01", "2030-01-01", [42, 84]],
  },
  {
    name: "member_event_filter",
    sql: `
      with candidate_events as (
        select direct_appearance.event_id
        from app.event_appearances direct_appearance
        where direct_appearance.member_id = any($3::bigint[])
        union
        select group_appearance.event_id
        from app.group_memberships gm
        join app.event_appearances group_appearance on group_appearance.group_id = gm.group_id
        join app.events membership_event on membership_event.id = group_appearance.event_id
        where gm.member_id = any($3::bigint[])
          and gm.active_from <= membership_event.start_date
          and (gm.active_until is null or gm.active_until >= membership_event.start_date)
      )
      select e.id, e.title, e.start_date
      from candidate_events candidate
      join app.events e on e.id = candidate.event_id
      where e.publication_status = 'published'
        and e.start_date >= $1 and e.start_date < $2
      order by e.start_date, e.id limit 50`,
    values: ["2025-01-01", "2030-01-01", [42]],
  },
  {
    name: "compound_event_filter",
    sql: `
      select e.id, e.title, e.start_date
      from app.events e
      where e.publication_status = 'published'
        and e.start_date >= $1 and e.start_date < $2
        and e.schedule_status = any($3::text[])
        and e.ticket_status = any($4::text[])
        and e.min_price_jpy <= $5 and e.max_price_jpy >= $6
        and exists (
          select 1 from app.event_tags et
          where et.event_id = e.id and et.tag_id = any($7::bigint[])
        )
      order by e.start_date, e.id limit 50`,
    values: [
      "2026-08-01",
      "2026-09-01",
      ["scheduled"],
      ["on_sale", "door"],
      3000,
      1000,
      [1, 2, 3],
    ],
  },
  {
    name: "event_detail",
    sql: `
      select
        e.id,
        e.title,
        coalesce((select jsonb_agg(jsonb_build_object('stage', es.name)) from app.event_stages es where es.event_id = e.id), '[]'),
        coalesce((select jsonb_agg(jsonb_build_object('group_id', ea.group_id, 'member_id', ea.member_id)) from app.event_appearances ea where ea.event_id = e.id), '[]'),
        coalesce((select jsonb_agg(jsonb_build_object('url', el.url, 'type', eel.relation_type)) from app.event_external_links eel join app.external_links el on el.id = eel.external_link_id where eel.event_id = e.id), '[]')
      from app.events e where e.id = $1`,
    values: [997],
  },
  {
    name: "keyset_pagination",
    sql: `
      select e.id, e.title, e.starts_at
      from app.events e
      where e.publication_status = 'published'
        and e.starts_at is not null
        and e.start_date >= $1 and e.start_date < $2
        and (e.starts_at, e.id) > ($3::timestamptz, $4::bigint)
      order by e.starts_at, e.id limit 20`,
    values: ["2025-01-01", "2030-01-01", "2026-01-01T10:00:00Z", 1000],
  },
];

async function runBenchmark(query) {
  const first = await timedQuery(query.sql, query.values);
  for (let index = 0; index < warmups; index += 1)
    await client.query(query.sql, query.values);

  const durations = [];
  let rowCount = first.rowCount;
  for (let index = 0; index < iterations; index += 1) {
    const measured = await timedQuery(query.sql, query.values);
    durations.push(measured.durationMs);
    rowCount = measured.rowCount;
  }
  durations.sort((left, right) => left - right);

  const explained = await client.query(
    `explain (analyze, buffers, format json) ${query.sql}`,
    query.values,
  );
  const topPlan = explained.rows[0]["QUERY PLAN"][0];
  return {
    name: query.name,
    firstMs: round(first.durationMs),
    p50Ms: round(percentile(durations, 0.5)),
    p95Ms: round(percentile(durations, 0.95)),
    p99Ms: round(percentile(durations, 0.99)),
    rowCount,
    planningMs: round(topPlan["Planning Time"]),
    executionMs: round(topPlan["Execution Time"]),
    sequentialScans: collectSequentialScans(topPlan.Plan),
    plan: topPlan,
  };
}

try {
  await client.connect();
  const seed = await seedDatabase(profile);
  const version = (await client.query("select version() value")).rows[0].value;
  const sizes = (
    await client.query(`
      select
        pg_database_size(current_database())::bigint as database_bytes,
        coalesce(sum(pg_relation_size(c.oid)) filter (where c.relkind = 'r'), 0)::bigint as table_bytes,
        coalesce(sum(pg_relation_size(c.oid)) filter (where c.relkind = 'i'), 0)::bigint as index_bytes
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'app'
    `)
  ).rows[0];

  const results = [];
  for (const query of benchmarkQueries) {
    process.stdout.write(`Benchmarking ${query.name}...\n`);
    results.push(await runBenchmark(query));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    seed: SEED,
    profile: profileName,
    counts: {
      groups: profile.groups,
      members: profile.members,
      memberships: profile.memberships,
      venues: profile.venues,
      events: profile.events,
      appearances: seed.appearances,
      externalLinks: seed.links,
      eventTags: seed.eventTags,
    },
    execution: {
      warmups,
      iterations,
      concurrency: 1,
      seedDurationMs: round(seed.durationMs),
    },
    sizes: {
      databaseBytes: Number(sizes.database_bytes),
      tableBytes: Number(sizes.table_bytes),
      indexBytes: Number(sizes.index_bytes),
    },
    environment: {
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      node: process.version,
      docker: execFileSync("docker", ["--version"], {
        encoding: "utf8",
      }).trim(),
      supabaseCli: execFileSync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["supabase", "--version"],
        { encoding: "utf8" },
      ).trim(),
      postgres: version,
      commit: execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    },
    results,
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, serialized);
    process.stdout.write(`Wrote ${outputPath}\n`);
  } else {
    process.stdout.write(serialized);
  }
} finally {
  await client.end();
}
