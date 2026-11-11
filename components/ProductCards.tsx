'use client';
import Link from 'next/link';
import { ArrowUpRight, LoaderCircle, Play, Plus, X } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart } from './cart/CartProvider';
import { ctaLabel } from '../lib/shopify/affiliate-url';
import { formatMoney } from '../lib/format';
import type { AffiliateProduct, CatalogProduct, ShopifyProduct } from '../lib/shopify/types';

export const AFFILIATE_REL = 'sponsored noopener noreferrer';

/** The only place an affiliate outbound link is rendered. Never offers cart controls. */
export function AffiliateCta({ product, className = 'affiliate-action' }: { product: AffiliateProduct; className?: string }) {
  if (!product.affiliateUrl) return <span className="affiliate-pending">LINK UNAVAILABLE</span>;
  return (
    <a className={className} href={product.affiliateUrl} target="_blank" rel={AFFILIATE_REL}>
      {ctaLabel(product.retailer, product.isAmazon).toUpperCase()} <ArrowUpRight size={17} aria-hidden />
      <span className="sr-only"> (affiliate link, opens in a new tab)</span>
    </a>
  );
}

export function AffiliateCard({ product, priority = false }: { product: AffiliateProduct; priority?: boolean }) {
  return (
    <article className="affiliate-card">
      <Link className="affiliate-photo" href={`/gear/${product.handle}`} aria-label={`${product.title} details`}>
        <ProductImage src={product.images[0]} alt={product.title} priority={priority} />
        <span>{product.category.toUpperCase()}</span>
      </Link>
      <div className="affiliate-details">
        <span className="mini">{[product.vendor, product.retailer].filter(Boolean).join(' / ') || 'RECOMMENDED'}</span>
        <h3><Link href={`/gear/${product.handle}`}>{product.title}</Link></h3>
        <p>{product.description}</p>
        <AffiliateCta product={product} />
        <div className="affiliate-meta">
          <span>Affiliate link</span>
          {product.youtubeVideoId && <Link href={`/videos/${product.youtubeVideoId}`}><Play size={12} aria-hidden /> Watch review</Link>}
        </div>
      </div>
    </article>
  );
}

export function ShopifyCard({ product }: { product: ShopifyProduct }) {
  const { add, busy, enabled } = useCart();
  const single = product.variants.length === 1;
  return (
    <article className="product-card">
      <Link className="product-image" href={`/gear/${product.handle}`} aria-label={`${product.title} details`}>
        <ProductImage src={product.images[0]} alt={product.title} sizes="(max-width: 650px) 50vw, (max-width: 1100px) 50vw, 25vw" />
        <span className="product-label">{product.availableForSale ? 'MARINE X SELECT' : 'SOLD OUT'}</span>
      </Link>
      <div className="product-info">
        <div>
          <h3><Link href={`/gear/${product.handle}`}>{product.title}</Link></h3>
          <p>{product.variants.length > 1 ? 'From ' : ''}{formatMoney(product.price.amount, product.price.currencyCode)}</p>
        </div>
        {!product.availableForSale ? (
          <span className="product-add" aria-disabled="true" style={{ opacity: 0.55 }}><X size={17} aria-hidden /><span>SOLD OUT</span></span>
        ) : single && enabled ? (
          <button className="product-add" disabled={busy === product.variantId} onClick={() => add(product.variantId)}>
            {busy === product.variantId ? <LoaderCircle size={17} className="spin" /> : <Plus size={19} aria-hidden />}<span>ADD TO BAG</span>
          </button>
        ) : (
          <Link className="product-add" href={`/gear/${product.handle}`}><span>SELECT OPTIONS</span></Link>
        )}
      </div>
    </article>
  );
}

export function ProductCard({ product, priority }: { product: CatalogProduct; priority?: boolean }) {
  return product.type === 'affiliate' ? <AffiliateCard product={product} priority={priority} /> : <ShopifyCard product={product} />;
}
