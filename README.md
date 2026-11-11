# Marine X — Shopify-managed affiliate gear + shop (V4)

Next.js 15 / React 19 / TypeScript. **Shopify Admin is the single source of truth** for both affiliate recommendations and Marine X merchandise. Edit products in Shopify; the site updates without a code change or redeploy.

## Run

```bash
npm install
cp .env.example .env.local   # fill in Shopify values (see docs/SHOPIFY_SETUP.md)
npm run dev
```

| Script | |
|---|---|
| `npm run build` | Production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm test` | Vitest unit tests |
| `npx tsc --noEmit` | Type check |

Without Shopify credentials the site runs with a small legacy placeholder catalog (`lib/affiliate.ts`, kept only as a fallback) and the shop shows a "coming online" state.

## What's where

- `lib/shopify/` — Storefront client, queries, normalization, catalog, cart, webhook (see `docs/ARCHITECTURE.md`)
- `app/gear` — Gear Hub (search, category/retailer/type/featured filters, pagination, URL-shareable)
- `app/gear/[handle]` — product pages (affiliate CTA **or** Shopify buy box)
- `app/videos` — Shop the Video
- `app/api/cart`, `app/api/webhooks/shopify`, `app/api/partner`
- `components/cart/CartProvider.tsx` — shared bag + animated drawer

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — audit, design, limitations
- [`docs/SHOPIFY_SETUP.md`](docs/SHOPIFY_SETUP.md) — Storefront API, metafields, channels, webhooks
- [`docs/AFFILIATE_MANAGEMENT.md`](docs/AFFILIATE_MANAGEMENT.md) — day-to-day product workflow
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — env vars, deploy, troubleshooting

## Verification status

Verified: unit tests (normalization, malformed metafields, URL validation, classification, cart exclusion/recovery with a mocked Storefront API, variants, pagination, search/filter, webhook HMAC), type check, lint, production build, and a local smoke test of all routes **without Shopify credentials**.

**Not verified (needs your store):** live Storefront queries against real metafield definitions, real cart/checkout, webhook delivery, and Shopify's behavior across sales channels.

## Compliance notes

Affiliate items never enter the Shopify cart (UI + server guard). Amazon prices/ratings/reviews are never displayed. Affiliate links use `rel="sponsored noopener noreferrer"`. Add your privacy/terms pages and review each affiliate program's disclosure requirements before launch.
