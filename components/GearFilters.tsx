'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';

type Props = { categories: string[]; retailers: string[] };

/** All state lives in the URL, so every filter combination is shareable and server-rendered. */
export default function GearFilters({ categories, retailers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get('q') ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) { if (v) next.set(k, v); else next.delete(k); }
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounced search.
  useEffect(() => {
    if ((params.get('q') ?? '') === q.trim()) return;
    timer.current = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const category = params.get('category') ?? '';
  const retailer = params.get('retailer') ?? '';
  const type = params.get('type') ?? 'affiliate';
  const featured = params.get('featured') === '1';
  const active = Boolean(q || category || retailer || featured || params.get('type'));

  return (
    <div className={`affiliate-controls${pending ? ' is-pending' : ''}`} role="search" aria-busy={pending}>
      <label className="affiliate-search"><Search size={18} aria-hidden /><input type="search" aria-label="Search gear" placeholder="Search gear, brands, categories..." value={q} onChange={e => setQ(e.target.value)} /></label>
      <div className="affiliate-filters" role="group" aria-label="Category">
        <SlidersHorizontal size={17} aria-hidden />
        <button aria-pressed={!category} className={!category ? 'active' : ''} onClick={() => update({ category: null })}>All</button>
        {categories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'active' : ''} onClick={() => update({ category: c })}>{c}</button>)}
      </div>
      <div className="affiliate-selects">
        {retailers.length > 0 && (
          <label>RETAILER
            <select value={retailer} onChange={e => update({ retailer: e.target.value || null })}>
              <option value="">All retailers</option>
              {retailers.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        )}
        <label>SHOW
          <select value={type} onChange={e => update({ type: e.target.value === 'affiliate' ? null : e.target.value })}>
            <option value="affiliate">Recommended gear</option>
            <option value="shopify">Marine X shop</option>
            <option value="all">Everything</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={featured} onChange={e => update({ featured: e.target.checked ? '1' : null })} /> FEATURED ONLY</label>
        {active && <button className="clear-filters" onClick={() => { setQ(''); startTransition(() => router.push(pathname, { scroll: false })); }}>CLEAR</button>}
      </div>
    </div>
  );
}
