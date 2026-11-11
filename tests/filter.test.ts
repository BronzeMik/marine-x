import { describe, expect, it } from 'vitest';
import { filterCatalog, parseFilters } from '../lib/shopify/filter';
import { normalizeProduct } from '../lib/shopify/normalize';
import type { CatalogProduct } from '../lib/shopify/types';
import { rawAffiliate, rawShopify } from './fixtures';

const make = (n: number): CatalogProduct[] =>
  Array.from({ length: n }, (_, i) => normalizeProduct(rawAffiliate({
    id: `gid://shopify/Product/${100 + i}`, handle: `item-${i}`, title: `Item ${String(i).padStart(3, '0')}`,
    gearCategory: { value: i % 2 ? 'Bags' : 'Lighting' }, retailer: { value: i % 3 ? 'Amazon' : 'Walmart' },
    featured: { value: i === 4 ? 'true' : 'false' }, youtubeVideoId: { value: i === 7 ? 'abcdefghijk' : '' },
  }))!);

describe('filterCatalog', () => {
  const catalog = [...make(60), normalizeProduct(rawShopify())!];

  it('defaults to affiliate products only', () => {
    const r = filterCatalog(catalog);
    expect(r.items.every(p => p.type === 'affiliate')).toBe(true);
    expect(r.total).toBe(60);
  });
  it('filters by product type', () => {
    expect(filterCatalog(catalog, { type: 'shopify' }).items.map(p => p.handle)).toEqual(['marinex-tee']);
    expect(filterCatalog(catalog, { type: 'all' }).total).toBe(61);
  });
  it('paginates and clamps out-of-range pages', () => {
    const p1 = filterCatalog(catalog, { page: 1, pageSize: 24 });
    expect(p1.items).toHaveLength(24);
    expect(p1.pageCount).toBe(3);
    const p3 = filterCatalog(catalog, { page: 3, pageSize: 24 });
    expect(p3.items).toHaveLength(12);
    expect(filterCatalog(catalog, { page: 99, pageSize: 24 }).page).toBe(3);
    expect(filterCatalog(catalog, { page: -5 }).page).toBe(1);
    const ids = new Set([...p1.items, ...filterCatalog(catalog, { page: 2 }).items, ...p3.items].map(p => p.id));
    expect(ids.size).toBe(60);
  });
  it('searches case-insensitively; every term must match', () => {
    expect(filterCatalog(catalog, { q: 'ITEM 007' }).items.map(p => p.title)).toEqual(['Item 007']);
    expect(filterCatalog(catalog, { q: 'item nonexistent' }).total).toBe(0);
  });
  it('filters by category, retailer, featured and video', () => {
    expect(filterCatalog(catalog, { category: 'bags', pageSize: 100 }).total).toBe(30);
    expect(filterCatalog(catalog, { retailer: 'walmart', pageSize: 100 }).total).toBe(20);
    expect(filterCatalog(catalog, { featured: true }).items.map(p => p.title)).toEqual(['Item 004']);
    expect(filterCatalog(catalog, { video: 'abcdefghijk' }).items.map(p => p.title)).toEqual(['Item 007']);
  });
  it('puts featured products first and computes facets', () => {
    expect(filterCatalog(catalog).items[0].title).toBe('Item 004');
    expect(filterCatalog(catalog).facets).toEqual({ categories: ['Bags', 'Lighting'], retailers: ['Amazon', 'Walmart'] });
  });
  it('returns an empty, well-formed result', () => {
    const r = filterCatalog(catalog, { q: 'zzzz' });
    expect(r).toMatchObject({ items: [], total: 0, page: 1, pageCount: 1 });
  });
  it('stays fast on a large catalog', () => {
    const big = make(5000);
    const t = performance.now();
    filterCatalog(big, { q: 'item 4999' });
    expect(performance.now() - t).toBeLessThan(500);
  });
});

describe('parseFilters', () => {
  it('parses and sanitizes search params', () => {
    expect(parseFilters({ q: 'light', category: ['EDC', 'x'], type: 'shopify', featured: '1', page: '3' })).toMatchObject({ q: 'light', category: 'EDC', type: 'shopify', featured: true, page: 3 });
    expect(parseFilters({ type: 'bogus', page: 'abc' })).toMatchObject({ type: 'affiliate', page: 1, featured: false });
  });
});
