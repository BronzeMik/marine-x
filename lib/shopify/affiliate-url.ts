/**
 * Affiliate URL validation. Only https URLs to public hostnames are accepted.
 * Optionally restrict to an allowlist via AFFILIATE_ALLOWED_HOSTS (comma-separated,
 * suffix match, e.g. "amazon.com,amzn.to,walmart.com").
 */
const MAX_LENGTH = 2048;

function isIpOrInternal(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true; // IPv4
  if (host.includes(':') || host.startsWith('[')) return true; // IPv6
  return !host.includes('.'); // single-label hostnames
}

export function parseAllowedHosts(raw: string | undefined = process.env.AFFILIATE_ALLOWED_HOSTS): string[] {
  return (raw ?? '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
}

export function hostMatches(host: string, allowed: string[]): boolean {
  return allowed.some(a => host === a || host.endsWith(`.${a}`));
}

/** Returns the normalized URL string if safe, otherwise null. */
export function validateAffiliateUrl(input: unknown, allowedHosts: string[] = parseAllowedHosts()): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value || value.length > MAX_LENGTH) return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (!host || isIpOrInternal(host)) return null;
  if (['example.com', 'example.org', 'example.net'].includes(host)) return null;
  if (allowedHosts.length && !hostMatches(host, allowedHosts)) return null;
  return url.toString();
}

export function isAmazonHost(url: string | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(^|\.)amazon\.[a-z.]+$/.test(host) || host === 'amzn.to' || host.endsWith('.amzn.to') || host === 'a.co' || host === 'amzn.com';
  } catch { return false; }
}

export function retailerFromUrl(url: string | null): string {
  if (!url) return '';
  if (isAmazonHost(url)) return 'Amazon';
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const name = host.split('.').slice(-2, -1)[0] ?? host;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch { return ''; }
}

export function ctaLabel(retailer: string, isAmazon: boolean): string {
  if (isAmazon) return 'View on Amazon';
  if (retailer) return `Shop at ${retailer}`;
  return 'Check Availability';
}
