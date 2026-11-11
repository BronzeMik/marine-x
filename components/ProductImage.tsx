'use client';
import Image from 'next/image';
import { useState } from 'react';

/** Fills its (position: relative) parent; fades in on load; shows a branded placeholder when missing. */
export default function ProductImage({ src, alt, sizes = '(max-width: 650px) 100vw, (max-width: 1100px) 50vw, 33vw', priority = false }: { src?: string | null; alt: string; sizes?: string; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="product-placeholder" role="img" aria-label={alt}>MARINE X / GEAR</div>;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`img-fade${loaded ? ' loaded' : ''}`}
    />
  );
}
