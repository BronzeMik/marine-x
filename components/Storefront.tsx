'use client';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ShopifyCard } from './ProductCards';
import type { ShopifyProduct } from '../lib/shopify/types';

/** Official Marine X merchandise. Cart state lives in CartProvider (shared with product pages). */
export default function Storefront({ products, connected }: { products: ShopifyProduct[]; connected: boolean }) {
  return (
    <section className="shop-section" id="shop">
      <div className="shell">
        <div className="section-heading reveal">
          <div><span className="mini">05 / OFFICIAL MARINE X SHOP</span><h2>GEAR THAT <em>EARNS IT.</em></h2></div>
          <p>Official Marine X products only. Affiliate recommendations are in the Gear Guide; these items check out securely with Shopify.</p>
        </div>
        {!connected ? (
          <div className="shop-empty reveal">
            <div><span className="mini">STORE COMING ONLINE</span><h3>THE GEAR SHOP IS IN THE WORKS.</h3><p>Shopify integration is ready. Connect a Shopify store to publish products and enable secure checkout.</p></div>
            <a className="under-link" href="https://www.youtube.com/@MarineX" target="_blank" rel="noopener noreferrer">EXPLORE THE CHANNEL <ArrowUpRight size={18} /></a>
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty"><h3>NO PRODUCTS AVAILABLE YET.</h3><p>Publish Marine X products in Shopify to display them here.</p></div>
        ) : (
          <>
            <div className="product-grid">{products.map(p => <div className="reveal" key={p.id}><ShopifyCard product={p} /></div>)}</div>
            <Link className="under-link affiliate-more" href="/gear?type=shopify">VIEW THE FULL SHOP <ArrowUpRight size={18} /></Link>
          </>
        )}
      </div>
    </section>
  );
}
