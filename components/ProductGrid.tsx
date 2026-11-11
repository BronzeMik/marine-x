'use client';
import { AnimatePresence, motion } from 'motion/react';
import { ProductCard } from './ProductCards';
import type { CatalogProduct } from '../lib/shopify/types';

/** Animated grid: cards fade/slide in and reflow smoothly as filters change. */
export default function ProductGrid({ products, className = 'affiliate-grid' }: { products: CatalogProduct[]; className?: string }) {
  return (
    <motion.div className={className} layout>
      <AnimatePresence mode="popLayout" initial={false}>
        {products.map((p, i) => (
          <motion.div key={p.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.03 }} whileHover={{ y: -4 }}>
            <ProductCard product={p} priority={i < 3} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
