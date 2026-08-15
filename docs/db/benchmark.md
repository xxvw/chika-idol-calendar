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
| medium  |  2,000 |  10,000 |      12,000 |   100,000 |     500,000 |   200,000 |    200,000 |  11.28秒 | 376.7 MiB | 152.3 MiB | 211.8 MiB |
| large   | 10,000 |  50,000 |      60,000 | 1,000,000 |   5,000,000 | 2,000,000 |  2,000,000 | 124.42秒 |  3.58 GiB |  1.48 GiB |  2.09 GiB |

## medium結果

単位はms。`Seq Scan`は実行計画に現れたtableを示す。

| Query                  | First |   p50 |   p95 |   p99 | Rows | Seq Scan                   |
| ---------------------- | ----: | ----: | ----: | ----: | ---: | -------------------------- |
| event_title_substring  | 4.409 | 1.205 | 2.084 | 2.522 |   50 | event_aliases              |
| group_alias_substring  | 1.090 | 0.358 | 0.435 | 0.526 |    2 | group_aliases, idol_groups |
| member_alias_substring | 1.370 | 1.039 | 1.370 | 1.637 |   10 | member_aliases, members    |
| date_prefecture_filter | 1.475 | 0.667 | 0.736 | 0.783 |   19 | venues                     |
| group_event_filter     | 2.142 | 0.640 | 0.728 | 0.844 |   50 | なし                       |
| member_event_filter    | 1.242 | 0.869 | 1.215 | 1.339 |   50 | なし                       |
| compound_event_filter  | 5.622 | 0.976 | 1.456 | 1.664 |   28 | なし                       |
| event_detail           | 0.681 | 0.205 | 0.247 | 0.315 |    1 | なし                       |
| keyset_pagination      | 0.437 | 0.125 | 0.147 | 0.168 |   20 | なし                       |

## large結果

| Query                  |  First |   p50 |   p95 |    p99 | Rows | Seq Scan                   |
| ---------------------- | -----: | ----: | ----: | -----: | ---: | -------------------------- |
| event_title_substring  | 18.863 | 3.209 | 3.575 |  4.134 |   50 | なし                       |
| group_alias_substring  |  1.863 | 1.057 | 1.135 |  1.195 |   10 | group_aliases, idol_groups |
| member_alias_substring |  4.847 | 1.007 | 1.226 |  1.326 |   50 | なし                       |
| date_prefecture_filter |  9.728 | 4.469 | 4.764 |  5.120 |   50 | なし                       |
| group_event_filter     |  9.870 | 1.206 | 1.325 |  1.403 |   50 | なし                       |
| member_event_filter    |  1.940 | 1.603 | 1.970 |  2.308 |   50 | なし                       |
| compound_event_filter  | 20.296 | 8.289 | 9.333 | 11.270 |   50 | なし                       |
| event_detail           |  0.948 | 0.209 | 0.250 |  0.271 |    1 | なし                       |
| keyset_pagination      |  0.496 | 0.132 | 0.159 |  0.190 |   20 | なし                       |

## 評価

- 100万イベント時も最も重い複合filterのp95は9.333msだった。
- メンバーから所属グループの出演を検索するqueryは、候補eventを索引から集めることでp95 1.970msだった。
- `(starts_at, id)`部分索引によりkeyset paginationはp95 0.159msで、events全走査はない。
- large profileのイベント名、メンバー名、地域、出演者、複合filterは高件数tableを全走査しない。
- 10,000行の`idol_groups`と`group_aliases`だけはPostgreSQLがGINより全走査を選択したが、p95は1.135msだった。`enable_seqscan`で索引を強制せず、データ増加時に再測定する。
- 地域filterは都道府県に該当する会場IDを先に確定し、`idx_event_venues_venue_event`からイベントを取得する。medium・largeとも`event_venues`の全走査はない。

## 再実行

DockerとローカルSupabaseを起動して実行する。各profileは既存の`app`データをtruncateし、合成データへ置き換える。

```bash
npm run db:start
npm run db:reset
npm run db:benchmark:medium
npm run db:benchmark:large
```

CIでは1,000イベントの`ci` profileだけを使用する。正式結果はマシン性能やPostgreSQL更新で変わるため、schema・query・主要依存関係を変更したPRで再測定する。
