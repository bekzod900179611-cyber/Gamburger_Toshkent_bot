'use client';

import type { Product } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import ProductImage from '@/components/ui/ProductImage';
import Switch from '@/components/ui/Switch';

/** Savatchadagi qo'shimcha taklif: bitta switch bilan qo'shish/olib tashlash. */
export function OrderBump({ product }: { product: Product }) {
  const { haptic } = useTelegram();
  const { quantityOf, add, remove } = useCart();
  const checked = quantityOf(product.id) > 0;

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-card)] bg-saffron-soft p-3">
      <ProductImage src={product.imageUrl} alt={product.name} className="h-14 w-14 shrink-0 rounded-xl" />
      <span className="flex-1 text-[14px] leading-snug">
        Ovqat yoniga muzdekkina <b>{product.name}</b> qo‘shamizmi? Atigi{' '}
        <b className="tabular">{formatNumber(product.newPrice)} so‘m</b>
      </span>
      <Switch
        label={`${product.name} qo‘shish`}
        checked={checked}
        onChange={(next) => {
          haptic(next ? 'success' : 'light');
          if (next) add(product, 1);
          else remove(product.id);
        }}
      />
    </label>
  );
}

export default OrderBump;
