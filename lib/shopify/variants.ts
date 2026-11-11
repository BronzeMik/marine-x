import type { ProductVariant, ShopifyProduct } from './types';

/** Find the variant whose options exactly match the selection. */
export function findVariant(product: Pick<ShopifyProduct, 'variants'>, selection: Record<string, string>): ProductVariant | undefined {
  return product.variants.find(v => {
    if (!v.selectedOptions.length) return Object.keys(selection).length === 0;
    return v.selectedOptions.every(o => selection[o.name] === o.value);
  });
}

/** Initial selection from the default variant. */
export function initialSelection(product: Pick<ShopifyProduct, 'variants' | 'variantId'>): Record<string, string> {
  const v = product.variants.find(x => x.id === product.variantId) ?? product.variants[0];
  return Object.fromEntries((v?.selectedOptions ?? []).map(o => [o.name, o.value]));
}

/** Whether a value is selectable (some available variant has it, given the other selected options). */
export function isOptionValueAvailable(product: Pick<ShopifyProduct, 'variants'>, selection: Record<string, string>, name: string, value: string): boolean {
  return product.variants.some(v =>
    v.availableForSale &&
    v.selectedOptions.some(o => o.name === name && o.value === value) &&
    v.selectedOptions.every(o => o.name === name || !(o.name in selection) || selection[o.name] === o.value),
  );
}
