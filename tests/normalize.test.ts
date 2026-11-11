import { describe, expect, it } from 'vitest';
import { classifyProduct, normalizeProduct, normalizeProducts, parseVideoIds } from '../lib/shopify/normalize';
import { rawAffiliate, rawShopify } from './fixtures';

describe('normalizeProduct', () => {
  it('normalizes an affiliate product with all metafields', () => {
    const p = normalizeProduct(rawAffiliate());
    expect(p).toMatchObject({ type: 'affiliate', handle: 'test-flashlight', retailer: 'Amazon', isAmazon: true, category: 'Lighting', featured: true, youtubeVideoId: 'dQw4w9WgXcQ', vendor: 'Acme' });
    expect(p && p.type === 'affiliate' && p.affiliateUrl).toContain('amazon.com');
    // Affiliate products never carry price/variant data.
    expect(p).not.toHaveProperty('price');
    expect(p).not.toHaveProperty('variantId');
  });

  it('normalizes a Shopify product with variants, default available variant and lowest price', () => {
    const p = normalizeProduct(rawShopify());
    expect(p?.type).toBe('shopify');
    if (p?.type !== 'shopify') throw new Error('expected shopify');
    expect(p.variantId).toBe('gid://shopify/ProductVariant/22'); // first available
    expect(p.price.amount).toBe('30.00');
    expect(p.availableForSale).toBe(true);
    expect(p.variants).toHaveLength(3);
    expect(p.options).toEqual([{ name: 'Size', values: ['S', 'M', 'L'] }]);
  });

  it('marks fully sold-out products unavailable and hides the default-title option', () => {
    const raw = rawShopify({
      options: [{ name: 'Title', values: ['Default Title'] }],
      variants: { nodes: [{ id: 'gid://shopify/ProductVariant/9', title: 'Default Title', availableForSale: false, price: { amount: '5.00', currencyCode: 'USD' } }] },
    });
    const p = normalizeProduct(raw);
    if (p?.type !== 'shopify') throw new Error('expected shopify');
    expect(p.availableForSale).toBe(false);
    expect(p.variantId).toBe('gid://shopify/ProductVariant/9');
    expect(p.options).toEqual([]);
  });

  it('handles missing optional metadata gracefully', () => {
    const p = normalizeProduct(rawAffiliate({ images: undefined, retailer: null, youtubeVideoId: null, featured: null, gearCategory: null, vendor: null, description: undefined as unknown as string }));
    expect(p).toMatchObject({ images: [], category: 'Gear', featured: false, vendor: '', description: '', videoIds: [] });
    expect(p?.type === 'affiliate' && p.retailer).toBe('Amazon'); // derived from the URL
  });

  it('keeps an affiliate product with a malformed URL but removes the link', () => {
    for (const bad of ['javascript:alert(1)', 'http://insecure.com/x', 'not a url', 'https://user:pw@evil.com/', 'https://localhost/x']) {
      const p = normalizeProduct(rawAffiliate({ affiliateUrl: { value: bad } }));
      expect(p?.type).toBe('affiliate');
      expect(p?.type === 'affiliate' && p.affiliateUrl).toBeNull();
    }
  });

  it('drops malformed video IDs and boolean junk', () => {
    const p = normalizeProduct(rawAffiliate({ youtubeVideoId: { value: 'short, dQw4w9WgXcQ, <script>' }, featured: { value: 'yes' } }));
    expect(p?.videoIds).toEqual(['dQw4w9WgXcQ']);
    expect(p?.featured).toBe(false);
  });

  it('skips unusable records', () => {
    expect(normalizeProduct(null)).toBeNull();
    expect(normalizeProduct(rawShopify({ handle: '' }))).toBeNull();
    expect(normalizeProduct(rawShopify({ variants: { nodes: [] } }))).toBeNull();
    expect(normalizeProduct(rawShopify({ productType: { value: 'bogus' } }))).toBeNull();
    expect(normalizeProducts([null, rawShopify(), undefined])).toHaveLength(1);
  });
});

describe('classifyProduct', () => {
  it('trusts product_type when set (case-insensitive)', () => {
    expect(classifyProduct({ productType: { value: 'Affiliate' }, affiliateUrl: null })).toBe('affiliate');
    expect(classifyProduct({ productType: { value: 'shopify' }, affiliateUrl: { value: 'https://x.com' } })).toBe('shopify');
  });
  it('treats missing type + affiliate URL as affiliate (fail safe)', () => {
    expect(classifyProduct({ productType: null, affiliateUrl: { value: 'https://amazon.com/x' } })).toBe('affiliate');
  });
  it('treats missing type and URL as a plain Shopify product', () => {
    expect(classifyProduct({ productType: null, affiliateUrl: null })).toBe('shopify');
    expect(classifyProduct({ productType: { value: '  ' }, affiliateUrl: { value: '' } })).toBe('shopify');
  });
  it('flags unknown values', () => {
    expect(classifyProduct({ productType: { value: 'other' }, affiliateUrl: null })).toBe('unknown');
  });
});

describe('parseVideoIds', () => {
  it('splits, validates and dedupes', () => {
    expect(parseVideoIds('dQw4w9WgXcQ dQw4w9WgXcQ,abcdefghijk')).toEqual(['dQw4w9WgXcQ', 'abcdefghijk']);
  });
});
