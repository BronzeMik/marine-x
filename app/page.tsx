import HomeClient from '../components/HomeClient';
import { getCatalog, getFeaturedGear, getShopProducts } from '../lib/shopify/catalog';
import { shopEnabled } from '../lib/shopify/client';

export default async function Home() {
  const [products, featuredGear, { products: all }] = await Promise.all([getShopProducts(8), getFeaturedGear(6), getCatalog()]);
  // Home video cards: video IDs attached to products in Shopify, most recent first.
  const videoIds = [...new Set(all.flatMap(p => p.videoIds))].slice(0, 3);
  return <HomeClient products={products} connected={shopEnabled} featuredGear={featuredGear} videoIds={videoIds} />;
}
