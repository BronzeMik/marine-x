import type { MetadataRoute } from 'next';
import { getCatalog } from '../lib/shopify/catalog';
import { SITE_URL } from '../lib/format';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, source } = await getCatalog();
  const videoIds = [...new Set(products.flatMap(p => p.videoIds))];
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/gear`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/videos`, changeFrequency: 'weekly', priority: 0.7 },
  ];
  if (source === 'shopify') {
    for (const p of products) entries.push({ url: `${SITE_URL}/gear/${p.handle}`, changeFrequency: 'weekly', priority: 0.6 });
    for (const id of videoIds) entries.push({ url: `${SITE_URL}/videos/${id}`, changeFrequency: 'monthly', priority: 0.5 });
  }
  return entries;
}
