import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { findVariant, initialSelection, isOptionValueAvailable } from '../lib/shopify/variants';
import { verifyShopifyWebhook } from '../lib/shopify/webhook';
import { normalizeProduct } from '../lib/shopify/normalize';
import type { ShopifyProduct } from '../lib/shopify/types';
import { rawShopify } from './fixtures';

const product = normalizeProduct(rawShopify()) as ShopifyProduct;

describe('variant selection', () => {
  it('starts from the default (first available) variant', () => {
    expect(initialSelection(product)).toEqual({ Size: 'M' });
  });
  it('finds the matching variant, or undefined', () => {
    expect(findVariant(product, { Size: 'L' })?.id).toBe('gid://shopify/ProductVariant/23');
    expect(findVariant(product, { Size: 'XL' })).toBeUndefined();
  });
  it('reports option value availability', () => {
    expect(isOptionValueAvailable(product, {}, 'Size', 'S')).toBe(false);
    expect(isOptionValueAvailable(product, {}, 'Size', 'M')).toBe(true);
  });
  it('considers other selected options', () => {
    const multi = normalizeProduct(rawShopify({
      options: [{ name: 'Color', values: ['Black', 'Tan'] }, { name: 'Size', values: ['M', 'L'] }],
      variants: { nodes: [
        { id: 'gid://shopify/ProductVariant/31', title: 'Black / M', availableForSale: true, price: { amount: '1', currencyCode: 'USD' }, selectedOptions: [{ name: 'Color', value: 'Black' }, { name: 'Size', value: 'M' }] },
        { id: 'gid://shopify/ProductVariant/32', title: 'Tan / L', availableForSale: true, price: { amount: '1', currencyCode: 'USD' }, selectedOptions: [{ name: 'Color', value: 'Tan' }, { name: 'Size', value: 'L' }] },
      ] },
    })) as ShopifyProduct;
    expect(isOptionValueAvailable(multi, { Color: 'Black' }, 'Size', 'L')).toBe(false);
    expect(isOptionValueAvailable(multi, { Color: 'Black' }, 'Size', 'M')).toBe(true);
    expect(findVariant(multi, { Color: 'Tan', Size: 'L' })?.id).toBe('gid://shopify/ProductVariant/32');
  });
});

describe('verifyShopifyWebhook', () => {
  const secret = 'shhh';
  const body = JSON.stringify({ id: 1, title: 'x' });
  const sign = (b: string, s = secret) => createHmac('sha256', s).update(b, 'utf8').digest('base64');

  it('accepts a valid signature', () => { expect(verifyShopifyWebhook(body, sign(body), secret)).toBe(true); });
  it('rejects a tampered body, wrong secret, and malformed or missing headers', () => {
    expect(verifyShopifyWebhook(body + ' ', sign(body), secret)).toBe(false);
    expect(verifyShopifyWebhook(body, sign(body, 'other'), secret)).toBe(false);
    expect(verifyShopifyWebhook(body, 'not-base64!!', secret)).toBe(false);
    expect(verifyShopifyWebhook(body, '', secret)).toBe(false);
    expect(verifyShopifyWebhook(body, null, secret)).toBe(false);
  });
  it('fails closed when no secret is configured', () => { expect(verifyShopifyWebhook(body, sign(body), undefined)).toBe(false); });
});
