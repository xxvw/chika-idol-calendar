# コントリビューションガイド

コントリビューションへの関心に感謝します。本プロジェクトへの参加時は[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)を守ってください。

## 変更を始める前に

1. 既存Issueを検索し、重複がないことを確認する。
2. 対応するIssueがなければ、Issue Formから目的、受け入れ条件、対象外を記載して作成する。
3. 大きな変更は、実装前にIssue上で方針について合意する。
4. `development`の最新状態から作業ブランチを作成する。

通常の変更は1件のIssueに対して1件のPRとします。複数Issueを1件のPRで同時に解決したり、1件のIssueを複数の通常PRへ分割したりしないでください。

例外は次のとおりです。

- `development`から`main`へのリリース昇格PR
- Dependabotによる依存関係更新
- maintainerが`security-exception`ラベルを付けた非公開セキュリティ修正

## ブランチ

`<type>/<issue番号>-<短い説明>`形式を使用します。

```text
feat/123-calendar-filter
fix/124-timezone-conversion
docs/125-contribution-guide
chore/126-update-tooling
```

`main`と`development`へ直接pushしないでください。空リポジトリ作成時のbootstrap commitと、Issue #12で承認された一度限りの履歴同期だけが例外です。

## 開発と検証

```bash
npm ci
npm run check
```

Cloudflare設定を変更した場合は、生成型を更新してください。

```bash
npm run types
```

Terraformで最初のstateful resourceを追加する前に、R2 remote stateを導入してください。Cloudflare Dashboardで管理対象リソースを手動変更しないでください。

## Pull Request

- 最初はDraft PRとして作成する。
- 通常PRの本文に`Closes #<Issue番号>`をちょうど1件記載する。
- 変更理由、影響、検証結果、対象外を記載する。
- CIが成功し、レビュー可能になったらReady for reviewへ変更する。
- 通常PRはsquash mergeを使用する。
- `development`から`main`への昇格PRだけは、長期ブランチの祖先関係を保つためmerge commitを使用する。

PRを送信することで、そのコントリビューションを本リポジトリと同じMIT Licenseで提供することに同意したものとします。
