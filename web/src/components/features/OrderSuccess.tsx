'use client';

import type { Order } from '@/lib/types';
import { formatSum, PAYMENT_INFO } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

interface OrderSuccessProps {
  order: Order;
  onDone: () => void;
  onClose: () => void;
  isTelegram: boolean;
}

export function OrderSuccess({ order, onDone, onClose, isTelegram }: OrderSuccessProps) {
  return (
    <div className="fixed inset-0 z-[55] flex animate-fade-in flex-col bg-bg px-6 pb-[calc(24px+var(--safe-bottom))]">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-28 w-28 animate-pop place-items-center rounded-full bg-success text-white shadow-[0_16px_36px_-14px_rgb(29_143_78/0.7)]">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path className="draw-check" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="animate-rise [animation-delay:250ms]">
          <h1 className="mt-6 text-[28px] leading-tight font-extrabold tracking-[-0.02em]">Rahmat! Buyurtma qabul qilindi</h1>
          <p className="mx-auto mt-2 max-w-xs text-[15.5px] leading-relaxed text-muted">
            Oshpazlarimiz allaqachon ishga tushdi. Holatini shu yerda va botda kuzatib borasiz.
          </p>
        </div>

        <div className="mt-7 w-full animate-rise space-y-2.5 rounded-[var(--radius-card)] bg-surface p-4 text-left text-[14.5px] [animation-delay:400ms]">
          <div className="flex justify-between">
            <span className="text-muted">Buyurtma</span>
            <span className="tabular font-extrabold">#{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Jami</span>
            <span className="tabular font-extrabold">{formatSum(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">To‘lov</span>
            <span className="font-semibold">
              {PAYMENT_INFO[order.paymentMethod].label}
              {order.paymentStatus === 'paid' ? ' · to‘langan' : ''}
            </span>
          </div>
          <div className="flex items-start gap-2 border-t border-line pt-2.5">
            <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-action" />
            <span className="font-semibold">{order.address}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-2">
        <Button block size="lg" onClick={onDone}>
          Buyurtmani kuzatish
        </Button>
        {isTelegram && (
          <Button block variant="ghost" onClick={onClose}>
            Botga qaytish
          </Button>
        )}
      </div>
    </div>
  );
}

export default OrderSuccess;
