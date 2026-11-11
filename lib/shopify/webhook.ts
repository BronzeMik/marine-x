import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verifies Shopify's X-Shopify-Hmac-Sha256 header (base64 HMAC-SHA256 of the raw body). */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || !hmacHeader) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  const received = Buffer.from(hmacHeader, 'base64');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
