# 検索・フィルターベンチマーク

## 条件

2026-08-16にローカルSupabase PostgreSQLへ固定seed `20260816`の合成データを投入して測定した。各クエリは初回を個別記録し、20回warm-up後にsingle client・concurrency 1で200回実行した。時刻はNode.jsから見たローカルDB往復時間で、remote Supabaseのネットワーク時間やSLAを表さない。

- CPU: Apple M5 Max、18 logical CPU
- Memory: 36 GiB
- OS: macOS Darwin 25.5.0 arm64
- Docker: 29.4.0
- Supabase CLI: 2.114.0
- PostgreSQL: 17.6 aarch64
- Node.js: 24.15.0
- seed: 実在しない人物・イベント・Xアカウントだけを使用

完全な環境情報と`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`は[medium.json](results/medium.json)と[large.json](results/large.json)に保存している。

## データ量

| Profile | Groups | Members | Memberships |    Events | Appearances |     Links | Event tags |     Seed |        DB |    Tables |   Indexes |
| ------- | -----: | ------: | ----------: | --------: | ----------: | --------: | ---------: | -------: | --------: | --------: | --------: |
| medium  |  2,000 |  10,000 |      12,000 |   100,000 |     500,000 |   200,000 |    200,000 |  14.14秒 | 376.3 MiB | 152.3 MiB | 211.8 MiB |
| large   | 10,000 |  50,000 |      60,000 | 1,000,000 |   5,000,000 | 2,000,000 |  2,000,000 | 128.20秒 |  3.58 GiB |  1.48 GiB |  2.09 GiB |

## medium結果

単位はms。`Seq Scan`は実行計画に現れたtableを示す。

| Query                  | First |   p50 |   p95 |   p99 | Rows | Seq Scan                   |
| ---------------------- | ----: | ----: | ----: | ----: | ---: | -------------------------- |
| event_title_substring  | 4.860 | 1.003 | 1.185 | 1.435 |   50 | event_aliases              |
| group_alias_substring  | 0.544 | 0.352 | 0.400 | 0.430 |    2 | group_aliases, idol_groups |
| member_alias_substring | 1.374 | 0.994 | 1.091 | 1.270 |   10 | member_aliases, members    |
| date_prefecture_filter | 5.878 | 3.313 | 3.798 | 3.933 |   19 | event_venues, venues       |
| group_event_filter     | 2.451 | 0.657 | 0.765 | 1.025 |   50 | なし                       |
| member_event_filter    | 1.168 | 0.891 | 0.956 | 1.032 |   50 | なし                       |
| compound_event_filter  | 4.772 | 1.140 | 1.955 | 2.358 |   28 | なし                       |
| event_detail           | 0.658 | 0.211 | 0.318 | 0.558 |    1 | なし                       |
| keyset_pagination      | 0.565 | 0.139 | 0.196 | 0.263 |   20 | なし                       |

## large結果

| Query                  |  First |   p50 |    p95 |    p99 | Rows | Seq Scan                   |
| ---------------------- | -----: | ----: | -----: | -----: | ---: | -------------------------- |
| event_title_substring  | 49.304 | 3.464 |  4.386 |  5.230 |   50 | なし                       |
| group_alias_substring  |  3.513 | 1.143 |  1.304 |  1.393 |   10 | group_aliases, idol_groups |
| member_alias_substring | 19.257 | 1.036 |  1.339 |  1.586 |   50 | なし                       |
| date_prefecture_filter | 58.212 | 2.393 |  2.803 |  3.195 |   50 | なし                       |
| group_event_filter     | 29.683 | 1.356 |  1.848 |  2.072 |   50 | なし                       |
| member_event_filter    |  3.636 | 1.650 |  1.979 |  2.259 |   50 | なし                       |
| compound_event_filter  | 34.146 | 9.583 | 12.723 | 17.943 |   50 | なし                       |
| event_detail           |  6.823 | 0.215 |  0.275 |  0.336 |    1 | なし                       |
| keyset_pagination      |  1.134 | 0.138 |  0.178 |  0.239 |   20 | なし                       |

## 評価

- 100万イベント時も最も重い複合filterのp95は12.723msだった。
- メンバーから所属グループの出演を検索するqueryは、候補eventを索引から集めることでp95 1.979msだった。
- `(starts_at, id)`部分索引によりkeyset paginationはp95 0.178msで、events全走査はない。
- large profileのイベント名、メンバー名、地域、出演者、複合filterは高件数tableを全走査しない。
- 10,000行の`idol_groups`と`group_aliases`だけはPostgreSQLがGINより全走査を選択したが、p95は1.304msだった。`enable_seqscan`で索引を強制せず、データ増加時に再測定する。
- mediumの`event_venues`全走査は100,000行・p95 3.798msで、largeでは`idx_event_venues_venue_event`へ切り替わり全走査が消えた。

## 再実行

DockerとローカルSupabaseを起動して実行する。各profileは既存の`app`データをtruncateし、合成データへ置き換える。

```bash
npm run db:start
npm run db:reset
npm run db:benchmark:medium
npm run db:benchmark:large
```

CIでは1,000イベントの`ci` profileだけを使用する。正式結果はマシン性能やPostgreSQL更新で変わるため、schema・query・主要依存関係を変更したPRで再測定する。
