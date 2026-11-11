import { cache } from 'react';
import { affiliateProducts as legacyAffiliate } from '../affiliate';
import { CATALOG_TAG, shopEnabled, shopifyFetch } from './client';
import { filterCatalog, type CatalogFilters, type CatalogResult } from './filter';
import { normalizeProduct, normalizeProducts } from './normalize';
import { PRODUCTS_PAGE_QUERY, PRODUCT_BY_HANDLE_QUERY } from './queries';
import type { AffiliateProduct, CatalogProduct, RawProduct, ShopifyProduct } from './types';
import { validateAffiliateUrl } from './affiliate-url';

const PAGE = 100;
const MAX_PAGES = 50; // safety cap: 5,000 products

type PageData = { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawProduct[] } };

/** Follows cursors until the catalog is exhausted. One request per 100 products (no N+1). */
export async function fetchAllProducts(fetcher: typeof shopifyFetch = shopifyFetch): Promise<CatalogProduct[]> {
  const out: CatalogProduct[] = [];
  let after: string | null = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const data: PageData = await fetcher<PageData>(PRODUCTS_PAGE_QUERY, { variables: { first: PAGE, after } });
    out.push(...normalizeProducts(data.products.nodes));
    if (!data.products.pageInfo.hasNextPage || !data.products.pageInfo.endCursor) break;
    after = data.products.pageInfo.endCursor;
  }
  return out;
}

/** Transitional fallback: the old hardcoded catalog, used only when Shopify is not configured. */
function legacyCatalog(): AffiliateProduct[] {
  return legacyAffiliate.map(p => {
    const url = validateAffiliateUrl(p.affiliateUrl);
    return {
      type: 'affiliate' as const,
      id: `legacy-${p.id}`,
      handle: p.id,
      title: p.name,
      description: p.description,
      images: [p.image],
      vendor: p.brand,
      retailer: p.merchant,
      affiliateUrl: url,
      isAmazon: false,
      category: p.category,
      featured: Boolean(p.featured),
      youtubeVideoId: p.videoId,
      videoIds: p.videoId ? [p.videoId] : [],
    };
  });
}

export type CatalogState = { products: CatalogProduct[]; source: 'shopify' | 'legacy' | 'error' };

/** Deduped per request via React cache; cross-request caching is the fetch data cache (tag: catalog). */
export const getCatalog = cache(async (): Promise<CatalogState> => {
  if (!shopEnabled) return { products: legacyCatalog(), source: 'legacy' };
  try {
    return { products: await fetchAllProducts(), source: 'shopify' };
  } catch (e) {
    console.error('Catalog fetch failed:', e instanceof Error ? e.message : 'unknown error');
    return { products: [], source: 'error' };
  }
});

export async function queryCatalog(filters: CatalogFilters): Promise<CatalogResult & { source: CatalogState['source'] }> {
  const { products, source } = await getCatalog();
  return { ...filterCatalog(products, filters), source };
}

export const getProductByHandle = cache(async (handle: string): Promise<CatalogProduct | null> => {
  if (!/^[a-z0-9][a-z0-9-_]*$/i.test(handle)) return null;
  if (!shopEnabled) return legacyCatalog().find(p => p.handle === handle) ?? null;
  try {
    const data = await shopifyFetch<{ product: RawProduct | null }>(PRODUCT_BY_HANDLE_QUERY, { variables: { handle }, cache: { tags: [CATALOG_TAG, `product:${handle}`] } });
    return normalizeProduct(data.product);
  } catch (e) {
    console.error('Product fetch failed:', e instanceof Error ? e.message : 'unknown error');
    return null;
  }
});

export async function getShopProducts(limit = 8): Promise<ShopifyProduct[]> {
  const { products } = await getCatalog();
  return products.filter((p): p is ShopifyProduct => p.type === 'shopify').slice(0, limit);
}

export async function getFeaturedGear(limit = 6): Promise<AffiliateProduct[]> {
  const { products } = await getCatalog();
  return products.filter((p): p is AffiliateProduct => p.type === 'affiliate' && p.featured).slice(0, limit);
}

/** Related items: same category first, then same video, excluding the product itself. */
export async function getRelated(product: CatalogProduct, limit = 4): Promise<CatalogProduct[]> {
  const { products } = await getCatalog();
  const others = products.filter(p => p.id !== product.id && p.type === product.type);
  const score = (p: CatalogProduct) => (p.category === product.category ? 2 : 0) + (p.videoIds.some(v => product.videoIds.includes(v)) ? 1 : 0);
  return others.map(p => ({ p, s: score(p) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, limit).map(x => x.p);
}
