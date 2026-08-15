# Codex作業ルール

## 作業開始

- 変更前に対応するOpen Issueを確認する。Issueがなければ、実装を始める前に作成する。
- 通常変更では1件のIssueだけを対象にし、受け入れ条件と対象外を確認する。
- `development`の最新状態から`<type>/<issue番号>-<slug>`形式のブランチを作成する。
- `main`と`development`へ直接pushしない。初回の空bootstrap commitだけを例外とする。

## Pull Request

- 通常PRは`development`をbaseとし、本文に`Closes #<Issue番号>`をちょうど1件記載する。
- 最初はDraft PRとして作成し、変更理由、利用者・開発者への影響、検証結果を記載する。
- `development`から`main`への昇格PR、Dependabot、`security-exception`ラベル付き修正だけはIssue 1対1ルールの例外とする。
- `main`向けPRは`development`からの昇格PRだけにする。
- squash mergeを前提に、PRのタイトルだけで変更全体が説明できるようにする。

## 実装と検証

- 公開挙動を変更するときは、テストと文書を同じPRで更新する。
- コミット前に`npm run check`を実行する。
- Wrangler設定変更後は`npm run types`を実行し、生成型をコミットする。
- CIの回避、テスト削除による見かけ上の成功、型安全性を隠すcastを行わない。
- 新しい依存関係は目的と保守性を確認し、lockfileを更新する。

## CloudflareとIaC

- Workerコードと環境別設定は`wrangler.jsonc`とWranglerで管理する。
- D1、KV、R2、DNSなどのCloudflareリソースはTerraformで管理し、Wranglerと同じリソースを二重管理しない。
- 最初のstateful resource追加前にR2 remote stateを導入する。
- Cloudflare DashboardでTerraform管理対象を手動変更しない。
- stagingは`development`、productionは`main`からのみデプロイする。

## セキュリティ

- API Token、Account ID以外の秘密情報、`.dev.vars`、Terraform stateをコミットしない。Account IDもGitHub Environment secretとして扱う。
- Global API Keyを使用しない。用途と対象アカウントを限定したAPI Tokenを使用する。
- 脆弱性情報を公開IssueやPRへ転記しない。

## Code Review Rules

- IssueとPRが1対1で対応し、対象外の変更が混入していないことを確認する。
- `main`向けPRのheadが`development`であることを確認する。
- Workerにrequest単位のglobal mutable state、floating Promise、hardcoded secret、`passThroughOnException`がないことを確認する。
- WranglerとTerraformが同じCloudflareリソースを管理していないことを確認する。
