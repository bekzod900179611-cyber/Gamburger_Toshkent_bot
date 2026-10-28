'use client';

import type { AppConfig, Product } from '@/lib/types';
import { cn, formatSum } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/layout/Header';
import CartList from '@/components/features/CartList';
import OrderBump from '@/components/features/OrderBump';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

interface CartScreenProps {
  config: AppConfig;
  bump: Product | null;
  onGoCatalog: () => void;
  onCheckout: () => void;
}

export function CartScreen({ config, bump, onGoCatalog, onCheckout }: CartScreenProps) {
  const { haptic } = useTelegram();
  const cart = useCart(config.delivery);
  const { freeFrom } = config.delivery;

  if (cart.items.length === 0) {
    return (
      <>
        <Header title="Savatcha" />
        <div className="flex flex-col items-center py-20 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-surface text-muted">
            <Icon name="bag" size={42} strokeWidth={1.6} />
          </div>
          <h2 className="mt-5 text-[20px] font-extrabold">Savatcha hali bo‘sh</h2>
          <p className="mt-1.5 max-w-[270px] text-[15px] text-muted">
            Qorin och qolmasin! Menyudan ko‘nglingiz tusagan taomni tanlang.
          </p>
          <Button className="mt-6" onClick={onGoCatalog}>
            Menyuni ochish
          </Button>
        </div>
      </>
    );
  }

  const leftForFree = freeFrom > 0 ? Math.max(0, freeFrom - cart.subtotal) : 0;
  const progress = freeFrom > 0 ? Math.min(100, (cart.subtotal / freeFrom) * 100) : 0;

  return (
    <>
      <Header
        title="Savatcha"
        note={`${cart.count} ta taom`}
        action={
          <button
            onClick={() => {
              haptic('warning');
              cart.clear();
            }}
            className="flex items-center gap-1 rounded-xl px-2.5 py-2 text-[14px] font-bold text-muted active:bg-surface"
          >
            <Icon name="trash" size={17} /> Tozalash
          </button>
        }
      />

      {freeFrom > 0 && (
        <div className="mt-3 rounded-2xl bg-surface p-3.5">
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            <Icon name="truck" size={20} className={leftForFree > 0 ? 'text-action' : 'text-success'} />
            {leftForFree > 0 ? (
              <span>
                Yana <b className="tabular">{formatSum(leftForFree)}</b> — va yetkazish bepul
              </span>
            ) : (
              <span className="text-success">Zo‘r! Yetkazib berish bepul</span>
            )}
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line">
            <div
              className={cn('h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)]', leftForFree > 0 ? 'bg-action' : 'bg-success')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-1">
        <CartList />
      </div>

      {bump && (
        <div className="mt-2">
          <OrderBump product={bump} />
        </div>
      )}

      <div className="mt-4 space-y-2 text-[15px]">
        <div className="flex justify-between">
          <span className="text-muted">Taomlar</span>
          <span className="tabular font-semibold">{formatSum(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Yetkazib berish</span>
          <span className={cn('tabular font-semibold', cart.deliveryFee === 0 && 'text-success')}>
            {cart.deliveryFee === 0 ? 'Bepul' : formatSum(cart.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-line pt-2.5 text-[18px]">
          <span className="font-extrabold">Jami</span>
          <span className="tabular font-extrabold">{formatSum(cart.total)}</span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(var(--nav-height)+var(--safe-bottom))] z-30 bg-linear-to-t from-bg via-bg to-bg/0 px-4 pt-6 pb-3">
        <div className="mx-auto max-w-lg">
          <Button
            block
            size="lg"
            className="justify-between px-5"
            onClick={() => {
              haptic('medium');
              onCheckout();
            }}
          >
            <span>Rasmiylashtirish</span>
            <span className="tabular">{formatSum(cart.total)}</span>
          </Button>
        </div>
      </div>
      <div className="h-24" aria-hidden />
    </>
  );
}

export default CartScreen;
