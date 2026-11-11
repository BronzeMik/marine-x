import type { RawProduct } from '../lib/shopify/types';

const mfv = (value: string) => ({ value });
const price = (amount: string) => ({ amount, currencyCode: 'USD' });

export const rawAffiliate = (over: Partial<RawProduct> = {}): RawProduct => ({
  id: 'gid://shopify/Product/1',
  handle: 'test-flashlight',
  title: 'Test Flashlight',
  description: 'A bright light.',
  vendor: 'Acme',
  images: { nodes: [{ url: 'https://cdn.shopify.com/a.jpg' }] },
  variants: { nodes: [{ id: 'gid://shopify/ProductVariant/11', title: 'Default Title', availableForSale: true, price: price('10.00'), selectedOptions: [{ name: 'Title', value: 'Default Title' }] }] },
  options: [{ name: 'Title', values: ['Default Title'] }],
  productType: mfv('affiliate'),
  affiliateUrl: mfv('https://www.amazon.com/dp/B000000000?tag=test-20'),
  retailer: mfv('Amazon'),
  youtubeVideoId: mfv('dQw4w9WgXcQ'),
  featured: mfv('true'),
  gearCategory: mfv('Lighting'),
  ...over,
});

export const rawShopify = (over: Partial<RawProduct> = {}): RawProduct => ({
  id: 'gid://shopify/Product/2',
  handle: 'marinex-tee',
  title: 'Marine X Tee',
  description: 'Official tee.',
  vendor: 'Marine X',
  images: { nodes: [] },
  options: [{ name: 'Size', values: ['S', 'M', 'L'] }],
  variants: {
    nodes: [
      { id: 'gid://shopify/ProductVariant/21', title: 'S', availableForSale: false, price: price('30.00'), selectedOptions: [{ name: 'Size', value: 'S' }] },
      { id: 'gid://shopify/ProductVariant/22', title: 'M', availableForSale: true, price: price('30.00'), selectedOptions: [{ name: 'Size', value: 'M' }] },
      { id: 'gid://shopify/ProductVariant/23', title: 'L', availableForSale: true, price: price('34.00'), selectedOptions: [{ name: 'Size', value: 'L' }] },
    ],
  },
  productType: mfv('shopify'),
  gearCategory: mfv('Apparel'),
  ...over,
});
