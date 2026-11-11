import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CATALOG_TAG } from '../../../../lib/shopify/client';
import { verifyShopifyWebhook } from '../../../../lib/shopify/webhook';

export const dynamic = 'force-dynamic';

/**
 * Shopify webhook receiver (products/create, products/update, products/delete, collections/*).
 * Signature is verified against the raw body before anything else happens.
 */
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });

  const raw = await request.text();
  if (!verifyShopifyWebhook(raw, request.headers.get('x-shopify-hmac-sha256'), secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const topic = request.headers.get('x-shopify-topic') ?? '';
  if (!/^(products|collections|inventory_levels)\//.test(topic)) return NextResponse.json({ ok: true, ignored: true });

  revalidateTag(CATALOG_TAG);
  for (const path of ['/', '/gear', '/videos', '/sitemap.xml']) revalidatePath(path);
  revalidatePath('/gear/[handle]', 'page');
  return NextResponse.json({ ok: true, topic });
}
