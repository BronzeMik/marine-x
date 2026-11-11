import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageShell, { AffiliateDisclosure, Breadcrumbs } from '../../../components/PageShell';
import ProductGallery from '../../../components/ProductGallery';
import BuyBox from '../../../components/BuyBox';
import VideoEmbed from '../../../components/VideoEmbed';
import ProductGrid from '../../../components/ProductGrid';
import { AffiliateCta } from '../../../components/ProductCards';
import { getProductByHandle, getRelated } from '../../../lib/shopify/catalog';
import { getVideoTitle } from '../../../lib/videos';
import { SITE_URL } from '../../../lib/format';

type Params = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Product not found', robots: { index: false } };
  const description = product.description.slice(0, 160) || `${product.title} from the Marine X gear guide.`;
  return {
    title: product.title,
    description,
    alternates: { canonical: `/gear/${product.handle}` },
    openGraph: { title: product.title, description, type: 'website', url: `${SITE_URL}/gear/${product.handle}`, images: product.images[0] ? [{ url: product.images[0] }] : undefined },
    twitter: { card: 'summary_large_image', title: product.title, description },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();
  const related = await getRelated(product);
  const videoTitle = product.youtubeVideoId ? await getVideoTitle(product.youtubeVideoId) : null;

  // Structured data: only facts we actually have. No ratings/reviews. Offers only for Shopify-owned products.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || undefined,
    image: product.images.length ? product.images : undefined,
    brand: product.vendor ? { '@type': 'Brand', name: product.vendor } : undefined,
    category: product.category,
    url: `${SITE_URL}/gear/${product.handle}`,
    ...(product.type === 'shopify' ? {
      offers: {
        '@type': 'Offer',
        price: product.price.amount,
        priceCurrency: product.price.currencyCode,
        availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${SITE_URL}/gear/${product.handle}`,
      },
    } : {}),
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <div className="shell pdp">
        <Breadcrumbs items={[{ label: 'Gear', href: '/gear' }, { label: product.category, href: `/gear?category=${encodeURIComponent(product.category)}${product.type === 'shopify' ? '&type=shopify' : ''}` }, { label: product.title }]} />
        <div className="pdp-grid">
          <ProductGallery images={product.images} title={product.title} />
          <div className="pdp-info">
            <span className="mini">{[product.vendor, product.type === 'affiliate' ? product.retailer : 'MARINE X SHOP'].filter(Boolean).join(' / ')}</span>
            <h1>{product.title}</h1>
            <p className="pdp-category">{product.category.toUpperCase()}</p>
            {product.description && <p className="pdp-desc">{product.description}</p>}
            {product.type === 'affiliate' ? (
              <>
                <AffiliateCta product={product} className="button-primary pdp-cta" />
                <AffiliateDisclosure compact />
              </>
            ) : <BuyBox product={product} />}
          </div>
        </div>

        {product.youtubeVideoId && videoTitle && (
          <section className="pdp-video" aria-labelledby="review-heading">
            <span className="mini">RELATED REVIEW</span>
            <h2 id="review-heading">{videoTitle}</h2>
            <VideoEmbed videoId={product.youtubeVideoId} title={videoTitle} />
            <Link className="under-link" href={`/videos/${product.youtubeVideoId}`}>SEE ALL GEAR FROM THIS VIDEO →</Link>
          </section>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="pdp-related">
            <span className="mini">KEEP EXPLORING</span>
            <h2 id="related-heading">RELATED GEAR</h2>
            <ProductGrid products={related} className={product.type === 'shopify' ? 'product-grid' : 'affiliate-grid'} />
          </section>
        )}
        {product.type === 'affiliate' && <AffiliateDisclosure />}
      </div>
    </PageShell>
  );
}
