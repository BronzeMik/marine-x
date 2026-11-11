# Deployment & Troubleshooting

## Deploy (Vercel or any Node host)

1. `npm ci && npm run build` must pass (also `npm run lint`, `npm test`, `npx tsc --noEmit`).
2. Set environment variables from `.env.example` in the host dashboard. Required for commerce: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`. Recommended: `NEXT_PUBLIC_SITE_URL` (canonical URLs, sitemap, Open Graph), `SHOPIFY_WEBHOOK_SECRET`.
3. Deploy, then register the webhook (`SHOPIFY_SETUP.md` §4) with the production URL.
4. Verify: `/sitemap.xml` lists products, `/gear` shows items, add a Shopify-owned item to the bag, and confirm checkout opens on your Shopify domain. **This live checkout verification has not been performed by the code authors.**

Self-hosting note: on-demand revalidation and the data cache need a long-running Node server (or Vercel). Static export is not supported.

## Environment variables

| Variable | Purpose |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Public Storefront token (server-only) |
| `SHOPIFY_WEBHOOK_SECRET` | Verifies `/api/webhooks/shopify` |
| `AFFILIATE_ALLOWED_HOSTS` | Optional comma-separated domain allowlist for affiliate URLs |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_HERO_IMAGE`, social URLs | Existing options |
| `PARTNER_WEBHOOK_URL` / `PARTNER_FORM_ENDPOINT` | Partner form delivery |

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Site shows placeholder "Shopify is not connected" | `SHOPIFY_STORE_DOMAIN` / token missing; redeploy after setting |
| `/gear` empty, console: `Shopify HTTP 401/403` | Wrong token, or token's app lacks product scopes |
| Products missing | Not published to the channel the token belongs to (§3 of setup) |
| Affiliate products show "LINK UNAVAILABLE" | URL not https / fails validation / not in `AFFILIATE_ALLOWED_HOSTS`, **or** the `affiliate_url` definition lacks Storefront access (returns null) |
| Affiliate products appear in the Shop as buyable-looking items | `product_type` metafield not Storefront-accessible **and** no affiliate URL readable → classified as Shopify. Enable Storefront access on all six definitions |
| Cart: 422 "sold by a partner retailer" | Working as designed: the variant belongs to an affiliate product |
| Cart: "no longer available" | Variant deleted/unpublished; the client clears bad carts automatically |
| Bag empties after a while | Shopify carts expire; the site starts a new one transparently |
| Edits take ~5 min to show | Webhook missing/failing: check `SHOPIFY_WEBHOOK_SECRET` (401 = secret mismatch) |
| Webhook 503 | `SHOPIFY_WEBHOOK_SECRET` not set |
| Video titles show "Marine X Video" | oEmbed unreachable or video private/unembeddable |
| Images blocked | Host not in `next.config.mjs` `images.remotePatterns` |
