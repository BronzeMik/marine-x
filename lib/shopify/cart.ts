import { classifyProduct } from './normalize';
import { shopifyFetch } from './client';
import { CART_FIELDS, VARIANT_GUARD_QUERY } from './queries';
import type { Cart, CartLine, RawMetafield } from './types';

export const MAX_LINE_QUANTITY = 99;
const noStore = { cache: { noStore: true } } as const;

export type CartErrorCode = 'INVALID' | 'AFFILIATE_BLOCKED' | 'NOT_FOUND' | 'UNAVAILABLE' | 'SHOPIFY';
export class CartError extends Error {
  constructor(readonly code: CartErrorCode, message: string) {
    super(message);
    this.name = 'CartError';
  }
}

export const VARIANT_ID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
export const CART_ID = /^gid:\/\/shopify\/Cart\/[A-Za-z0-9_?=&.\-%]+$/;
export const LINE_ID = /^gid:\/\/shopify\/CartLine\/[A-Za-z0-9_?=&.\-%:]+$/;

type UserErrors = Array<{ message: string }>;
type RawLine = {
  id: string;
  quantity: number;
  merchandise: {
    id?: string; title?: string; availableForSale?: boolean;
    image?: { url: string } | null;
    price?: { amount: string; currencyCode: string };
    product?: { title: string; handle: string; productType?: RawMetafield; affiliateUrl?: RawMetafield };
  } | null;
};
type RawCart = {
  id: string; checkoutUrl: string; totalQuantity: number;
  cost: Cart['cost'];
  lines: { nodes: RawLine[] };
};

const isAffiliateLine = (l: RawLine) => {
  const p = l.merchandise?.product;
  return p ? classifyProduct({ productType: p.productType ?? null, affiliateUrl: p.affiliateUrl ?? null }) !== 'shopify' : false;
};

function toCart(raw: RawCart): Cart {
  const lines: CartLine[] = raw.lines.nodes.filter(l => l.merchandise?.id && l.merchandise.price && l.merchandise.product && !isAffiliateLine(l)).map(l => ({
    id: l.id,
    quantity: l.quantity,
    merchandise: {
      id: l.merchandise!.id!,
      title: l.merchandise!.title ?? '',
      availableForSale: Boolean(l.merchandise!.availableForSale),
      product: { title: l.merchandise!.product!.title, handle: l.merchandise!.product!.handle },
      image: l.merchandise!.image ?? null,
      price: l.merchandise!.price!,
    },
  }));
  return { id: raw.id, checkoutUrl: raw.checkoutUrl, totalQuantity: lines.reduce((n, l) => n + l.quantity, 0), cost: raw.cost, lines };
}

/**
 * Server-side purchase guard. Affiliate (or unknown) products can never enter a Shopify cart,
 * and prices/availability always come from Shopify, never from the client.
 */
export async function assertSellableVariant(variantId: string): Promise<void> {
  if (!VARIANT_ID.test(variantId)) throw new CartError('INVALID', 'Invalid product variant');
  const data = await shopifyFetch<{ node: { availableForSale: boolean; product: { productType: RawMetafield; affiliateUrl: RawMetafield } } | null }>(VARIANT_GUARD_QUERY, { variables: { id: variantId }, ...noStore });
  if (!data.node) throw new CartError('NOT_FOUND', 'That product is no longer available');
  if (classifyProduct(data.node.product) !== 'shopify') throw new CartError('AFFILIATE_BLOCKED', 'This product is sold by a partner retailer and cannot be added to the bag');
  if (!data.node.availableForSale) throw new CartError('UNAVAILABLE', 'That item is sold out');
}

function unwrap(payload: { cart: RawCart | null; userErrors: UserErrors } | null | undefined): Cart | null {
  if (!payload) throw new CartError('SHOPIFY', 'Could not update bag');
  if (payload.userErrors?.length && !payload.cart) {
    throw new CartError('INVALID', payload.userErrors.map(e => e.message).join(', ').slice(0, 200));
  }
  return payload.cart ? toCart(payload.cart) : null;
}

const q = (name: string, args: string, field: string) => /* GraphQL */ `
  mutation ${name}${args} { ${field} { cart { ${CART_FIELDS} } userErrors { message } } }
`;

async function create(variantId: string, quantity: number): Promise<Cart> {
  const d = await shopifyFetch<{ cartCreate: { cart: RawCart | null; userErrors: UserErrors } }>(
    q('CartCreate', '($lines: [CartLineInput!]!)', 'cartCreate(input: { lines: $lines })'),
    { variables: { lines: [{ merchandiseId: variantId, quantity }] }, ...noStore });
  const cart = unwrap(d.cartCreate);
  if (!cart) throw new CartError('SHOPIFY', 'Could not create bag');
  return cart;
}

const clampQty = (n: unknown) => {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 1) throw new CartError('INVALID', 'Invalid quantity');
  return Math.min(v, MAX_LINE_QUANTITY);
};

/** Adds a variant. If the supplied cart is expired/invalid a fresh cart is created transparently. */
export async function addToCart(cartId: string | undefined, variantId: string, quantity = 1): Promise<Cart> {
  const qty = clampQty(quantity);
  await assertSellableVariant(variantId);
  if (cartId) {
    if (!CART_ID.test(cartId)) throw new CartError('INVALID', 'Invalid bag');
    const d = await shopifyFetch<{ cartLinesAdd: { cart: RawCart | null; userErrors: UserErrors } | null }>(
      q('CartAdd', '($cartId: ID!, $lines: [CartLineInput!]!)', 'cartLinesAdd(cartId: $cartId, lines: $lines)'),
      { variables: { cartId, lines: [{ merchandiseId: variantId, quantity: qty }] }, ...noStore });
    const cart = d.cartLinesAdd?.cart ? unwrap(d.cartLinesAdd) : null;
    if (cart) return cart; // otherwise: cart expired or missing -> start over
  }
  return create(variantId, qty);
}

/** Set an absolute quantity for a line (0 removes it). */
export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart | null> {
  if (!CART_ID.test(cartId) || !LINE_ID.test(lineId)) throw new CartError('INVALID', 'Invalid bag');
  if (quantity === 0) return removeCartLine(cartId, lineId);
  const qty = clampQty(quantity);
  const d = await shopifyFetch<{ cartLinesUpdate: { cart: RawCart | null; userErrors: UserErrors } | null }>(
    q('CartUpdate', '($cartId: ID!, $lines: [CartLineUpdateInput!]!)', 'cartLinesUpdate(cartId: $cartId, lines: $lines)'),
    { variables: { cartId, lines: [{ id: lineId, quantity: qty }] }, ...noStore });
  return d.cartLinesUpdate ? unwrap(d.cartLinesUpdate) : null;
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart | null> {
  if (!CART_ID.test(cartId) || !LINE_ID.test(lineId)) throw new CartError('INVALID', 'Invalid bag');
  const d = await shopifyFetch<{ cartLinesRemove: { cart: RawCart | null; userErrors: UserErrors } | null }>(
    q('CartRemove', '($cartId: ID!, $lineIds: [ID!]!)', 'cartLinesRemove(cartId: $cartId, lineIds: $lineIds)'),
    { variables: { cartId, lineIds: [lineId] }, ...noStore });
  return d.cartLinesRemove ? unwrap(d.cartLinesRemove) : null;
}

/**
 * Revalidates a persisted cart. Returns null when the cart has expired/is gone.
 * Any non-Shopify (affiliate) lines found are stripped from the response.
 */
export async function getCart(cartId: string): Promise<Cart | null> {
  if (!CART_ID.test(cartId)) return null;
  const d = await shopifyFetch<{ cart: RawCart | null }>(`query GetCart($cartId: ID!) { cart(id: $cartId) { ${CART_FIELDS} } }`, { variables: { cartId }, ...noStore });
  if (!d.cart) return null;
  const stray = d.cart.lines.nodes.filter(isAffiliateLine);
  if (stray.length) {
    const r = await shopifyFetch<{ cartLinesRemove: { cart: RawCart | null; userErrors: UserErrors } | null }>(
      q('CartRemove', '($cartId: ID!, $lineIds: [ID!]!)', 'cartLinesRemove(cartId: $cartId, lineIds: $lineIds)'),
      { variables: { cartId, lineIds: stray.map(l => l.id) }, ...noStore }).catch(() => null);
    if (r?.cartLinesRemove?.cart) return toCart(r.cartLinesRemove.cart);
  }
  return toCart(d.cart);
}
