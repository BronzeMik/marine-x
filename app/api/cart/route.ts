import { NextResponse } from 'next/server';
import { shopEnabled } from '../../../lib/shopify/client';
import { CartError, CART_ID, addToCart, getCart, removeCartLine, updateCartLine } from '../../../lib/shopify/cart';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = { INVALID: 400, AFFILIATE_BLOCKED: 422, NOT_FOUND: 404, UNAVAILABLE: 409, SHOPIFY: 502 };

function fail(e: unknown) {
  if (e instanceof CartError) return NextResponse.json({ error: e.message, code: e.code }, { status: STATUS[e.code] ?? 400 });
  console.error('Cart error:', e instanceof Error ? e.message : 'unknown');
  return NextResponse.json({ error: 'Unable to update your bag. Please try again.' }, { status: 500 });
}

const notConfigured = () => NextResponse.json({ error: 'Shopify is not connected yet.' }, { status: 503 });

/** Restore a persisted cart. Expired/missing carts return { cart: null, expired: true }. */
export async function GET(request: Request) {
  if (!shopEnabled) return notConfigured();
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !CART_ID.test(id)) return NextResponse.json({ error: 'Invalid cart ID' }, { status: 400 });
  try {
    const cart = await getCart(id);
    return NextResponse.json(cart ? { cart } : { cart: null, expired: true });
  } catch (e) { return fail(e); }
}

/** Body: { action?: 'add' | 'update' | 'remove', cartId?, variantId?, lineId?, quantity? } */
export async function POST(request: Request) {
  if (!shopEnabled) return notConfigured();
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const action = body.action ?? 'add';
  const cartId = typeof body.cartId === 'string' ? body.cartId : undefined;
  try {
    if (action === 'add') {
      if (typeof body.variantId !== 'string') throw new CartError('INVALID', 'Invalid product variant');
      return NextResponse.json({ cart: await addToCart(cartId, body.variantId, body.quantity === undefined ? 1 : Number(body.quantity)) });
    }
    if (!cartId || typeof body.lineId !== 'string') throw new CartError('INVALID', 'Invalid request');
    if (action === 'update') return NextResponse.json({ cart: await updateCartLine(cartId, body.lineId, Number(body.quantity)) });
    if (action === 'remove') return NextResponse.json({ cart: await removeCartLine(cartId, body.lineId) });
    throw new CartError('INVALID', 'Unknown action');
  } catch (e) { return fail(e); }
}
