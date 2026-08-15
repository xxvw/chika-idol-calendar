# 地下アイドルカレンダー

複数の地下アイドルのライブ予定を1つのカレンダーで確認できるOSSアプリを目指すプロジェクトです。

現在はOSS運用とCloudflareデプロイの基盤を整備している段階で、カレンダー機能やデータモデルはまだ実装していません。

## 現在の構成

- 実行環境: Cloudflare Workers
- 言語: TypeScript
- インフラ管理: Terraform（Cloudflareリソース）とWrangler（Workerコード）
- 統合ブランチ: `development`（ステージング）
- 本番ブランチ: `main`（本番）
- 開発フロー: 1 Issue・1 Pull Request

## ローカル開発

Node.js 24とTerraform 1.15系を用意してください。

```bash
npm ci
npm run dev
```

主な検証コマンド:

```bash
npm run check
```

ローカル用の秘密情報は`.dev.vars`へ保存してください。このファイルはGit管理されません。

## 最小Worker API

- `GET /`: 準備中メッセージ
- `GET /health`: 実行環境を含むhealth response
- その他のパス: JSON形式の404

## コントリビューション

変更を始める前にIssueを作成し、合意した1件のIssueに対して1件のPRを作成してください。詳しくは[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

- 質問・相談: GitHub Discussions
- バグ・機能提案・作業: GitHub Issues
- 脆弱性: GitHubのPrivate Vulnerability Reporting

## ライセンス

[MIT License](LICENSE)で公開しています。著作権表示とライセンス文を保持することで、利用、改変、再配布、商用利用ができます。
