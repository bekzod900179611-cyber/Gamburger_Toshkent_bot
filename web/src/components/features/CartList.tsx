'use client';

import { formatSum } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import ProductImage from '@/components/ui/ProductImage';
import Stepper from '@/components/ui/Stepper';

export function CartList() {
  const { haptic } = useTelegram();
  const { items, setQuantity } = useCart();

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.productId} className="flex animate-rise items-center gap-3.5 py-3.5">
          <ProductImage src={item.imageUrl} alt={item.name} className="h-[72px] w-[72px] shrink-0 rounded-2xl" />

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">{item.name}</h3>
            <div className="tabular mt-1 text-[16px] font-extrabold">{formatSum(item.price * item.quantity)}</div>
          </div>

          <Stepper
            size="sm"
            value={item.quantity}
            min={0}
            onChange={(value) => {
              haptic(value === 0 ? 'warning' : 'light');
              setQuantity(item.productId, value);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

export default CartList;
