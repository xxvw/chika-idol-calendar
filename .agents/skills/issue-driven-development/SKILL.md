---
name: issue-driven-development
description: GitHub Issue を起点に、1 Issue・1 Pull Request の規約で変更を実装し、検証済みの Draft PR まで進める。機能追加、修正、文書更新、保守作業を依頼されたときや、Issue 番号を指定された実装で使用する。
---

# Issue-driven Development

## Workflow

1. ルートの `AGENTS.md` と、変更対象に近い追加ルールを読む。
2. 対象 Issue を取得し、Open であること、目的・対象外・受け入れ条件が実装に十分であることを確認する。Issue がなければ、実装前に作成する。
3. `development` を最新化し、通常変更は `<type>/<issue番号>-<slug>` ブランチを作る。`main` や `development` へ直接 push しない。
4. Issue の範囲だけを実装する。別の目的が必要になったら別 Issue に分け、同じ PR に混ぜない。
5. 変更リスクに応じたテストを追加し、`npm ci && npm run check` を実行する。秘密情報を出力、保存、コミットしない。
6. 差分と `git status` を確認し、意図したファイルだけをコミットする。
7. `development` 向け Draft PR を作る。本文には対象を閉じる `Closes #N` をちょうど1件だけ書き、変更内容、理由、影響、検証結果を記載する。
8. CI と PR policy の結果を確認する。失敗した場合はログから原因を特定し、同じブランチで修正する。

## Exceptions

- `development` から `main` への昇格 PR は Issue 参照を要求せず、長期ブランチの祖先関係を保つためmerge commitで統合する。
- Dependabot PR と maintainer が `security-exception` を付けた非公開セキュリティ修正は例外にできる。
- 例外を通常作業の便宜のために使用しない。
