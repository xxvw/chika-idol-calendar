---
name: supabase-database-development
description: Supabase PostgreSQLのschema、migration、RLS、索引、生成型、DBテスト、検索ベンチマークを安全に変更する。supabase/、docs/db/、Database型を変更するときや、Supabaseのlocal・staging・production操作を依頼されたときに使用する。
---

# Supabase Database Development

## Workflow

1. ルートの`AGENTS.md`、`docs/db/README.md`、既存migrationを読む。
2. Open Issueと対象環境を確認し、通常変更は`development`からIssue branchを作る。
3. schema変更をtimestamp付きmigrationへ記述する。Dashboardをschemaの正にしない。
4. テーブルを`app` schemaへ置き、`PUBLIC`、`anon`、`authenticated`へ直接公開しない。ブラウザはCloudflare Worker APIだけを使用する。
5. 外部入力をSQLへ連結しない。正規化関数、bind parameter、外部キー、CHECK、RLS、最小権限を使用する。
6. `npm run db:reset`で空DBから再構築し、`npm run db:test`を実行する。schema変更後は`npm run db:types`を実行し、生成型をcommitする。
7. 検索・filter変更では対応する索引と`EXPLAIN (ANALYZE, BUFFERS)`を確認する。大規模queryを変えたら合成データbenchmarkを再実行して`docs/db`を更新する。
8. `npm ci && npm run check`、DB検証、skill validationを完了してDraft PRへ結果を書く。

## Remote safety

- local操作では`--local`を明示する。
- remote projectの`supabase link`、`db push`、seed、migration、resetは、利用者が対象環境を明示して承認するまで実行しない。
- `supabase db reset --linked`をproductionへ実行しない。stagingでも破棄可能と確認できた場合だけ実行する。
- stagingとproductionのproject、token、DB password、connection stringを分離し、repository、Issue、PR、logへ保存しない。
- remote migrationはstagingで検証後、`development`から`main`への昇格とproduction承認を経て適用する。

## Data and benchmarks

- 実在人物、実在イベント、実在X投稿をbenchmark fixtureへコピーしない。
- 固定seedと`example.invalid`を使用し、件数、環境、初回、p50、p95、p99、DB・index容量、実行計画を記録する。
- production dataでbenchmarkしない。remote performance測定は専用の破棄可能環境を明示承認された場合だけ行う。
