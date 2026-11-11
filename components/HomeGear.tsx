'use client';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AffiliateCard } from './ProductCards';
import type { AffiliateProduct } from '../lib/shopify/types';

export default function HomeGear({ products }: { products: AffiliateProduct[] }) {
  return (
    <section className="affiliate-section" id="gear">
      <div className="shell">
        <div className="section-heading reveal">
          <div><span className="mini">04 / THE GEAR GUIDE</span><h2>THE GEAR <em>EDIT.</em></h2></div>
          <p>Curated gear guides and recommendations. Affiliate links may earn Marine X a commission at no extra cost to you.</p>
        </div>
        {products.length > 0 ? (
          <div className="affiliate-grid">{products.map(p => <div className="reveal" key={p.id}><AffiliateCard product={p} /></div>)}</div>
        ) : <p className="affiliate-no-results">Featured gear is coming soon.</p>}
        <Link className="under-link affiliate-more" href="/gear">EXPLORE ALL GEAR <ArrowUpRight size={18} /></Link>
        <p className="affiliate-disclosure"><strong>Affiliate disclosure:</strong> Some links are affiliate links, including Amazon Associates and other partner programs. Marine X may earn a commission from qualifying purchases at no extra cost to you. External purchases are completed with the retailer, not through Shopify.</p>
      </div>
    </section>
  );
}
