'use client';

import { useRef } from 'react';
import type { Product } from '@/lib/types';
import { cn, discountPercent, formatSum } from '@/lib/utils';
import { flyToCart } from '@/lib/flyToCart';
import { taglineFor } from '@/lib/taglines';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import ProductImage from '@/components/ui/ProductImage';
import Stepper from '@/components/ui/Stepper';
import Icon from '@/components/ui/Icon';

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const { haptic } = useTelegram();
  const { add, setQuantity, quantityOf } = useCart();
  const imageRef = useRef<HTMLDivElement>(null);
  const inCart = quantityOf(product.id);
  const discount = discountPercent(product.oldPrice, product.newPrice);

  return (
    <article className="flex flex-col">
      <button onClick={() => onOpen(product)} className="relative block text-left" aria-label={product.name}>
        <ProductImage ref={imageRef} src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-[var(--radius-card)]" />
        {discount > 0 && (
          <span className="tabular absolute top-2.5 left-2.5 rounded-full bg-saffron px-2 py-0.5 text-[12px] font-extrabold text-ink">
            −{discount}%
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col px-0.5 pt-2.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="tabular text-[17px] font-extrabold whitespace-nowrap">{formatSum(product.newPrice)}</span>
          {discount > 0 && (
            <span className="tabular text-[12.5px] whitespace-nowrap text-muted line-through">{formatSum(product.oldPrice)}</span>
          )}
        </div>
        <button onClick={() => onOpen(product)} className="mt-0.5 text-left">
          <h3 className="line-clamp-2 text-[14.5px] leading-snug font-semibold">{product.name}</h3>
          {taglineFor(product.slug) && (
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted">{taglineFor(product.slug)}</p>
          )}
        </button>

        <div className="mt-auto pt-2.5">
          {inCart > 0 ? (
            <div className="animate-pop">
              <Stepper
                block
                tone="action"
                size="sm"
                value={inCart}
                onChange={(value) => {
                  haptic('light');
                  setQuantity(product.id, value);
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => {
                haptic('success');
                add(product, 1);
                flyToCart(imageRef.current, product.imageUrl);
              }}
              className={cn(
                'flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-surface text-[14px] font-extrabold text-ink transition active:scale-[0.97] active:bg-line',
              )}
            >
              <Icon name="plus" size={18} strokeWidth={2.5} /> Qo‘shish
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
