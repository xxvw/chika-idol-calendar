---
name: cloudflare-delivery
description: Cloudflare Workers と Terraform の変更を、staging と production の分離、最小権限、secret 非公開、段階的な検証を守って配布する。wrangler.jsonc、Worker、GitHub Actions、Cloudflare リソース、Terraform を変更またはデプロイするときに使用する。
---

# Cloudflare Delivery

## Ownership boundaries

- Wrangler owns Worker source builds, configuration, bindings, and deployments.
- Terraform owns account-level stateful Cloudflare resources. Never define Worker script contents in Terraform.
- Before the first stateful resource, add an R2 remote backend with different state keys for staging and production. Do not create local or CI state before that Issue is complete.

## Workflow

1. Read `wrangler.jsonc`, `infra/README.md`, the environment module, and deployment workflows before editing.
2. Confirm that staging and production have explicit environment configuration. Never deploy the root Wrangler environment.
3. Keep non-secret values in configuration. Store API tokens, account IDs used by CI, and runtime secrets only in the matching GitHub Environment or through `wrangler secret`; never place values in the repository, logs, Issue, PR, or chat.
4. Use separate staging and production API tokens scoped to the intended account and only the permissions required. Never reuse a broad global API key.
5. Run `npm ci && npm run check`. Terraform initialization must use `-backend=false`; do not run `apply` for the empty skeleton.
6. Merge normal changes to `development`, deploy to staging, and verify `/health` reports `staging`.
7. Promote only with a `development` to `main` PR and merge it with a merge commit to preserve long-lived branch ancestry. Require the production GitHub Environment approval, deploy production, and verify `/health` reports `production`.
8. If smoke testing fails, stop promotion and inspect the deployment URL and structured logs. Do not bypass the health check.

## Initial account setup

If Workers is not enabled, pause live deployment and tell the maintainer to open Cloudflare Dashboard, enable Workers and select a `workers.dev` subdomain. Then have them create one `Edit Cloudflare Workers` API token per environment and copy the Account ID into the corresponding GitHub Environment secrets. Never ask them to paste either value into chat.
