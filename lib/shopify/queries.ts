/** GraphQL documents. Metafields are fetched inline via aliases (no N+1 lookups). */
export const METAFIELDS = /* GraphQL */ `
  productType: metafield(namespace: "custom", key: "product_type") { value }
  affiliateUrl: metafield(namespace: "custom", key: "affiliate_url") { value }
  retailer: metafield(namespace: "custom", key: "retailer") { value }
  youtubeVideoId: metafield(namespace: "custom", key: "youtube_video_id") { value }
  featured: metafield(namespace: "custom", key: "featured") { value }
  gearCategory: metafield(namespace: "custom", key: "gear_category") { value }
`;

const productFields = (imageCount: number) => /* GraphQL */ `
  id handle title description vendor availableForSale
  images(first: ${imageCount}) { nodes { url altText } }
  options { name values }
  variants(first: 100) { nodes { id title availableForSale price { amount currencyCode } selectedOptions { name value } } }
  ${METAFIELDS}
`;

export const PRODUCTS_PAGE_QUERY = /* GraphQL */ `
  query ProductsPage($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes { ${productFields(6)} }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ${productFields(20)} }
  }
`;

export const CART_FIELDS = /* GraphQL */ `
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) { nodes {
    id quantity
    merchandise { ... on ProductVariant {
      id title availableForSale
      image { url }
      price { amount currencyCode }
      product {
        title handle
        productType: metafield(namespace: "custom", key: "product_type") { value }
        affiliateUrl: metafield(namespace: "custom", key: "affiliate_url") { value }
      }
    } }
  } }
`;

export const VARIANT_GUARD_QUERY = /* GraphQL */ `
  query VariantGuard($id: ID!) {
    node(id: $id) { ... on ProductVariant {
      id availableForSale
      product {
        productType: metafield(namespace: "custom", key: "product_type") { value }
        affiliateUrl: metafield(namespace: "custom", key: "affiliate_url") { value }
      }
    } }
  }
`;
