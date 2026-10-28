'use client';

import { useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { deliveryFeeFor } from '@/lib/utils';

/** Savatcha + hisob-kitoblar. Yetkazib berish narxi backend sozlamasidan olinadi. */
export function useCart(delivery?: { fee: number; freeFrom: number }) {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  return useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee =
      delivery && subtotal > 0 ? deliveryFeeFor(subtotal, delivery.fee, delivery.freeFrom) : 0;
    const quantityOf = (productId: number) =>
      items.find((item) => item.productId === productId)?.quantity || 0;

    return {
      items,
      count,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      quantityOf,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [items, delivery, add, setQuantity, remove, clear]);
}

export default useCart;
