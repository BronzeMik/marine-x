/** Normalized catalog types (what the UI consumes). */
export type AffiliateProduct = {
  type: 'affiliate';
  id: string;
  handle: string;
  title: string;
  description: string;
  images: string[];
  vendor: string; // brand, from native Shopify vendor
  retailer: string; // custom.retailer, or derived from the URL host
  /** Validated https URL, or null when missing/invalid (card shows "link unavailable"). */
  affiliateUrl: string | null;
  isAmazon: boolean;
  category: string;
  featured: boolean;
  /** Primary video (first of videoIds). */
  youtubeVideoId?: string;
  videoIds: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
};

export type ShopifyProduct = {
  type: 'shopify';
  id: string;
  handle: string;
  title: string;
  description: string;
  images: string[];
  vendor: string;
  category: string;
  featured: boolean;
  price: { amount: string; currencyCode: string }; // lowest variant price
  availableForSale: boolean;
  variantId: string; // default variant (first available, else first)
  variants: ProductVariant[];
  options: Array<{ name: string; values: string[] }>;
  youtubeVideoId?: string;
  videoIds: string[];
};

export type CatalogProduct = AffiliateProduct | ShopifyProduct;

/** Raw Storefront API shapes. */
export type RawMetafield = { key?: string; namespace?: string; value: string } | null;
export type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor?: string | null;
  availableForSale?: boolean;
  images?: { nodes: Array<{ url: string; altText?: string | null }> };
  options?: Array<{ name: string; values?: string[]; optionValues?: Array<{ name: string }> }>;
  variants?: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      price: { amount: string; currencyCode: string };
      selectedOptions?: Array<{ name: string; value: string }>;
    }>;
  };
  productType?: RawMetafield;
  affiliateUrl?: RawMetafield;
  retailer?: RawMetafield;
  youtubeVideoId?: RawMetafield;
  featured?: RawMetafield;
  gearCategory?: RawMetafield;
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    product: { title: string; handle: string };
    image: { url: string } | null;
    price: { amount: string; currencyCode: string };
  };
};
export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: CartLine[];
};
