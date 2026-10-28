'use client';

import { useState } from 'react';
import api from '@/lib/api';
import type { AppConfig, Order, Product, User } from '@/lib/types';
import { cn, formatDate, formatSum, PAYMENT_INFO, STATUS_INFO } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ProductImage from '@/components/ui/ProductImage';

interface ProfileScreenProps {
  config: AppConfig;
  user: User | null;
  orders: Order[];
  products: Product[];
  onReload: () => void;
  onGoCart: () => void;
  showToast: (message: string) => void;
}

export function ProfileScreen({ config, user, orders, products, onReload, onGoCart, showToast }: ProfileScreenProps) {
  const { haptic, user: tgUser, openInvoice, isTelegram } = useTelegram();
  const { add } = useCart();
  const [paying, setPaying] = useState<number | null>(null);

  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : tgUser?.first_name || 'Mehmon';
  const photo = tgUser?.photo_url;

  const reorder = (order: Order) => {
    let added = 0;
    for (const item of order.items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (product) {
        add(product, item.quantity);
        added += 1;
      }
    }
    if (added === 0) {
      haptic('error');
      return showToast('Bu taomlar hozir menyuda yo‘q');
    }
    haptic('success');
    showToast('Savatchaga qo‘shildi');
    onGoCart();
  };

  const pay = async (order: Order) => {
    if (!isTelegram) return showToast('To‘lov faqat Telegram ichida ishlaydi');
    setPaying(order.id);
    try {
      const { invoiceLink } = await api.createInvoice(order.id);
      const status = await openInvoice(invoiceLink);
      if (status === 'paid') {
        haptic('success');
        showToast('To‘lov qabul qilindi');
        setTimeout(onReload, 1500);
      }
    } catch (error) {
      showToast((error as Error).message);
    } finally {
      setPaying(null);
    }
  };

  return (
    <>
      <Header
        title="Profil"
        action={
          user?.isAdmin && (
            <a
              href="/admin"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13.5px] font-extrabold text-white active:scale-95"
            >
              <Icon name="settings" size={17} /> Admin panel
            </a>
          )
        }
      />

      <div className="mt-3 flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-action text-[26px] font-extrabold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-[20px] font-extrabold">{name}</div>
          <div className="text-[14px] text-muted">{user?.phone || 'Telefon hali kiritilmagan'}</div>
        </div>
      </div>

      <div className="mt-7 mb-3 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold tracking-[-0.01em]">Buyurtmalarim</h2>
        <button onClick={onReload} aria-label="Yangilash" className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted active:rotate-180 transition-transform duration-500">
          <Icon name="refresh" size={18} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-surface px-6 py-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-muted">
            <Icon name="bag" size={26} />
          </div>
          <p className="mt-3 text-[16px] font-extrabold">Hali buyurtma bermadingiz</p>
          <p className="mt-1 text-[14px] text-muted">Birinchi buyurtmangiz shu yerda ko‘rinadi.</p>
        </div>
      ) : (
        <ul className="stagger space-y-3">
          {orders.map((order) => {
            const status = STATUS_INFO[order.status];
            const needsPayment =
              order.paymentMethod !== 'cash' && order.paymentStatus === 'pending' && order.status !== 'cancelled';
            return (
              <li key={order.id} className="rounded-[var(--radius-card)] border border-line p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="tabular text-[16px] font-extrabold">Buyurtma #{order.id}</div>
                    <div className="tabular text-[12.5px] text-muted">{formatDate(order.createdAt)}</div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[12px] font-extrabold',
                      needsPayment ? 'bg-action-soft text-action-dark' : status.tone,
                    )}
                  >
                    {needsPayment ? 'To‘lanmagan' : status.label}
                  </span>
                </div>

                <div className="mt-3 flex -space-x-2">
                  {order.items.slice(0, 5).map((item) => (
                    <ProductImage
                      key={item.productId}
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-11 w-11 rounded-full ring-2 ring-white"
                    />
                  ))}
                </div>
                <p className="mt-2 line-clamp-2 text-[13.5px] text-ink/75">
                  {order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <div>
                    <div className="tabular text-[17px] font-extrabold">{formatSum(order.total)}</div>
                    <div className="text-[12.5px] text-muted">{PAYMENT_INFO[order.paymentMethod].label}</div>
                  </div>
                  {needsPayment ? (
                    <Button size="sm" loading={paying === order.id} onClick={() => pay(order)}>
                      To‘lash
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => reorder(order)}>
                      <Icon name="refresh" size={16} /> Takrorlash
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-7 rounded-[var(--radius-card)] bg-surface p-4 text-[14.5px]">
        <div className="text-[16px] font-extrabold">{config.restaurant.name}</div>
        {config.restaurant.phone && (
          <a
            href={`tel:${config.restaurant.phone.replace(/\s/g, '')}`}
            className="mt-2 flex items-center gap-2 font-bold text-action"
          >
            <Icon name="phone" size={18} /> {config.restaurant.phone}
          </a>
        )}
        {config.restaurant.address && (
          <div className="mt-2 flex items-start gap-2 text-muted">
            <Icon name="pin" size={18} className="mt-0.5 shrink-0" /> {config.restaurant.address}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2 text-muted">
          <Icon name="clock" size={18} /> Har kuni 09:00 — 23:00
        </div>
      </div>
    </>
  );
}

export default ProfileScreen;
