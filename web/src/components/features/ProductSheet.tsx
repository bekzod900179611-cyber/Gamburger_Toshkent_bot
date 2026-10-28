'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/types';
import { discountPercent, formatSum } from '@/lib/utils';
import { flyToCart } from '@/lib/flyToCart';
import { taglineFor } from '@/lib/taglines';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Stepper from '@/components/ui/Stepper';
import ProductImage from '@/components/ui/ProductImage';
import Icon from '@/components/ui/Icon';

interface ProductSheetProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductSheet({ product, onClose }: ProductSheetProps) {
  const { haptic } = useTelegram();
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuantity(1), [product?.id]);

  if (!product) return null;

  const discount = discountPercent(product.oldPrice, product.newPrice);

  const submit = () => {
    haptic('success');
    add(product, quantity);
    flyToCart(imageRef.current, product.imageUrl);
    onClose();
  };

  return (
    <BottomSheet
      open
      bleed
      onClose={onClose}
      title={product.name}
      footer={
        <div className="flex items-center gap-3">
          <Stepper
            value={quantity}
            min={1}
            max={50}
            onChange={(value) => {
              haptic('light');
              setQuantity(value);
            }}
          />
          <Button block size="lg" onClick={submit} className="flex-1 justify-between px-5">
            <span>Savatga</span>
            <span className="tabular">{formatSum(product.newPrice * quantity)}</span>
          </Button>
        </div>
      }
    >
      <ProductImage ref={imageRef} large src={product.imageUrl} alt={product.name} className="aspect-[4/3.2] w-full" />

      <div className="px-5">
        <h2 className="mt-4 text-[24px] leading-tight font-extrabold tracking-[-0.02em]">{product.name}</h2>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="tabular text-[20px] font-extrabold">{formatSum(product.newPrice)}</span>
          {discount > 0 && (
            <>
              <span className="tabular text-[14px] text-muted line-through">{formatSum(product.oldPrice)}</span>
              <span className="tabular rounded-full bg-saffron px-2 py-0.5 text-[12px] font-extrabold">−{discount}%</span>
            </>
          )}
        </div>

        {taglineFor(product.slug) && (
          <p className="mt-3 rounded-2xl bg-saffron-soft px-4 py-3 text-[15px] leading-snug font-bold text-ink">
            {taglineFor(product.slug)}
          </p>
        )}

        {product.description && <p className="mt-3 text-[15.5px] leading-relaxed text-ink/80">{product.description}</p>}

        {product.ingredients.length > 0 && (
          <>
            <h3 className="mt-5 mb-2 text-[15px] font-extrabold">Tarkibi</h3>
            <ul className="flex flex-wrap gap-2">
              {product.ingredients.map((item) => (
                <li key={item} className="rounded-full bg-surface px-3 py-1.5 text-[13.5px] font-semibold">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-success-soft p-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-success">
            <Icon name="shield" size={22} />
          </span>
          <p className="text-[13.5px] leading-snug font-semibold text-ink/85">
            20 daqiqada issiq holatda yetkazib beramiz yoki pulingizni qaytaramiz.
          </p>
        </div>
      </div>
    </BottomSheet>
  );
}

export default ProductSheet;
