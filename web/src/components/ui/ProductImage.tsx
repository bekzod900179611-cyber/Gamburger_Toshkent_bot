'use client';

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { assetUrl } from '@/lib/api';
import Icon from './Icon';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Kattaroq o'lcham kerak bo'lsa (hero, mahsulot oynasi) */
  large?: boolean;
}

/** Unsplash rasmini kerakli kenglikda so'raydi — kichik kartochkaga 900px yuklanmaydi. */
function sized(src: string, width: number) {
  if (!src.includes('images.unsplash.com')) return assetUrl(src);
  return src.replace(/([?&])w=\d+/, `$1w=${width}`);
}

/** Taom rasmi: yuklanguncha iliq fon, yuklangach silliq paydo bo'ladi. */
export const ProductImage = forwardRef<HTMLDivElement, ProductImageProps>(function ProductImage(
  { src, alt, className, large },
  ref,
) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);

  return (
    <div ref={ref} className={cn('relative overflow-hidden bg-surface', className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center text-muted/50">
          <Icon name="flame" size={large ? 44 : 28} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sized(src, large ? 900 : 480)}
          alt={alt}
          loading={large ? 'eager' : 'lazy'}
          decoding="async"
          // Keshdan kelgan rasm onLoad'dan oldin tayyor bo'lishi mumkin
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500',
            loaded ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
          )}
        />
      )}
    </div>
  );
});

export default ProductImage;
