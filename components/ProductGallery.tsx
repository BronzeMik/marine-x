'use client';
import { useState } from 'react';
import ProductImage from './ProductImage';

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main"><ProductImage key={images[i] ?? 'none'} src={images[i]} alt={title} sizes="(max-width: 900px) 100vw, 50vw" priority /></div>
      {images.length > 1 && (
        <div className="gallery-thumbs" role="group" aria-label="Product images">
          {images.map((src, idx) => (
            <button key={src} aria-label={`Show image ${idx + 1} of ${images.length}`} aria-pressed={idx === i} className={idx === i ? 'active' : ''} onClick={() => setI(idx)}>
              <ProductImage src={src} alt="" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
