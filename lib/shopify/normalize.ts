import { isAmazonHost, retailerFromUrl, validateAffiliateUrl } from './affiliate-url';
import type { AffiliateProduct, CatalogProduct, RawMetafield, RawProduct, ShopifyProduct } from './types';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const mf = (m: RawMetafield | undefined): string => (m && typeof m.value === 'string' ? m.value.trim() : '');

/** Accepts one ID or several separated by commas/whitespace. Invalid IDs are dropped. */
export function parseVideoIds(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const id = part.trim();
    if (VIDEO_ID.test(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function parseBoolean(raw: string): boolean {
  return raw.toLowerCase() === 'true';
}

export type ProductKind = 'affiliate' | 'shopify' | 'unknown';

/**
 * Classification rules (documented in docs/ARCHITECTURE.md):
 *  1. custom.product_type = "affiliate" | "shopify" is authoritative (case-insensitive).
 *  2. Missing/empty product_type + a non-empty affiliate_url => affiliate (fail safe: never cart-able).
 *  3. Missing/empty product_type and no affiliate_url => shopify (plain Shopify product).
 *  4. Any other value => unknown, and the product is skipped.
 */
export function classifyProduct(raw: Pick<RawProduct, 'productType' | 'affiliateUrl'>): ProductKind {
  const t = mf(raw.productType).toLowerCase();
  if (t === 'affiliate') return 'affiliate';
  if (t === 'shopify') return 'shopify';
  if (t === '') return mf(raw.affiliateUrl) ? 'affiliate' : 'shopify';
  return 'unknown';
}

function images(raw: RawProduct): string[] {
  return (raw.images?.nodes ?? []).map(i => i?.url).filter((u): u is string => typeof u === 'string' && u.startsWith('https://'));
}

export function normalizeProduct(raw: RawProduct | null | undefined): CatalogProduct | null {
  if (!raw || typeof raw.id !== 'string' || typeof raw.handle !== 'string' || !raw.handle) return null;
  const kind = classifyProduct(raw);
  if (kind === 'unknown') return null;

  const videoIds = parseVideoIds(mf(raw.youtubeVideoId));
  const base = {
    id: raw.id,
    handle: raw.handle,
    title: raw.title?.trim() || 'Untitled',
    description: raw.description?.trim() ?? '',
    images: images(raw),
    vendor: raw.vendor?.trim() ?? '',
    category: mf(raw.gearCategory) || 'Gear',
    featured: parseBoolean(mf(raw.featured)),
    youtubeVideoId: videoIds[0],
    videoIds,
  };

  if (kind === 'affiliate') {
    const url = validateAffiliateUrl(mf(raw.affiliateUrl));
    const product: AffiliateProduct = {
      ...base,
      type: 'affiliate',
      retailer: mf(raw.retailer) || retailerFromUrl(url),
      affiliateUrl: url,
      isAmazon: isAmazonHost(url) || mf(raw.retailer).toLowerCase() === 'amazon',
    };
    return product;
  }

  const variants = (raw.variants?.nodes ?? []).map(v => ({
    id: v.id,
    title: v.title,
    availableForSale: Boolean(v.availableForSale),
    price: { amount: v.price.amount, currencyCode: v.price.currencyCode },
    selectedOptions: v.selectedOptions ?? [],
  }));
  if (!variants.length) return null; // a sellable product needs at least one variant
  const defaultVariant = variants.find(v => v.availableForSale) ?? variants[0];
  const lowest = variants.reduce((min, v) => (Number(v.price.amount) < Number(min.price.amount) ? v : min), variants[0]);
  const options = (raw.options ?? [])
    .map(o => ({ name: o.name, values: o.values ?? o.optionValues?.map(v => v.name) ?? [] }))
    .filter(o => !(o.name === 'Title' && o.values.length === 1 && o.values[0] === 'Default Title'));

  const product: ShopifyProduct = {
    ...base,
    type: 'shopify',
    price: lowest.price,
    availableForSale: variants.some(v => v.availableForSale),
    variantId: defaultVariant.id,
    variants,
    options,
  };
  return product;
}

export function normalizeProducts(nodes: Array<RawProduct | null | undefined>): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  for (const n of nodes) {
    const p = normalizeProduct(n);
    if (p) out.push(p);
  }
  return out;
}

export const isAffiliate = (p: CatalogProduct): p is AffiliateProduct => p.type === 'affiliate';
export const isShopify = (p: CatalogProduct): p is ShopifyProduct => p.type === 'shopify';
