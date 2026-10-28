'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { AdminStats, User } from '@/lib/types';
import { cn, formatNumber, formatSum, greeting } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Icon, { type IconName } from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

interface AdminDashboardProps {
  user: User;
  onOpenOrders: () => void;
  onNewOrders: (count: number) => void;
}

const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

/** "2026-10-28" → hafta kuni (sana UTC'da o'qiladi — vaqt zonasi kunni surmasin). */
function weekday(day: string) {
  return WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()];
}

/** 1 250 000 → "1.3 mln", 85 000 → "85 ming" — ustun ustidagi qisqa yozuv. */
function compactSum(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')} mln`;
  if (value >= 1000) return `${Math.round(value / 1000)} ming`;
  return String(value);
}

function StatTile({ icon, label, value, note }: { icon: IconName; label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[20px] bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-muted">
        <Icon name={icon} size={16} className="text-action" />
        {label}
      </div>
      <div className="tabular mt-1.5 text-[21px] leading-tight font-extrabold tracking-[-0.01em]">{value}</div>
      {note && <div className="mt-0.5 text-[12px] text-muted">{note}</div>}
    </div>
  );
}

function WeekChart({ week }: { week: AdminStats['week'] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...week.map((day) => day.revenue), 1);
  const todayIndex = week.length - 1;
  const shown = active ?? todayIndex;
  const total = week.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <section className="mt-3 rounded-[22px] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-extrabold">7 kunlik tushum</h2>
        <span className="tabular text-[13px] font-bold text-muted">{formatSum(total)}</span>
      </div>

      {/* Bitta qator — legend shart emas, sarlavha nomlaydi. Ustunni bosing — qiymati chiqadi. */}
      <div className="relative mt-4 flex h-[150px] items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
        {week.map((day, index) => {
          const height = day.revenue > 0 ? Math.max(4, (day.revenue / max) * 118) : 0;
          const isShown = index === shown;
          return (
            <button
              key={day.day}
              type="button"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              aria-label={`${weekday(day.day)}: ${formatSum(day.revenue)}, ${day.orders} ta buyurtma`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
            >
              {isShown && (
                <span className="tabular absolute z-10 rounded-lg bg-ink px-2 py-1 text-[11.5px] font-bold whitespace-nowrap text-white" style={{ bottom: height + 8 }}>
                  {compactSum(day.revenue)} · {day.orders} ta
                </span>
              )}
              <span
                className={cn(
                  'w-full max-w-[30px] rounded-t-[4px] transition-colors',
                  isShown ? 'bg-action' : 'bg-action/45 group-hover:bg-action/70',
                )}
                style={{ height }}
              />
              {day.revenue === 0 && <span className="h-[2px] w-full max-w-[30px] rounded-full bg-line" />}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px] border-t border-line pt-1.5">
        {week.map((day, index) => (
          <span
            key={day.day}
            className={cn('flex-1 text-center text-[11.5px] font-bold', index === todayIndex ? 'text-ink' : 'text-muted')}
          >
            {index === todayIndex ? 'Bugun' : weekday(day.day)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>7 kunlik tushum</caption>
        <tbody>
          {week.map((day) => (
            <tr key={day.day}>
              <th>{day.day}</th>
              <td>{formatSum(day.revenue)}</td>
              <td>{day.orders} ta buyurtma</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function AdminDashboard({ user, onOpenOrders, onNewOrders }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const next = await adminApi.stats();
      setStats(next);
      onNewOrders(next.newOrders);
      setError('');
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, [onNewOrders]);

  // Yangi buyurtmalar o'z-o'zidan ko'rinsin: har 30 soniyada yangilanadi
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <>
      <Header
        title={`${greeting()}, ${user.firstName || 'admin'}!`}
        note="Bugungi holat bir qarashda"
        action={
          <button
            onClick={load}
            aria-label="Yangilash"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink active:scale-95"
          >
            <Icon name="refresh" size={19} />
          </button>
        }
      />

      {error && !stats && (
        <div className="mt-6 text-center">
          <p className="text-[14px] text-muted">{error}</p>
          <Button className="mt-3" size="sm" onClick={load}>
            Qayta urinish
          </Button>
        </div>
      )}

      {!stats && !error && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-[92px] animate-pulse rounded-[20px] bg-surface" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {stats.newOrders > 0 && (
            <button
              onClick={onOpenOrders}
              className="mt-4 flex w-full animate-rise items-center gap-3 rounded-[20px] bg-action p-4 text-left text-white shadow-[var(--shadow-action)] active:scale-[0.98]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/20">
                <Icon name="bag" size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-extrabold">{stats.newOrders} ta yangi buyurtma</span>
                <span className="block text-[13px] text-white/85">Qabul qilishni kutmoqda</span>
              </span>
              <Icon name="chevronRight" size={20} />
            </button>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile icon="cash" label="Bugungi tushum" value={formatSum(stats.todayRevenue)} />
            <StatTile icon="bag" label="Bugun buyurtma" value={`${stats.todayOrders} ta`} />
            <StatTile icon="truck" label="Jarayonda" value={`${stats.activeOrders} ta`} note="yetkazilmagan" />
            <StatTile icon="card" label="O‘rtacha chek" value={formatSum(stats.avgCheck)} note="oxirgi 30 kun" />
          </div>

          <WeekChart week={stats.week} />

          <section className="mt-3 rounded-[22px] bg-white p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-[16px] font-extrabold">Eng ko‘p sotilganlar</h2>
            <p className="text-[12.5px] text-muted">Oxirgi 30 kun</p>
            {stats.top.length === 0 ? (
              <p className="mt-3 text-[14px] text-muted">Hali buyurtmalar yo‘q — birinchisi kelishi bilan shu yerda ko‘rinadi.</p>
            ) : (
              <ol className="mt-2">
                {stats.top.map((item, index) => (
                  <li key={item.name} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                    <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-[13px] font-extrabold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14.5px] font-bold">{item.name}</span>
                    <span className="tabular text-right text-[13px] text-muted">
                      <b className="text-ink">{item.quantity} ta</b> · {formatNumber(item.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <p className="mt-4 text-center text-[12.5px] text-muted">
            Botdan foydalanuvchilar: <b className="tabular text-ink">{stats.users}</b>
          </p>
        </>
      )}
    </>
  );
}

export default AdminDashboard;
