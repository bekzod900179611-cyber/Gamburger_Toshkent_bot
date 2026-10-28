'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { AppConfig, Order, PaymentMethod, User } from '@/lib/types';
import { cn, formatNumber, formatSum, PAYMENT_INFO } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Input, Textarea } from '@/components/ui/Input';

const ALL_METHODS: PaymentMethod[] = ['cash', 'click', 'payme', 'telegram_stars'];

type LocationState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; latitude: number; longitude: number }
  | { kind: 'error'; message: string };

interface CheckoutSheetProps {
  open: boolean;
  onClose: () => void;
  config: AppConfig;
  user: User | null;
  onUserChange: (user: User) => void;
  onSuccess: (order: Order) => void;
}

export function CheckoutSheet({ open, onClose, config, user, onUserChange, onSuccess }: CheckoutSheetProps) {
  const { haptic, isTelegram, openInvoice, requestContact, getLocation } = useTelegram();
  const cart = useCart(config.delivery);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState<LocationState>({ kind: 'idle' });
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (user) {
      setName((value) => value || [user.firstName, user.lastName].filter(Boolean).join(' '));
      setPhone((value) => value || user.phone || '');
    }
  }, [open, user]);

  const available = (method: PaymentMethod) => config.paymentMethods.includes(method);
  const stars = Math.max(1, Math.ceil(cart.total / config.starsRate));

  const fillPhoneFromTelegram = async () => {
    haptic('light');
    const shared = await requestContact();
    if (!shared) return;

    // Kontakt botga keladi va bazaga yoziladi — bir oz kutib qayta o'qiymiz
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const fresh = await api.getMe().catch(() => null);
      if (fresh?.phone) {
        onUserChange(fresh);
        setPhone(fresh.phone);
        return;
      }
    }
  };

  const detectLocation = async () => {
    haptic('light');
    setLocation({ kind: 'loading' });
    const point = await getLocation();

    if (!point) {
      haptic('warning');
      setLocation({
        kind: 'error',
        message: 'Joylashuvni aniqlab bo‘lmadi. Telegram sozlamalarida ruxsat bering yoki manzilni yozing.',
      });
      return;
    }

    haptic('success');
    setLocation({ kind: 'done', ...point });
    const found = await api.reverseGeocode(point.latitude, point.longitude).catch(() => null);
    if (found?.address) setAddress((value) => (value.trim() ? value : found.address));
  };

  const submit = async () => {
    setError('');
    if (name.trim().length < 2) return setError('Ismingizni kiriting');
    if (phone.replace(/\D/g, '').length < 9) return setError('Telefon raqamini to‘g‘ri kiriting');
    if (address.trim().length < 5) return setError('Yetkazib berish manzilini to‘liq kiriting');
    if (payment !== 'cash' && !isTelegram) return setError('Onlayn to‘lov faqat Telegram ichida ishlaydi');

    setSending(true);
    try {
      const point = location.kind === 'done' ? location : null;
      const { order, invoiceLink } = await api.createOrder({
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim() || undefined,
        latitude: point?.latitude,
        longitude: point?.longitude,
        paymentMethod: payment,
      });

      if (invoiceLink) {
        const status = await openInvoice(invoiceLink);
        if (status !== 'paid') {
          haptic('warning');
          setError(
            status === 'cancelled'
              ? `To‘lov bekor qilindi. Buyurtma #${order.id} saqlandi — Profil bo‘limidan to‘lashingiz mumkin.`
              : 'To‘lov amalga oshmadi. Qaytadan urinib ko‘ring yoki boshqa usulni tanlang.',
          );
          return;
        }
      }

      haptic('success');
      cart.clear();
      onSuccess({ ...order, paymentStatus: invoiceLink ? 'paid' : order.paymentStatus });
    } catch (requestError) {
      haptic('error');
      setError((requestError as Error).message);
    } finally {
      setSending(false);
    }
  };

  const ctaLabel =
    payment === 'telegram_stars'
      ? `To‘lash · ${formatNumber(stars)} Stars`
      : payment === 'cash'
        ? `Buyurtma berish · ${formatSum(cart.total)}`
        : `To‘lash · ${formatSum(cart.total)}`;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Rasmiylashtirish"
      footer={
        <Button block size="lg" onClick={submit} loading={sending}>
          {sending ? 'Yuborilmoqda…' : ctaLabel}
        </Button>
      }
    >
      <section>
        <h3 className="mt-1 mb-2.5 text-[16px] font-extrabold">Qayerga olib boramiz?</h3>

        <button
          onClick={detectLocation}
          disabled={location.kind === 'loading'}
          className={cn(
            'mb-3 flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.99]',
            location.kind === 'done' ? 'bg-success-soft' : 'bg-action-soft',
          )}
        >
          <span
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white',
              location.kind === 'done' ? 'text-success' : 'text-action',
            )}
          >
            {location.kind === 'loading' ? (
              <span className="h-5 w-5 animate-spin rounded-full border-[2.5px] border-current border-r-transparent" />
            ) : (
              <Icon name={location.kind === 'done' ? 'check' : 'locate'} size={22} strokeWidth={2.4} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold">
              {location.kind === 'done'
                ? 'Joylashuvingiz olindi'
                : location.kind === 'loading'
                  ? 'Aniqlanmoqda…'
                  : 'Joylashuvimni aniqlash'}
            </span>
            <span className="block text-[13px] text-muted">
              {location.kind === 'done'
                ? 'Kuryer sizni xaritadan aniq topadi'
                : 'Bir bosishda — kuryer adashmaydi'}
            </span>
          </span>
          {location.kind === 'done' && (
            <a
              href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="shrink-0 text-[13px] font-bold text-success underline underline-offset-2"
            >
              Xarita
            </a>
          )}
        </button>
        {location.kind === 'error' && (
          <p className="-mt-1 mb-3 text-[13px] font-semibold text-action-dark">{location.message}</p>
        )}

        <Textarea
          label="Manzil"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Tuman, ko‘cha, uy va xonadon raqami"
        />
        <Textarea
          label="Kuryerga izoh"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Masalan: 3-podyezd, domofon 45"
          maxLength={500}
        />
      </section>

      <section className="mt-2">
        <h3 className="mb-2.5 text-[16px] font-extrabold">Siz bilan qanday bog‘lanamiz?</h3>
        <Input
          label="Ismingiz"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ismingiz"
          autoComplete="name"
        />
        <Input
          label="Telefon raqam"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+998 90 123 45 67"
          inputMode="tel"
          autoComplete="tel"
          action={
            isTelegram && (
              <button onClick={fillPhoneFromTelegram} className="flex items-center gap-1 text-[13px] font-bold text-action">
                <Icon name="phone" size={15} /> Telegramdan olish
              </button>
            )
          }
        />
      </section>

      <section className="mt-2">
        <h3 className="mb-2.5 text-[16px] font-extrabold">To‘lov usuli</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_METHODS.map((method) => {
            const info = PAYMENT_INFO[method];
            const enabled = available(method);
            const selected = payment === method;
            return (
              <button
                key={method}
                disabled={!enabled}
                onClick={() => {
                  haptic('select');
                  setPayment(method);
                }}
                aria-pressed={selected}
                className={cn(
                  'relative rounded-2xl border-2 p-3 text-left transition',
                  selected ? 'border-action bg-action-soft' : 'border-transparent bg-surface',
                  !enabled && 'opacity-45',
                )}
              >
                <Icon name={info.icon} size={22} className={selected ? 'text-action' : 'text-ink'} />
                <div className="mt-1.5 text-[14.5px] font-extrabold">{info.label}</div>
                <div className="text-[12px] text-muted">{enabled ? info.hint : 'Tez orada'}</div>
                {selected && (
                  <span className="absolute top-2.5 right-2.5 grid h-5 w-5 animate-pop place-items-center rounded-full bg-action text-white">
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-5 space-y-2 rounded-2xl bg-surface p-4 text-[14.5px]">
        <div className="flex justify-between">
          <span className="text-muted">Taomlar ({cart.count})</span>
          <span className="tabular font-semibold">{formatSum(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Yetkazib berish</span>
          <span className={cn('tabular font-semibold', cart.deliveryFee === 0 && 'text-success')}>
            {cart.deliveryFee === 0 ? 'Bepul' : formatSum(cart.deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-[17px]">
          <span className="font-extrabold">Jami</span>
          <span className="tabular font-extrabold">{formatSum(cart.total)}</span>
        </div>
      </div>

      {error && (
        <div className="mt-3 animate-rise rounded-2xl bg-action-soft px-4 py-3 text-[14px] font-semibold text-action-dark" role="alert">
          {error}
        </div>
      )}
    </BottomSheet>
  );
}

export default CheckoutSheet;
