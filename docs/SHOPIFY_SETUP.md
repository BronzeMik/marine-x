# Shopify Setup Guide

Nothing here is applied automatically. Creating metafield definitions or webhooks needs Admin permissions the website deliberately does not hold. Do these steps yourself in Shopify Admin.

## 1. Storefront API access

1. Shopify Admin → **Settings → Apps and sales channels → Develop apps** (or install the **Headless** channel from the Shopify App Store).
2. Create an app / storefront → **Storefront API** → enable scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_product_tags`
   - `unauthenticated_write_checkouts` and `unauthenticated_read_checkouts` (Cart API)
   - `unauthenticated_read_metaobjects` (only if you adopt metaobjects later)
3. Copy the **public Storefront access token**.
4. Set in `.env.local` / hosting env:
   ```
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
   ```
   Do **not** use `NEXT_PUBLIC_` for these. The Admin API token is never needed and must never be added to this project.

## 2. Create the metafield definitions

**Settings → Custom data → Products → Add definition.** Namespace and key must match exactly (`custom.<key>`).

| Name | Namespace and key | Type | Storefront access |
|---|---|---|---|
| Product type | `custom.product_type` | Single line text (validation: choices `affiliate`, `shopify` if you like) | **Enable "Storefront API" access** |
| Affiliate URL | `custom.affiliate_url` | URL | Storefront access |
| Retailer | `custom.retailer` | Single line text | Storefront access |
| YouTube video ID | `custom.youtube_video_id` | Single line text | Storefront access |
| Featured | `custom.featured` | True or false | Storefront access |
| Gear category | `custom.gear_category` | Single line text | Storefront access |

> **Critical:** each definition must have **Storefront API access enabled** (checkbox on the definition). Otherwise the Storefront API returns `null` for it and every affiliate product will look like a plain Shopify product with no link. Troubleshooting: `docs/DEPLOYMENT.md`.

## 3. Publish products to the right channel

Products appear on the site only when **published to the sales channel your Storefront token belongs to** (the Headless channel, or the custom app's publication). In the product page → **Sales channels and apps**, make sure that channel is ticked.

## 4. Webhooks (optional, makes edits appear immediately)

1. **Settings → Notifications → Webhooks → Create webhook**, format JSON, URL `https://YOUR-SITE/api/webhooks/shopify`, for events: *Product creation*, *Product update*, *Product deletion* (and *Inventory levels update* if desired).
2. Copy the **signing secret** shown at the bottom of the Webhooks page into `SHOPIFY_WEBHOOK_SECRET`. (If you create webhooks through a custom app instead, use that app's *API secret key*.)
3. Redeploy. Requests with a bad/missing signature get `401`.

Without webhooks, changes appear within 5 minutes (`CATALOG_REVALIDATE_SECONDS`).

## 5. Keeping affiliate products from being sold by Shopify

Shopify has no "link-out only" product type. The site never sells affiliate products (UI + server guard), but Shopify itself doesn't know that. Reduce exposure:

1. **Publish affiliate products only to the Headless (or custom-app) channel.** Untick Online Store, Shop, POS, Google & YouTube, Facebook & Instagram. This is the most important step.
2. Tag them `affiliate` (for admin filtering) and consider a **Smart collection** "Affiliate" with condition tag = `affiliate`.
3. Defense in depth: set inventory tracking on with **0 stock** and "Continue selling when out of stock" **off**, so even an accidental checkout would fail. (Variant price can stay as a placeholder like `0.01`; the site never displays it.)
4. Use a **Product template/theme exclusion**: if you keep an Online Store theme, make sure affiliate products are not published there (step 1).

Limits: someone with the product's `gid` and the Storefront token could still build a cart outside this site if inventory allows. The measures above, not the Next.js app, are what prevent that.

## 6. Collections

Collections are optional in V4; the site categorizes via `custom.gear_category`. You can still organize in Admin (smart collections by tag/vendor). If you want collection pages later, add a `collection(handle:)` query in `lib/shopify/queries.ts`.
