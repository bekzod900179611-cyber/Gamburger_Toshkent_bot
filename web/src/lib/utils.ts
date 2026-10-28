import type { IconName } from '@/components/ui/Icon';
import type { OrderStatus, PaymentMethod } from './types';

/** 45000 → "45,000 so‘m" */
export function formatSum(value: number): string {
  return `${Math.round(value || 0).toLocaleString('en-US')} so‘m`;
}

/** 45000 → "45,000" (so'msiz) */
export function formatNumber(value: number): string {
  return Math.round(value || 0).toLocaleString('en-US');
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function discountPercent(oldPrice: number, newPrice: number): number {
  return oldPrice > newPrice ? Math.round((1 - newPrice / oldPrice) * 100) : 0;
}

export function deliveryFeeFor(subtotal: number, fee: number, freeFrom: number): number {
  return freeFrom > 0 && subtotal >= freeFrom ? 0 : fee;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Kun vaqtiga qarab samimiy salom. */
export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Xayrli tun';
  if (hour < 11) return 'Xayrli tong';
  if (hour < 17) return 'Xayrli kun';
  return 'Xayrli kech';
}

export const STATUS_INFO: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: 'Qabul qilinmoqda', tone: 'bg-saffron-soft text-[#8a5300]' },
  accepted: { label: 'Qabul qilindi', tone: 'bg-success-soft text-success' },
  cooking: { label: 'Tayyorlanmoqda', tone: 'bg-action-soft text-action-dark' },
  delivering: { label: 'Yo‘lda', tone: 'bg-[#e6effc] text-[#2457a6]' },
  delivered: { label: 'Yetkazildi', tone: 'bg-success-soft text-success' },
  cancelled: { label: 'Bekor qilindi', tone: 'bg-surface text-muted' },
};

export const PAYMENT_INFO: Record<PaymentMethod, { label: string; icon: IconName; hint: string }> = {
  cash: { label: 'Naqd pul', icon: 'cash', hint: 'Kuryerga yetkazganda' },
  click: { label: 'Click', icon: 'card', hint: 'Karta orqali onlayn' },
  payme: { label: 'Payme', icon: 'card', hint: 'Karta orqali onlayn' },
  telegram_stars: { label: 'Telegram Stars', icon: 'star', hint: 'Telegram yulduzlari' },
};
