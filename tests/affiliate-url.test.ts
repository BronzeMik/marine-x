import { describe, expect, it } from 'vitest';
import { ctaLabel, isAmazonHost, retailerFromUrl, validateAffiliateUrl } from '../lib/shopify/affiliate-url';

describe('validateAffiliateUrl', () => {
  it('accepts normal https URLs', () => {
    expect(validateAffiliateUrl('https://www.amazon.com/dp/B0?tag=x-20', [])).toContain('https://www.amazon.com/dp/B0');
    expect(validateAffiliateUrl('  https://amzn.to/3abc  ', [])).toBe('https://amzn.to/3abc');
  });
  it.each([
    'http://amazon.com/x', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://x.com/a', '//evil.com', '/relative', '',
    'https://user:pass@amazon.com/', 'https://localhost/x', 'https://127.0.0.1/x', 'https://10.0.0.1/', 'https://[::1]/', 'https://intranet/x', 'https://example.com/x',
  ])('rejects %s', bad => { expect(validateAffiliateUrl(bad, [])).toBeNull(); });
  it('rejects non-strings and oversized URLs', () => {
    expect(validateAffiliateUrl(undefined, [])).toBeNull();
    expect(validateAffiliateUrl(42, [])).toBeNull();
    expect(validateAffiliateUrl(`https://a.com/${'x'.repeat(3000)}`, [])).toBeNull();
  });
  it('enforces an allowlist when configured (suffix match, no lookalikes)', () => {
    const allow = ['amazon.com', 'walmart.com'];
    expect(validateAffiliateUrl('https://www.amazon.com/x', allow)).not.toBeNull();
    expect(validateAffiliateUrl('https://amazon.com.evil.io/x', allow)).toBeNull();
    expect(validateAffiliateUrl('https://notamazon.com/x', allow)).toBeNull();
  });
});

describe('retailer helpers', () => {
  it('detects Amazon hosts', () => {
    for (const u of ['https://www.amazon.com/dp/1', 'https://amazon.co.uk/x', 'https://amzn.to/abc', 'https://a.co/d/xyz']) expect(isAmazonHost(u)).toBe(true);
    expect(isAmazonHost('https://notamazon.com/x')).toBe(false);
    expect(isAmazonHost(null)).toBe(false);
  });
  it('derives retailer and CTA labels', () => {
    expect(retailerFromUrl('https://www.walmart.com/ip/1')).toBe('Walmart');
    expect(ctaLabel('Amazon', true)).toBe('View on Amazon');
    expect(ctaLabel('Walmart', false)).toBe('Shop at Walmart');
    expect(ctaLabel('', false)).toBe('Check Availability');
  });
});
