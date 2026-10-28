'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { AdminProduct } from '@/lib/types';
import { cn, formatSum } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Switch from '@/components/ui/Switch';
import ProductImage from '@/components/ui/ProductImage';
import ProductEditor from './ProductEditor';

interface AdminMenuProps {
  showToast: (message: string) => void;
}

const ALL = 'Barchasi';
const STOP = 'Stop-list';

export function AdminMenu({ showToast }: AdminMenuProps) {
  const { haptic } = useTelegram();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(ALL);
  const [search, setSearch] = useState('');
  // null — yopiq, 'new' — yangi taom, aks holda tahrirlanayotgan taom
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.products();
      setProducts(data.products);
      setCategories(data.categories);
      setError('');
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stopCount = products?.filter((product) => !product.isActive).length || 0;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (products || []).filter((product) => {
      if (filter === STOP && product.isActive) return false;
      if (filter !== ALL && filter !== STOP && product.category !== filter) return false;
      return !query || product.name.toLowerCase().includes(query);
    });
  }, [products, filter, search]);

  const upsertLocal = (product: AdminProduct) =>
    setProducts((prev) => {
      if (!prev) return [product];
      const exists = prev.some((item) => item.id === product.id);
      return exists ? prev.map((item) => (item.id === product.id ? product : item)) : [...prev, product];
    });

  /** Stop-list: bir bosishda sotuvdan olib qo'yish yoki qaytarish. */
  const toggleActive = async (product: AdminProduct, isActive: boolean) => {
    haptic('light');
    upsertLocal({ ...product, isActive });
    try {
      upsertLocal(await adminApi.updateProduct(product.id, { isActive }));
      showToast(isActive ? `${product.name} — sotuvda` : `${product.name} — stop-listda`);
    } catch (requestError) {
      upsertLocal(product);
      showToast((requestError as Error).message);
    }
  };

  const chips = [ALL, ...categories.filter((category) => products?.some((product) => product.category === category)), STOP];

  return (
    <>
      <Header
        title="Menyu"
        note={products ? `${products.length} ta taom · ${stopCount} tasi stop-listda` : 'Yuklanmoqda…'}
        action={
          <Button size="sm" onClick={() => setEditing('new')}>
            <Icon name="plus" size={17} strokeWidth={2.6} /> Taom
          </Button>
        }
      />

      <div className="relative mt-3">
        <Icon name="search" size={19} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Taom nomi bo‘yicha qidirish"
          aria-label="Qidirish"
          className="h-11 w-full rounded-2xl bg-surface pr-4 pl-10 text-[15px] outline-none placeholder:text-muted/80 focus:bg-white focus:ring-2 focus:ring-action/30"
        />
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => setFilter(chip)}
            className={cn(
              'h-9 shrink-0 rounded-full px-3.5 text-[13.5px] font-bold transition',
              filter === chip ? 'bg-ink text-white' : 'bg-surface text-ink',
            )}
          >
            {chip}
            {chip === STOP && stopCount > 0 && <span className="tabular ml-1 opacity-70">{stopCount}</span>}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-center text-[14px] text-muted">{error}</p>}

      {!products && !error && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3, 4].map((key) => (
            <div key={key} className="h-[76px] animate-pulse rounded-[18px] bg-surface" />
          ))}
        </div>
      )}

      {products && visible.length === 0 && (
        <p className="mt-10 text-center text-[14px] text-muted">
          {filter === STOP ? 'Stop-list bo‘sh — hamma taom sotuvda.' : 'Hech narsa topilmadi.'}
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {visible.map((product) => (
          <li
            key={product.id}
            className={cn(
              'flex items-center gap-3 rounded-[18px] bg-white p-2 pr-3 shadow-[var(--shadow-card)] transition-opacity',
              !product.isActive && 'opacity-60',
            )}
          >
            <button onClick={() => setEditing(product)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <ProductImage src={product.imageUrl} alt="" className="h-[60px] w-[60px] shrink-0 rounded-[14px]" />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-extrabold">{product.name}</span>
                <span className="tabular block text-[13.5px] font-bold">
                  {formatSum(product.newPrice)}
                  {product.oldPrice > product.newPrice && (
                    <s className="ml-1.5 font-semibold text-muted">{formatSum(product.oldPrice)}</s>
                  )}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-1 text-[11px] font-bold">
                  {!product.isActive && <span className="rounded-md bg-ink px-1.5 py-px text-white">Stop-list</span>}
                  {product.isPopular && <span className="rounded-md bg-action-soft px-1.5 py-px text-action-dark">Mashhur</span>}
                  {product.isBump && <span className="rounded-md bg-saffron-soft px-1.5 py-px text-[#8a5300]">Savatcha taklifi</span>}
                </span>
              </span>
            </button>
            <Switch
              checked={product.isActive}
              onChange={(value) => toggleActive(product, value)}
              label={`${product.name} sotuvda`}
            />
          </li>
        ))}
      </ul>

      {products && products.length > 0 && (
        <p className="mt-4 text-center text-[12.5px] leading-snug text-muted">
          O‘ngdagi tugma — stop-list: o‘chirsangiz taom mijozlarga ko‘rinmaydi.
          <br />
          Tahrirlash uchun taomni bosing.
        </p>
      )}

      <ProductEditor
        product={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={(product, created) => {
          upsertLocal(product);
          if (!categories.includes(product.category)) setCategories((prev) => [...prev, product.category]);
          setEditing(null);
          showToast(created ? `${product.name} menyuga qo‘shildi` : 'Saqlandi');
        }}
        onDeleted={(product) => {
          setProducts((prev) => prev?.filter((item) => item.id !== product.id) || prev);
          setEditing(null);
          showToast(`${product.name} o‘chirildi`);
        }}
      />
    </>
  );
}

export default AdminMenu;
