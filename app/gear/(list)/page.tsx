import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageShell, { AffiliateDisclosure } from '../../../components/PageShell';
import GearFilters from '../../../components/GearFilters';
import ProductGrid from '../../../components/ProductGrid';
import { parseFilters } from '../../../lib/shopify/filter';
import { queryCatalog } from '../../../lib/shopify/catalog';

export const metadata: Metadata = {
  title: 'Gear Guide',
  description: 'Explore curated everyday carry, bags, lighting, tools, and preparedness gear recommended by Marine X.',
  alternates: { canonical: '/gear' },
};

type SP = Promise<Record<string, string | string[] | undefined>>;

function pageHref(sp: Record<string, string | string[] | undefined>, page: number) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) { const val = Array.isArray(v) ? v[0] : v; if (val && k !== 'page') next.set(k, val); }
  if (page > 1) next.set('page', String(page));
  const qs = next.toString();
  return qs ? `/gear?${qs}` : '/gear';
}

export default async function GearPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const result = await queryCatalog(filters);
  const { items, total, page, pageCount, facets, source } = result;

  return (
    <PageShell>
      <div className="shell gear-intro">
        <span className="mini">BY DESIGN. NOT DEFAULT.</span>
        <h1>FIND YOUR <em>EDGE.</em></h1>
        <p>Gear recommendations from the channel. Affiliate picks link out to the retailer; Marine X merchandise checks out securely with Shopify.</p>
      </div>
      <section className="affiliate-section" id="gear" style={{ paddingTop: 40 }}>
        <div className="shell">
          <Suspense fallback={<div className="affiliate-controls" aria-hidden />}>
            <GearFilters categories={facets.categories} retailers={facets.retailers} />
          </Suspense>
          {source === 'error' && <p className="store-error" role="alert">We couldn&rsquo;t load the catalog right now. Please try again shortly.</p>}
          {source === 'legacy' && <p className="affiliate-disclosure">Shopify is not connected, so placeholder recommendations are shown.</p>}
          <p className="result-count" aria-live="polite">{total} {total === 1 ? 'item' : 'items'}</p>
          {items.length ? <ProductGrid products={items} className={filters.type === 'shopify' ? 'product-grid' : 'affiliate-grid'} /> : (
            <div className="affiliate-no-results">
              <h3>Nothing matches those filters.</h3>
              <p>Try a different search term or <Link className="under-link" href="/gear">clear all filters</Link>.</p>
            </div>
          )}
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {page > 1 ? <Link rel="prev" href={pageHref(sp, page - 1)}>← PREVIOUS</Link> : <span aria-disabled="true">← PREVIOUS</span>}
              <span>PAGE {page} OF {pageCount}</span>
              {page < pageCount ? <Link rel="next" href={pageHref(sp, page + 1)}>NEXT →</Link> : <span aria-disabled="true">NEXT →</span>}
            </nav>
          )}
          <AffiliateDisclosure />
        </div>
      </section>
    </PageShell>
  );
}
