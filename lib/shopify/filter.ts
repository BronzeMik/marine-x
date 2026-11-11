import type { CatalogProduct } from './types';

export type CatalogFilters = {
  q?: string;
  category?: string;
  retailer?: string;
  type?: 'affiliate' | 'shopify' | 'all';
  featured?: boolean;
  page?: number;
  pageSize?: number;
  video?: string;
};

export type CatalogResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  facets: { categories: string[]; retailers: string[] };
};

export const DEFAULT_PAGE_SIZE = 24;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const retailerOf = (p: CatalogProduct) => (p.type === 'affiliate' ? p.retailer : '');

/** Pure filter + paginate. Facets are computed on the type-filtered set so options stay relevant. */
export function filterCatalog(all: CatalogProduct[], f: CatalogFilters = {}): CatalogResult {
  const type = f.type ?? 'affiliate';
  const pageSize = Math.min(Math.max(Math.floor(f.pageSize ?? DEFAULT_PAGE_SIZE), 1), 100);
  const byType = type === 'all' ? all : all.filter(p => p.type === type);

  const facets = {
    categories: [...new Set(byType.map(p => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    retailers: [...new Set(byType.map(retailerOf).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  };

  const terms = norm(f.q ?? '').split(/\s+/).filter(Boolean);
  const items = byType.filter(p => {
    if (f.category && norm(p.category) !== norm(f.category)) return false;
    if (f.retailer && norm(retailerOf(p)) !== norm(f.retailer)) return false;
    if (f.featured && !p.featured) return false;
    if (f.video && !p.videoIds.includes(f.video)) return false;
    if (terms.length) {
      const hay = norm(`${p.title} ${p.vendor} ${p.category} ${retailerOf(p)} ${p.description}`);
      if (!terms.every(t => hay.includes(t))) return false;
    }
    return true;
  });

  items.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(Math.floor(f.page ?? 1) || 1, 1), pageCount);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageCount, pageSize, facets };
}

/** Parse Next.js searchParams into filters (defensive about arrays and junk). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): CatalogFilters {
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v)?.slice(0, 100) || undefined; };
  const t = one('type');
  const page = Number(one('page'));
  return {
    q: one('q'),
    category: one('category'),
    retailer: one('retailer'),
    type: t === 'shopify' || t === 'all' ? t : 'affiliate',
    featured: one('featured') === '1',
    video: one('video'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}
