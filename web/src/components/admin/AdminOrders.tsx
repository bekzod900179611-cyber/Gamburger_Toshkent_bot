'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { cn, formatDate, formatSum, PAYMENT_INFO, STATUS_INFO } from '@/lib/utils';
import { confirmAction } from '@/lib/confirm';
import { useTelegram } from '@/hooks/useTelegram';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

interface AdminOrdersProps {
  showToast: (message: string) => void;
  onNewOrders: (count: number) => void;
}

type Filter = 'active' | 'done';

/** Server bilan bir xil: holatdan keyin qaysi tugmalar chiqadi (src/utils/keyboards.js). */
const NEXT_STEPS: Record<OrderStatus, { label: string; status: OrderStatus; primary?: boolean }[]> = {
  new: [
    { label: 'Qabul qilish', status: 'accepted', primary: true },
    { label: 'Bekor qilish', status: 'cancelled' },
  ],
  accepted: [
    { label: 'Tayyorlanmoqda', status: 'cooking', primary: true },
    { label: 'Bekor qilish', status: 'cancelled' },
  ],
  cooking: [{ label: 'Yo‘lga chiqdi', status: 'delivering', primary: true }],
  delivering: [{ label: 'Yetkazildi', status: 'delivered', primary: true }],
  delivered: [],
  cancelled: [],
};

function OrderCard({ order, onChange }: { order: Order; onChange: (order: Order) => void }) {
  const { haptic } = useTelegram();
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState('');
  const status = STATUS_INFO[order.status];
  const hasMap = order.latitude != null && order.longitude != null;

  const move = async (next: OrderStatus) => {
    if (next === 'cancelled' && !(await confirmAction(`Buyurtma #${order.id} bekor qilinsinmi? Mijozga xabar boradi.`))) return;
    setBusy(next);
    setError('');
    try {
      const updated = await adminApi.setOrderStatus(order.id, next);
      haptic('success');
      onChange(updated);
    } catch (requestError) {
      haptic('error');
      setError((requestError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className={cn('rounded-[22px] bg-white p-4 shadow-[var(--shadow-card)]', order.status === 'new' && 'ring-2 ring-action')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[17px] font-extrabold">Buyurtma #{order.id}</h3>
          <p className="tabular text-[12.5px] text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[12px] font-extrabold', status.tone)}>{status.label}</span>
      </div>

      <ul className="mt-3 space-y-1 border-y border-line py-2.5">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.name}`} className="flex justify-between gap-3 text-[14px]">
            <span className="min-w-0">
              <b className="tabular">{item.quantity}×</b> {item.name}
            </span>
            <span className="tabular shrink-0 text-muted">{formatSum(item.sum)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-2.5 space-y-1.5 text-[13.5px]">
        <div className="flex gap-2">
          <Icon name="user" size={17} className="mt-px shrink-0 text-muted" />
          <dd className="font-bold">{order.customerName}</dd>
        </div>
        <div className="flex gap-2">
          <Icon name="phone" size={17} className="mt-px shrink-0 text-muted" />
          <dd>
            <a href={`tel:${order.phone.replace(/[^\d+]/g, '')}`} className="font-bold text-action">
              {order.phone}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <Icon name="pin" size={17} className="mt-px shrink-0 text-muted" />
          <dd className="min-w-0">
            {order.address}
            {hasMap && (
              <a
                href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="ml-1.5 inline-flex items-center gap-0.5 font-bold text-action"
              >
                <Icon name="map" size={14} /> Xarita
              </a>
            )}
          </dd>
        </div>
        {order.comment && (
          <div className="rounded-xl bg-saffron-soft px-3 py-2 text-[13px] text-[#6b4200]">💬 {order.comment}</div>
        )}
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted">
          {PAYMENT_INFO[order.paymentMethod].label}
          {order.paymentStatus === 'paid' && <b className="text-success"> · to‘langan</b>}
        </span>
        <span className="tabular text-[17px] font-extrabold">{formatSum(order.total)}</span>
      </div>

      {NEXT_STEPS[order.status].length > 0 && (
        <div className="mt-3 flex gap-2">
          {NEXT_STEPS[order.status].map((step) => (
            <Button
              key={step.status}
              size="md"
              variant={step.primary ? 'primary' : 'secondary'}
              className={step.primary ? 'flex-1' : 'shrink-0'}
              loading={busy === step.status}
              disabled={busy !== null}
              onClick={() => move(step.status)}
            >
              {step.label}
            </Button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-[13px] font-semibold text-action">{error}</p>}
    </article>
  );
}

export function AdminOrders({ showToast, onNewOrders }: AdminOrdersProps) {
  const [filter, setFilter] = useState<Filter>('active');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const next = await adminApi.orders(filter);
      setOrders(next);
      if (filter === 'active') onNewOrders(next.filter((order) => order.status === 'new').length);
      setError('');
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, [filter, onNewOrders]);

  useEffect(() => {
    setOrders(null);
    load();
    const timer = window.setInterval(load, 20_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const replace = (updated: Order) => {
    showToast(`#${updated.id}: ${STATUS_INFO[updated.status].label}`);
    setOrders((prev) => {
      if (!prev) return prev;
      const finished = updated.status === 'delivered' || updated.status === 'cancelled';
      // Yakunlangan buyurtma "Faol" ro'yxatidan chiqib ketadi
      const next = filter === 'active' && finished ? prev.filter((order) => order.id !== updated.id) : prev.map((order) => (order.id === updated.id ? updated : order));
      if (filter === 'active') onNewOrders(next.filter((order) => order.status === 'new').length);
      return next;
    });
  };

  return (
    <>
      <Header title="Buyurtmalar" note="Har 20 soniyada o‘zi yangilanadi" />

      <div className="mt-3 flex gap-1 rounded-2xl bg-surface p-1">
        {(
          [
            ['active', 'Jarayonda'],
            ['done', 'Yakunlangan'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'h-10 flex-1 rounded-xl text-[14px] font-extrabold transition',
              filter === key ? 'bg-white text-ink shadow-sm' : 'text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-center text-[14px] text-muted">{error}</p>}

      {!orders && !error && (
        <div className="mt-4 space-y-3">
          {[0, 1].map((key) => (
            <div key={key} className="h-[220px] animate-pulse rounded-[22px] bg-surface" />
          ))}
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-muted">
            <Icon name="check" size={30} />
          </span>
          <p className="mt-3 text-[16px] font-extrabold">{filter === 'active' ? 'Hozircha hammasi bajarilgan' : 'Yakunlangan buyurtmalar yo‘q'}</p>
          <p className="mt-1 text-[13.5px] text-muted">
            {filter === 'active' ? 'Yangi buyurtma kelsa, shu yerda paydo bo‘ladi.' : 'Yetkazilgan va bekor qilinganlar shu yerda turadi.'}
          </p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onChange={replace} />
          ))}
        </div>
      )}
    </>
  );
}

export default AdminOrders;
