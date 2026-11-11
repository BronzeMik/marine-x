'use client';
import { useMemo, useState } from 'react';
import { LoaderCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from './cart/CartProvider';
import { findVariant, initialSelection, isOptionValueAvailable } from '../lib/shopify/variants';
import { formatMoney } from '../lib/format';
import type { ShopifyProduct } from '../lib/shopify/types';

/**
 * Purchase controls for Shopify-owned products ONLY. The type signature makes it impossible to
 * pass an affiliate product, and the cart API independently rejects affiliate variants.
 */
export default function BuyBox({ product }: { product: ShopifyProduct }) {
  const { add, busy, error, enabled } = useCart();
  const [selection, setSelection] = useState(() => initialSelection(product));
  const [qty, setQty] = useState(1);
  const variant = useMemo(() => findVariant(product, selection), [product, selection]);
  const price = variant?.price ?? product.price;
  const canBuy = enabled && Boolean(variant?.availableForSale);

  return (
    <div className="buybox">
      <p className="buybox-price">{formatMoney(price.amount, price.currencyCode)}</p>
      {product.options.map(opt => (
        <fieldset key={opt.name} className="option-group">
          <legend>{opt.name.toUpperCase()}</legend>
          <div>
            {opt.values.map(v => {
              const avail = isOptionValueAvailable(product, selection, opt.name, v);
              return (
                <button key={v} type="button" aria-pressed={selection[opt.name] === v} className={`option${selection[opt.name] === v ? ' active' : ''}${avail ? '' : ' soldout'}`} onClick={() => setSelection(s => ({ ...s, [opt.name]: v }))}>{v}</button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {!variant && <p className="store-error">That combination is not available.</p>}
      <div className="buybox-row">
        <div className="qty" role="group" aria-label="Quantity">
          <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={14} /></button>
          <span aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" disabled={qty >= 99} onClick={() => setQty(q => Math.min(99, q + 1))}><Plus size={14} /></button>
        </div>
        <button className="button-primary" disabled={!canBuy || busy === variant?.id} onClick={() => variant && add(variant.id, qty)}>
          {busy === variant?.id ? <><LoaderCircle size={17} className="spin" /> ADDING</> : variant && !variant.availableForSale ? 'SOLD OUT' : <><ShoppingBag size={17} /> ADD TO BAG</>}
        </button>
      </div>
      {!enabled && <p className="store-error">Checkout is not available right now.</p>}
      {error && <p className="store-error" role="alert">{error}</p>}
    </div>
  );
}
