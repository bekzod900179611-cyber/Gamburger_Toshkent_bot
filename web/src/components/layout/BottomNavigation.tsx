'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CART_BUMP_EVENT } from '@/lib/flyToCart';
import { useTelegram } from '@/hooks/useTelegram';
import Icon, { type IconName } from '@/components/ui/Icon';

export type Tab = 'home' | 'catalog' | 'cart' | 'profile';

const TABS: { key: Tab; icon: IconName; label: string }[] = [
  { key: 'home', icon: 'home', label: 'Bosh sahifa' },
  { key: 'catalog', icon: 'search', label: 'Katalog' },
  { key: 'cart', icon: 'bag', label: 'Savatcha' },
  { key: 'profile', icon: 'user', label: 'Profil' },
];

interface BottomNavigationProps {
  tab: Tab;
  onChange: (tab: Tab) => void;
  cartCount: number;
}

export function BottomNavigation({ tab, onChange, cartCount }: BottomNavigationProps) {
  const { haptic } = useTelegram();
  const [bumps, setBumps] = useState(0);

  // Taom savatga "uchib" kelganda savat ikonkasi silkinadi
  useEffect(() => {
    const onBump = () => setBumps((value) => value + 1);
    window.addEventListener(CART_BUMP_EVENT, onBump);
    return () => window.removeEventListener(CART_BUMP_EVENT, onBump);
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[var(--safe-bottom)] backdrop-blur-md">
      <div className="mx-auto grid h-[var(--nav-height)] max-w-lg grid-cols-4">
        {TABS.map((item) => {
          const active = tab === item.key;
          const isCart = item.key === 'cart';
          return (
            <button
              key={item.key}
              onClick={() => {
                haptic('select');
                onChange(item.key);
              }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 transition-colors',
                active ? 'text-action' : 'text-muted',
              )}
            >
              <span
                key={isCart ? bumps : undefined}
                data-cart-target={isCart ? '' : undefined}
                className={cn('relative', isCart && bumps > 0 && 'animate-bump')}
              >
                <Icon name={item.icon} size={24} strokeWidth={active ? 2.4 : 2} />
                {isCart && cartCount > 0 && (
                  <span className="tabular absolute -top-1.5 -right-2.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-action px-1 text-[10.5px] font-extrabold text-white ring-2 ring-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;
