# Managing Products (no code, no redeploy)

## Add an affiliate recommendation

1. Shopify Admin → **Products → Add product**.
2. **Title**, **Description** (shown on the site), **Media** (your own or licensed images — see image rules below).
3. **Vendor** = the brand (e.g. "SureFire"). Price can be a placeholder; it is never shown for affiliate items.
4. Scroll to **Metafields** and fill in:
   - **Product type** → `affiliate`
   - **Affiliate URL** → your tracking link (https only)
   - **Retailer** → "Amazon", "Walmart", brand name… (auto-detected from the URL if left blank)
   - **Gear category** → EDC, Bags, Lighting, Tools, Preparedness, …
   - **YouTube video ID** → the 11 characters after `v=` in the video URL. Several videos: separate with commas.
   - **Featured** → tick to show on the home page and rank first in `/gear`.
5. **Sales channels**: publish only to Headless/your storefront channel (see `SHOPIFY_SETUP.md` §5).
6. **Save.** Visible on the site within 5 minutes, or seconds if webhooks are configured.

## Add a Marine X product you sell

Create the product normally (price, variants, inventory, images). Set **Product type** = `shopify` (or leave metafields blank). Publish to the Headless channel. It appears in the home "Shop" section and `/gear?type=shopify`, with variant selection, quantity, bag, and Shopify checkout.

## Update an affiliate link

Edit the product → change **Affiliate URL** → Save. Nothing else.

## Shop the Video

Put a video's ID on every product mentioned in it. `/videos` lists all videos; `/videos/{id}` shows the embed and all its gear. Add a second ID to feature the same product in another video.

## Rules to stay compliant

- **Amazon:** the site never shows Amazon prices, ratings, or review counts, and does not scrape. Don't paste them into descriptions. Use only Associates-approved images/links; the site shows the Associates disclosure sentence.
- Other networks: check their terms for price/image display before adding them to descriptions.
- Never invent ratings, reviews, or discounts. The structured data on product pages contains only fields that exist.
- URLs that fail validation (`http://`, IPs, `javascript:`, credentials, or not on `AFFILIATE_ALLOWED_HOSTS` if set) show "LINK UNAVAILABLE" instead of a button.
- Affiliate links are never logged by the server.

## Categories & retailers

Both are free text; whatever you type becomes a filter option on `/gear`. Keep spelling consistent (`EDC`, not `Edc`/`E.D.C.`); filters match case-insensitively, but the label shown is taken as written.
