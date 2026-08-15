# Infrastructure as Code

Cloudflare アカウント側の宣言的なリソースは Terraform で管理します。Worker のソースコードとデプロイは Wrangler だけが担当し、Terraform の `cloudflare_workers_script` などで二重管理しません。

## state の方針

初期構成には stateful resource がないため、`terraform apply` と state の作成は行いません。最初の stateful resource を追加する Issue で、先に次を実施してください。

1. state 専用の Cloudflare R2 バケットを作成する。
2. staging と production で異なる state key を定義する。
3. GitHub Actions から最小権限で利用できる認証情報を GitHub Environment に登録する。
4. state の暗号化、ロック、復旧手順を確認してから backend 設定を追加する。

## ローカル検証

Cloudflare の認証情報は不要です。

```console
npm run terraform:check
```

`fmt`、`init -backend=false`、`validate` のみを実行し、`plan` や `apply` は行いません。
