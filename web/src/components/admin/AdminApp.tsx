'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { User } from '@/lib/types';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Icon, { type IconName } from '@/components/ui/Icon';
import Toast from '@/components/ui/Toast';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminMenu from './AdminMenu';

export type AdminTab = 'dashboard' | 'orders' | 'menu';

const TABS: { key: AdminTab; icon: IconName; label: string }[] = [
  { key: 'dashboard', icon: 'chart', label: 'Bosh sahifa' },
  { key: 'orders', icon: 'list', label: 'Buyurtmalar' },
  { key: 'menu', icon: 'edit', label: 'Menyu' },
];

export function AdminApp() {
  const { isReady, haptic } = useTelegram();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [newOrders, setNewOrders] = useState(0);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setUser(await api.getMe());
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const changeTab = (next: AdminTab) => {
    haptic('select');
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-8 text-center">
        <h1 className="text-[20px] font-extrabold">Ulanishda xatolik</h1>
        <p className="mt-1 text-sm text-muted">{error}</p>
        <Button className="mt-6" onClick={load}>
          Qayta urinish
        </Button>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-action border-r-transparent" />
      </main>
    );
  }

  if (!user.isAdmin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-surface text-muted">
          <Icon name="shield" size={30} />
        </span>
        <h1 className="mt-4 text-[20px] font-extrabold">Bu bo‘lim faqat adminlar uchun</h1>
        <p className="mt-1.5 text-[14px] leading-snug text-muted">
          Sizning Telegram ID: <b className="tabular text-ink">{user.telegramId}</b>. Admin bo‘lish uchun uni
          ADMIN_IDS ga yozdiring yoki admin guruhiga qo‘shiling.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => (window.location.href = '/')}>
          Menyuga qaytish
        </Button>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-lg px-4 pb-[calc(var(--nav-height)+var(--safe-bottom)+24px)]">
        {tab === 'dashboard' && <AdminDashboard user={user} onOpenOrders={() => changeTab('orders')} onNewOrders={setNewOrders} />}
        {tab === 'orders' && <AdminOrders showToast={setToast} onNewOrders={setNewOrders} />}
        {tab === 'menu' && <AdminMenu showToast={setToast} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[var(--safe-bottom)] backdrop-blur">
        <div className="mx-auto flex h-[var(--nav-height)] max-w-lg">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => changeTab(item.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11.5px] font-bold transition-colors',
                  active ? 'text-action' : 'text-muted',
                )}
              >
                <span className="relative">
                  <Icon name={item.icon} size={23} strokeWidth={active ? 2.4 : 2} />
                  {item.key === 'orders' && newOrders > 0 && (
                    <span className="tabular absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-action px-1 text-[10.5px] font-extrabold text-white">
                      {newOrders}
                    </span>
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <Toast message={toast} onDone={() => setToast('')} />
    </>
  );
}

export default AdminApp;
