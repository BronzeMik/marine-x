/**
 * Low-level Storefront API client. Server-only: it reads the access token from env and must
 * never be imported from a Client Component.
 */
const API_VERSION = '2025-10';

export const shopDomain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
const token = process.env.SHOPIFY_STORE_DOMAIN ? process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN : undefined;
export const shopEnabled = Boolean(shopDomain && token);

export class ShopifyError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ShopifyError';
  }
}

type FetchOptions = {
  variables?: Record<string, unknown>;
  /** Next.js data cache settings. Cart calls pass { cache: 'no-store' }. */
  cache?: { revalidate?: number; tags?: string[]; noStore?: boolean };
};

export const CATALOG_TAG = 'catalog';
export const CATALOG_REVALIDATE_SECONDS = 300;

export async function shopifyFetch<T>(query: string, opts: FetchOptions = {}): Promise<T> {
  if (!shopDomain || !token) throw new ShopifyError('Shopify is not configured');
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query, variables: opts.variables ?? {} }),
  };
  if (opts.cache?.noStore) init.cache = 'no-store';
  else init.next = { revalidate: opts.cache?.revalidate ?? CATALOG_REVALIDATE_SECONDS, tags: opts.cache?.tags ?? [CATALOG_TAG] };

  let res: Response;
  try {
    res = await fetch(`https://${shopDomain}/api/${API_VERSION}/graphql.json`, init);
  } catch {
    throw new ShopifyError('Could not reach Shopify');
  }
  if (!res.ok) throw new ShopifyError(`Shopify HTTP ${res.status}`, res.status);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  // Error text can echo query fragments; keep it free of product data.
  if (json.errors?.length) throw new ShopifyError(json.errors.map(e => e.message).join('; ').slice(0, 300));
  if (!json.data) throw new ShopifyError('Empty Shopify response');
  return json.data;
}
