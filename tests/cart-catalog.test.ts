import { beforeEach, describe, expect, it, vi } from 'vitest';

const shopifyFetch = vi.fn();
vi.mock('../lib/shopify/client', () => ({ shopifyFetch: (...a: unknown[]) => shopifyFetch(...a), shopEnabled: true, shopDomain: 'x.myshopify.com', CATALOG_TAG: 'catalog' }));

import { CartError, addToCart, getCart, removeCartLine, updateCartLine } from '../lib/shopify/cart';
import { fetchAllProducts } from '../lib/shopify/catalog';
import { rawAffiliate, rawShopify } from './fixtures';

const VARIANT = 'gid://shopify/ProductVariant/22';
const AFF_VARIANT = 'gid://shopify/ProductVariant/11';
const CART = 'gid://shopify/Cart/abc123?key=k';
const LINE = 'gid://shopify/CartLine/line1?cart=abc123';

const guard = (over: Record<string, unknown> = {}) => ({ node: { id: VARIANT, availableForSale: true, product: { productType: { value: 'shopify' }, affiliateUrl: null }, ...over } });
const rawCart = (lines: unknown[] = []) => ({ id: CART, checkoutUrl: 'https://x.myshopify.com/cart/c/abc', totalQuantity: 0, cost: { subtotalAmount: { amount: '30.00', currencyCode: 'USD' } }, lines: { nodes: lines } });
const line = (id: string, product: Record<string, unknown>) => ({ id, quantity: 2, merchandise: { id: VARIANT, title: 'M', availableForSale: true, image: null, price: { amount: '30.00', currencyCode: 'USD' }, product: { title: 'Tee', handle: 'tee', ...product } } });

beforeEach(() => shopifyFetch.mockReset());

describe('cart: affiliate exclusion', () => {
  it('rejects affiliate variants server-side, before any mutation', async () => {
    shopifyFetch.mockResolvedValueOnce(guard({ product: { productType: { value: 'affiliate' }, affiliateUrl: { value: 'https://amazon.com/x' } } }));
    await expect(addToCart(undefined, AFF_VARIANT)).rejects.toMatchObject({ code: 'AFFILIATE_BLOCKED' });
    expect(shopifyFetch).toHaveBeenCalledTimes(1); // only the guard query
  });
  it('rejects products with an affiliate URL but no product_type (fail safe)', async () => {
    shopifyFetch.mockResolvedValueOnce(guard({ product: { productType: null, affiliateUrl: { value: 'https://amazon.com/x' } } }));
    await expect(addToCart(undefined, AFF_VARIANT)).rejects.toBeInstanceOf(CartError);
  });
  it('rejects unknown variants, sold-out variants and malformed IDs', async () => {
    shopifyFetch.mockResolvedValueOnce({ node: null });
    await expect(addToCart(undefined, VARIANT)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    shopifyFetch.mockResolvedValueOnce(guard({ availableForSale: false }));
    await expect(addToCart(undefined, VARIANT)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await expect(addToCart(undefined, 'gid://shopify/Product/1')).rejects.toMatchObject({ code: 'INVALID' });
    await expect(addToCart(undefined, VARIANT, 0)).rejects.toMatchObject({ code: 'INVALID' });
  });
  it('strips affiliate lines that somehow exist in a restored cart', async () => {
    const aff = line('gid://shopify/CartLine/bad', { productType: { value: 'affiliate' }, affiliateUrl: { value: 'https://a.com' } });
    const ok = line(LINE, { productType: { value: 'shopify' } });
    shopifyFetch.mockResolvedValueOnce({ cart: rawCart([ok, aff]) });
    shopifyFetch.mockResolvedValueOnce({ cartLinesRemove: { cart: rawCart([ok]), userErrors: [] } });
    const cart = await getCart(CART);
    expect(cart?.lines.map(l => l.id)).toEqual([LINE]);
    expect(shopifyFetch.mock.calls[1][1].variables.lineIds).toEqual(['gid://shopify/CartLine/bad']);
  });
});

describe('cart: persistence and recovery', () => {
  it('creates a cart when none exists', async () => {
    shopifyFetch.mockResolvedValueOnce(guard());
    shopifyFetch.mockResolvedValueOnce({ cartCreate: { cart: rawCart([line(LINE, { productType: { value: 'shopify' } })]), userErrors: [] } });
    const cart = await addToCart(undefined, VARIANT, 2);
    expect(cart.totalQuantity).toBe(2);
    expect(shopifyFetch.mock.calls[1][1].variables.lines).toEqual([{ merchandiseId: VARIANT, quantity: 2 }]);
  });
  it('adds to an existing cart', async () => {
    shopifyFetch.mockResolvedValueOnce(guard());
    shopifyFetch.mockResolvedValueOnce({ cartLinesAdd: { cart: rawCart(), userErrors: [] } });
    expect((await addToCart(CART, VARIANT)).id).toBe(CART);
    expect(shopifyFetch).toHaveBeenCalledTimes(2);
  });
  it('transparently starts a fresh cart when the persisted one has expired', async () => {
    shopifyFetch.mockResolvedValueOnce(guard());
    shopifyFetch.mockResolvedValueOnce({ cartLinesAdd: { cart: null, userErrors: [{ message: 'The specified cart does not exist.' }] } });
    shopifyFetch.mockResolvedValueOnce({ cartCreate: { cart: { ...rawCart(), id: 'gid://shopify/Cart/new' }, userErrors: [] } });
    expect((await addToCart(CART, VARIANT)).id).toBe('gid://shopify/Cart/new');
  });
  it('returns null for an expired cart on restore and ignores malformed IDs', async () => {
    shopifyFetch.mockResolvedValueOnce({ cart: null });
    expect(await getCart(CART)).toBeNull();
    expect(await getCart('not-a-cart')).toBeNull();
    expect(shopifyFetch).toHaveBeenCalledTimes(1);
  });
  it('updates quantity, removes on zero, and validates IDs', async () => {
    shopifyFetch.mockResolvedValueOnce({ cartLinesUpdate: { cart: rawCart(), userErrors: [] } });
    await updateCartLine(CART, LINE, 3);
    expect(shopifyFetch.mock.calls[0][1].variables.lines).toEqual([{ id: LINE, quantity: 3 }]);
    shopifyFetch.mockResolvedValueOnce({ cartLinesRemove: { cart: rawCart(), userErrors: [] } });
    await updateCartLine(CART, LINE, 0);
    expect(shopifyFetch.mock.calls[1][1].variables.lineIds).toEqual([LINE]);
    await expect(removeCartLine('bad', LINE)).rejects.toMatchObject({ code: 'INVALID' });
  });
  it('never trusts client prices: no price field is ever sent to Shopify', async () => {
    shopifyFetch.mockResolvedValueOnce(guard());
    shopifyFetch.mockResolvedValueOnce({ cartCreate: { cart: rawCart(), userErrors: [] } });
    await addToCart(undefined, VARIANT);
    expect(JSON.stringify(shopifyFetch.mock.calls[1][1].variables)).not.toMatch(/price|amount/i);
  });
});

describe('catalog pagination', () => {
  it('follows cursors until the catalog is exhausted', async () => {
    const page = (n: number, next: string | null) => ({ products: { pageInfo: { hasNextPage: Boolean(next), endCursor: next }, nodes: [rawShopify({ id: `gid://shopify/Product/${n}`, handle: `p-${n}` }), rawAffiliate({ id: `gid://shopify/Product/a${n}`, handle: `a-${n}` })] } });
    const fetcher = vi.fn()
      .mockResolvedValueOnce(page(1, 'c1'))
      .mockResolvedValueOnce(page(2, 'c2'))
      .mockResolvedValueOnce(page(3, null));
    const all = await fetchAllProducts(fetcher as never);
    expect(all).toHaveLength(6);
    expect(fetcher.mock.calls.map(c => c[1].variables.after)).toEqual([null, 'c1', 'c2']);
  });
  it('skips malformed records without failing the whole catalog', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [rawShopify({ productType: { value: 'bogus' } }), rawShopify()] } });
    expect(await fetchAllProducts(fetcher as never)).toHaveLength(1);
  });
  it('propagates API errors to the caller', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Shopify HTTP 500'));
    await expect(fetchAllProducts(fetcher as never)).rejects.toThrow('Shopify HTTP 500');
  });
});
