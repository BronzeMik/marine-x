import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, Play } from 'lucide-react';
import PageShell, { AffiliateDisclosure } from '../../components/PageShell';
import { Reveal } from '../../components/Motion';
import { getVideoGroups, thumbnailUrl } from '../../lib/videos';

export const metadata: Metadata = {
  title: 'Shop the Video',
  description: 'Every piece of gear featured in Marine X videos, organized by episode.',
  alternates: { canonical: '/videos' },
};

export default async function VideosPage() {
  const groups = await getVideoGroups();
  return (
    <PageShell>
      <div className="shell gear-intro">
        <span className="mini">SHOP THE VIDEO</span>
        <h1>GEAR FROM <em>THE CHANNEL.</em></h1>
        <p>Every item mentioned in a video, linked in one place.</p>
      </div>
      <section className="affiliate-section" style={{ paddingTop: 40 }}>
        <div className="shell">
          {groups.length === 0 ? (
            <div className="affiliate-no-results"><h3>No videos linked yet.</h3><p>Add a YouTube video ID to a product in Shopify to see it here.</p></div>
          ) : (
            <div className="video-grid">
              {groups.map((g, i) => (
                <Reveal key={g.videoId} delay={Math.min(i, 6) * 0.05}>
                  <Link className="video" href={`/videos/${g.videoId}`}>
                    <div className="video-art" style={{ backgroundImage: `url(${thumbnailUrl(g.videoId)})` }}><div className="play-circle"><Play size={25} fill="currentColor" /></div></div>
                    <div className="video-meta"><span>{g.products.length} {g.products.length === 1 ? 'ITEM' : 'ITEMS'} FEATURED</span></div>
                    <h3>{g.title}</h3>
                    <span className="video-watch">SHOP THIS VIDEO <ArrowUpRight size={16} /></span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
          <AffiliateDisclosure />
        </div>
      </section>
    </PageShell>
  );
}
