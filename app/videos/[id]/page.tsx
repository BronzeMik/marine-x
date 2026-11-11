import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageShell, { AffiliateDisclosure, Breadcrumbs } from '../../../components/PageShell';
import VideoEmbed from '../../../components/VideoEmbed';
import ProductGrid from '../../../components/ProductGrid';
import { getVideoGroup, getVideoGroups, thumbnailUrl } from '../../../lib/videos';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const group = await getVideoGroup(id);
  if (!group) return { title: 'Video not found', robots: { index: false } };
  return {
    title: `${group.title} — Gear List`,
    description: `All the gear featured in "${group.title}".`,
    alternates: { canonical: `/videos/${id}` },
    openGraph: { images: [{ url: thumbnailUrl(id, 'hqdefault') }] },
  };
}

export default async function VideoPage({ params }: { params: Params }) {
  const { id } = await params;
  const group = await getVideoGroup(id);
  if (!group) notFound();

  const all = await getVideoGroups();
  const idx = all.findIndex(g => g.videoId === id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <PageShell>
      <div className="shell pdp">
        <Breadcrumbs items={[{ label: 'Shop the Video', href: '/videos' }, { label: group.title }]} />
        <h1 className="video-title">{group.title}</h1>
        <VideoEmbed videoId={id} title={group.title} />
        <section aria-labelledby="gear-heading" className="pdp-related">
          <span className="mini">FEATURED IN THIS VIDEO</span>
          <h2 id="gear-heading">THE GEAR ({group.products.length})</h2>
          <ProductGrid products={group.products} className="affiliate-grid" />
        </section>
        <nav className="pagination" aria-label="More videos">
          {prev ? <a href={`/videos/${prev.videoId}`}>← {prev.title.slice(0, 40)}</a> : <span />}
          {next ? <a href={`/videos/${next.videoId}`}>{next.title.slice(0, 40)} →</a> : <span />}
        </nav>
        <AffiliateDisclosure />
      </div>
    </PageShell>
  );
}
