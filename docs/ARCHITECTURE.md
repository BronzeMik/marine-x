# Marine X V4 — Architecture

## 1. Audit of V3 (before this change)

| Area | V3 state | Problem |
|---|---|---|
| Affiliate catalog | Hardcoded array in `lib/affiliate.ts` (3 placeholders) | Every change = code edit + redeploy |
| Shopify | `lib/shopify.ts`: single file, `products(first: 8)` | No pagination, no metafields, no variants |
| Cart | Add-only `POST /api/cart`; ID in `localStorage` | No quantity/remove; no check that a variant is sellable; no server guard against non-Shopify products |
| UI | `AffiliateHub` filtered client-side over the hardcoded array; `Storefront` owned all cart state | Cart state not shareable with other pages |
| Videos | `NEXT_PUBLIC_YOUTUBE_VIDEO_IDS` env var + placeholder titles; no product ↔ video relation | Not data-driven |
| Caching | `next: { revalidate: 120 }` on every request, no tags | No on-demand invalidation |
| Security | Storefront token server-only (good); affiliate URL check was `https` + hostname deny-list | No webhook, no per-variant guard, cart IDs only prefix-checked |
| Quality tooling | No tests, no lint | — |

Preserved: all branding, CSS, the home page layout, hero/animations, Discord and partner sections, `/api/partner`.

## 2. V4 design

Shopify Admin is the single source of truth. Products carry six `custom.*` metafields; the site normalizes them into a discriminated union:

```ts
type CatalogProduct = AffiliateProduct | ShopifyProduct   // lib/shopify/types.ts
```

### Modules (`lib/shopify/`)

| File | Responsibility | Server-only? |
|---|---|---|
| `client.ts` | Storefront GraphQL fetch, env, error type, cache tag | **yes** (reads token) |
| `queries.ts` | GraphQL documents (metafields via aliases → no N+1) | — |
| `normalize.ts` | Raw GraphQL → `CatalogProduct`; classification rules | pure |
| `affiliate-url.ts` | URL validation, Amazon detection, CTA label | pure |
| `catalog.ts` | Cursor pagination, request-scoped dedupe (`React.cache`), by-handle, related, legacy fallback | yes |
| `filter.ts` | Pure search/filter/paginate + `searchParams` parsing | pure |
| `variants.ts` | Variant selection helpers | pure |
| `cart.ts` | Cart API (create/add/update/remove/get), **purchase guard**, affiliate stripping | yes |
| `webhook.ts` | HMAC verification | yes |
| `lib/videos.ts` | Group products by video, oEmbed title lookup | yes |

Client components import only **types** and pure helpers; the Storefront token is never bundled to the browser.

### Classification rules (`classifyProduct`)

1. `custom.product_type` = `affiliate` / `shopify` is authoritative (case-insensitive).
2. Empty `product_type` **and** non-empty `custom.affiliate_url` → treated as **affiliate** (fail safe: it can never reach the cart).
3. Empty `product_type` and no affiliate URL → plain **Shopify** product (so ordinary store products work with zero setup).
4. Any other value → skipped (logged nowhere with URLs).

### Affiliate behavior

- Affiliate objects have **no price, variant, or availability fields**, so UI code can't render them. Amazon prices/ratings are never shown.
- The only outbound-link component is `AffiliateCta`: `target="_blank" rel="sponsored noopener noreferrer"`, label "View on Amazon" / "Shop at {Retailer}" / "Check Availability".
- URLs must be `https`, no credentials, public hostname (no IPs/localhost/single-label), ≤2048 chars. Optional `AFFILIATE_ALLOWED_HOSTS` restricts to specific domains. Invalid URL ⇒ product still listed, link shown as "LINK UNAVAILABLE".
- `BuyBox` accepts only `ShopifyProduct`. The cart API **independently** re-queries the variant's product metafields and rejects anything that isn't a Shopify product (`422 AFFILIATE_BLOCKED`), strips affiliate lines found in restored carts, and never accepts prices from the client.

### Caching

- Catalog `fetch` calls: `revalidate: 300`, tag `catalog`. Cart calls: `no-store`.
- `POST /api/webhooks/shopify` (HMAC-verified) calls `revalidateTag('catalog')` + `revalidatePath` so edits appear within seconds. Without the webhook, changes appear within 5 minutes.
- Pages are paginated at 100 products per GraphQL request (cap: 5,000 products). Search/filter run in-memory over the cached catalog, server-side; the browser only receives the current 24-item page.

### Routes

| Route | Type | Notes |
|---|---|---|
| `/` | ISR | Featured gear, Shopify products, video IDs from catalog |
| `/gear` | dynamic | URL-driven filters: `q, category, retailer, type, featured, page` |
| `/gear/[handle]` | dynamic | PDP, JSON-LD (offers only for Shopify products), real 404s |
| `/videos`, `/videos/[id]` | dynamic | "Shop the Video" |
| `/api/cart` | dynamic | GET restore · POST add/update/remove |
| `/api/webhooks/shopify` | dynamic | HMAC-verified revalidation |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | metadata routes | |

### Shop the Video

`custom.youtube_video_id` accepts **one or more** IDs (comma/space separated). `lib/videos.ts` inverts the relation (video → products), so one video lists many products and one product can appear under many videos, with no database and no hardcoded relationships. Titles come from YouTube's public oEmbed endpoint (cached 24h). Embeds use `youtube-nocookie.com` and load only after a click.

If you later need per-video metadata (curated title, description, chapter timestamps), the Shopify-native upgrade path is a `video` **metaobject** referenced from products by a `list.metaobject_reference` metafield. The code boundary for that change is `lib/videos.ts`.

### Animation

`motion` (Motion for React) provides scroll reveals, animated grid reflow on filter, hover lift, and the cart drawer. `MotionConfig reducedMotion="user"` honors `prefers-reduced-motion`; existing CSS also disables transitions under that setting.

## 3. Known limitations (read these)

- **Shopify cannot natively mark a product "not purchasable".** An affiliate product is still a Shopify product. The Next.js app and its cart API refuse to sell it, but if it is *published to another sales channel* (Online Store, Shop app, Buy Button, POS, Facebook/Google channels) it may be purchasable there. See `docs/SHOPIFY_SETUP.md` §5 for the mitigation (publish affiliate products **only** to the Headless/Hydrogen channel, and use a price of 0 / draft inventory settings as defense in depth).
- Hiding a button in the UI is not a security boundary; the server-side guard is. Neither controls other channels.
- Catalog search is in-memory over a cached copy (fine up to a few thousand products). Beyond that, move to Storefront `search`/`productFilters` or an external index.
- Cart IDs are in `localStorage` (not httpOnly cookies). They are bearer capabilities for a cart that holds no PII until checkout.
- Live Shopify behavior (real metafields, checkout, webhooks) is **unverified** in this repo's tests — no credentials were available. See README "Verification status".
