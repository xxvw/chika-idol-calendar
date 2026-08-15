# 検索・フィルター設計

## 文字列正規化

`app.normalize_search_text`で次を順番に行い、各entityのgenerated columnへ保存する。

1. Unicode NFKCで全角英数字・半角カタカナなどを統一する。
2. 英字を小文字化する。
3. カタカナをひらがなへ変換する。
4. 連続するUnicode空白を半角スペース1文字へまとめ、前後を除去する。

正式名と別名の両方へB-tree `text_pattern_ops`とGIN `gin_trgm_ops`を設定する。検索入力には必ず同じ正規化関数を適用する。

## 名前検索

- 正規化後1文字: `22023`として拒否する。
- 正規化後2文字: `normalized_name = $1`または`normalized_name LIKE $1 || '%'`で完全・前方一致する。
- 正規化後3文字以上: `normalized_name LIKE '%' || $1 || '%'`で部分一致する。
- 正式名と別名を`UNION`し、entity IDを重複除去してから公開状態を確認する。
- SQL文字列へ入力を連結せず、将来のWorker実装では必ずbind parameterを使用する。

グループは`idol_groups`と`group_aliases`、メンバーは`members`と`member_aliases`、イベントは`events`と`event_aliases`を検索する。イベントシリーズ名も必要に応じて同じ検索結果へ合流できる。

## イベントフィルター

フィルター間はAND、同一フィルター内の複数値は`ANY(array)`または`EXISTS`によるORとして扱う。

| フィルター     | 列・関連                         | 方針                                  |
| -------------- | -------------------------------- | ------------------------------------- |
| 期間           | `events.start_date`              | 半開区間`>= from AND < to`            |
| 都道府県・会場 | `event_venues` → `venues`        | 複数会場のどれかが一致                |
| グループ       | `event_appearances.group_id`     | `EXISTS`で行増幅を防止                |
| メンバー       | 個人出演、所属期間、グループ出演 | 候補event IDを`UNION`してeventsへ結合 |
| タグ           | `event_tags.tag_id`              | 同じfilter内はOR                      |
| 開催状態       | `events.schedule_status`         | 複数状態を許可                        |
| チケット       | `events.ticket_status`           | unknownを明示的に区別                 |
| 価格帯         | `min_price_jpy`、`max_price_jpy` | 検索価格帯との重なりを判定            |

一覧は既定20件、最大100件とする。offset paginationは件数増加に伴って遅くなるため使用せず、次のkeyset条件を使用する。

```sql
where publication_status = 'published'
  and starts_at is not null
  and (starts_at, id) > ($after_starts_at, $after_id)
order by starts_at, id
limit $limit
```

`idx_events_published_starts_at`はこの順序と公開データだけに対応する部分索引である。

## 実行計画

代表クエリは[`scripts/db-benchmark.mjs`](../../scripts/db-benchmark.mjs)を正とする。変更時は`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`を取得し、次を確認する。

- 大規模な`events`、`event_appearances`、`event_external_links`で選択的クエリが全走査していない。
- 名前の部分一致がGIN Bitmap Index Scanを使用する。
- 期間検索とkeyset paginationが対応する部分索引を使用する。
- 多対多joinで結果行が増幅しないよう、一覧検索は`EXISTS`または候補IDの`UNION`を使う。

小さいdimension tableは、索引アクセスより安いとPostgreSQLが判断して全走査する場合がある。行数とp95を合わせて評価し、`enable_seqscan`による強制は行わない。
