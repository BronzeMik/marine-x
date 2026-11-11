import { cache } from 'react';
import { getCatalog } from './shopify/catalog';
import type { CatalogProduct } from './shopify/types';

export type VideoGroup = { videoId: string; title: string; products: CatalogProduct[] };

export const thumbnailUrl = (id: string, quality: 'maxresdefault' | 'hqdefault' = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${quality}.jpg`;

/** Public oEmbed lookup for a video title (no API key). Cached for a day; falls back to a generic title. */
export const getVideoTitle = cache(async (id: string): Promise<string> => {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { next: { revalidate: 86400 } });
    if (!res.ok) return 'Marine X Video';
    const json = (await res.json()) as { title?: string };
    return json.title?.slice(0, 140) || 'Marine X Video';
  } catch { return 'Marine X Video'; }
});

/** Groups products by video ID (a product may appear under several videos). */
export function groupByVideo(products: CatalogProduct[]): Map<string, CatalogProduct[]> {
  const map = new Map<string, CatalogProduct[]>();
  for (const p of products) for (const id of p.videoIds) map.set(id, [...(map.get(id) ?? []), p]);
  return map;
}

export async function getVideoGroups(): Promise<VideoGroup[]> {
  const { products } = await getCatalog();
  const groups = [...groupByVideo(products).entries()];
  return Promise.all(groups.map(async ([videoId, items]) => ({ videoId, title: await getVideoTitle(videoId), products: items })));
}

export async function getVideoGroup(videoId: string): Promise<VideoGroup | null> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  const { products } = await getCatalog();
  const items = products.filter(p => p.videoIds.includes(videoId));
  return items.length ? { videoId, title: await getVideoTitle(videoId), products: items } : null;
}
