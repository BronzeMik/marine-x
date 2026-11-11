'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, LoaderCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import type { Cart } from '../../lib/shopify/types';
import { formatMoney } from '../../lib/format';
import ProductImage from '../ProductImage';

function ProductThumb({ src }: { src: string }) {
  return <div className="cart-thumb"><ProductImage src={src} alt="" sizes="85px" /></div>;
}

const STORAGE_KEY = 'marinex_shopify_cart';

type CartContextValue = {
  enabled: boolean;
  cart: Cart | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  busy: string | null; // id of the thing being changed
  error: string;
  add: (variantId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};

const read = () => { try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; } };
const write = (id: string | null) => { try { if (id) window.localStorage.setItem(STORAGE_KEY, id); else window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ } };

export default function CartProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Restore + revalidate the persisted cart against Shopify. Expired/invalid carts are discarded.
  useEffect(() => {
    if (!enabled) return;
    const id = read();
    if (!id) return;
    const ctrl = new AbortController();
    fetch(`/api/cart?id=${encodeURIComponent(id)}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d?.cart) setCart(d.cart); else write(null); })
      .catch(() => { /* offline: keep id, try again next load */ });
    return () => ctrl.abort();
  }, [enabled]);

  const call = useCallback(async (key: string, body: Record<string, unknown>): Promise<boolean> => {
    setBusy(key); setError('');
    try {
      const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, cartId: cart?.id ?? read() ?? undefined }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to update your bag');
      setCart(data.cart ?? null);
      write(data.cart?.id ?? null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update your bag');
      return false;
    } finally { setBusy(null); }
  }, [cart?.id]);

  const add = useCallback(async (variantId: string, quantity = 1) => {
    const ok = await call(variantId, { action: 'add', variantId, quantity });
    if (ok) setOpen(true);
    return ok;
  }, [call]);
  const setQuantity = useCallback(async (lineId: string, quantity: number) => { await call(lineId, { action: 'update', lineId, quantity }); }, [call]);
  const remove = useCallback(async (lineId: string) => { await call(lineId, { action: 'remove', lineId }); }, [call]);

  const value = useMemo<CartContextValue>(() => ({ enabled, cart, open, setOpen, busy, error, add, setQuantity, remove }), [enabled, cart, open, busy, error, add, setQuantity, remove]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {enabled && <CartUI />}
    </CartContext.Provider>
  );
}

function CartUI() {
  const { cart, open, setOpen, busy, error, setQuantity, remove } = useCart();
  const count = cart?.totalQuantity ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, setOpen]);

  return (
    <>
      <button className="cart-floating" onClick={() => setOpen(true)} aria-label={`Open bag with ${count} items`}><ShoppingBag size={20} /> BAG ({count})</button>
      <AnimatePresence>
        {open && (
          <motion.div className="cart-overlay" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your bag" onClick={e => e.stopPropagation()} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3, ease: [0.2, 0.75, 0.2, 1] }}>
              <div className="cart-head"><h2>YOUR BAG <span>({count})</span></h2><button aria-label="Close bag" onClick={() => setOpen(false)}><X /></button></div>
              {cart?.lines.length ? (
                <div className="cart-items">
                  {cart.lines.map(l => (
                    <div className="cart-item" key={l.id}>
                      {l.merchandise.image && <ProductThumb src={l.merchandise.image.url} />}
                      <div className="cart-item-body">
                        <Link href={`/gear/${l.merchandise.product.handle}`} onClick={() => setOpen(false)}><strong>{l.merchandise.product.title}</strong></Link>
                        {l.merchandise.title !== 'Default Title' && <p>{l.merchandise.title}</p>}
                        <p>{formatMoney(l.merchandise.price.amount, l.merchandise.price.currencyCode)} each</p>
                        {!l.merchandise.availableForSale && <p className="store-error">Currently unavailable</p>}
                        <div className="qty-row">
                          <div className="qty" role="group" aria-label={`Quantity for ${l.merchandise.product.title}`}>
                            <button aria-label="Decrease quantity" disabled={busy === l.id} onClick={() => setQuantity(l.id, l.quantity - 1)}><Minus size={14} /></button>
                            <span aria-live="polite">{busy === l.id ? <LoaderCircle size={14} className="spin" /> : l.quantity}</span>
                            <button aria-label="Increase quantity" disabled={busy === l.id} onClick={() => setQuantity(l.id, l.quantity + 1)}><Plus size={14} /></button>
                          </div>
                          <button className="cart-remove" aria-label={`Remove ${l.merchandise.product.title}`} disabled={busy === l.id} onClick={() => remove(l.id)}><Trash2 size={15} /> REMOVE</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="cart-empty">Your bag is empty. Explore the collection to get started.</p>}
              {error && <p className="store-error" role="alert">{error}</p>}
              {cart && cart.lines.length > 0 && <p className="cart-subtotal"><span>SUBTOTAL</span><strong>{formatMoney(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode)}</strong></p>}
              {cart?.checkoutUrl && cart.lines.length > 0 && <a className="button-primary checkout" href={cart.checkoutUrl}>SECURE SHOPIFY CHECKOUT <ArrowUpRight size={18} /></a>}
              <p className="cart-disclaimer">Checkout, shipping, taxes, and payment are handled by Shopify. Final prices are confirmed at checkout.</p>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
