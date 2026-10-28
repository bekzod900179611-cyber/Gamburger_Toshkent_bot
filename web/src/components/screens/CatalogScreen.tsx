'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/features/ProductCard';
import Icon from '@/components/ui/Icon';

interface CatalogScreenProps {
  products: Product[];
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  onOpenProduct: (product: Product) => void;
}

export function CatalogScreen({ products, categories, category, onCategoryChange, onOpenProduct }: CatalogScreenProps) {
  const { haptic } = useTelegram();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        (category === 'Barchasi' || product.category === category) &&
        (!term || product.name.toLowerCase().includes(term)),
    );
  }, [products, category, search]);

  return (
    <>
      <Header title="Menyu" note="Har bir taom buyurtmangizdan keyin tayyorlanadi" />

      <div className="relative mt-3">
        <Icon name="search" size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Burger, lavash, fri…"
          aria-label="Taom qidirish"
          className="h-12 w-full rounded-2xl bg-surface pr-4 pl-11 text-[15px] outline-none placeholder:text-muted/80 focus:bg-white focus:ring-2 focus:ring-action"
        />
      </div>

      <div className="no-scrollbar sticky top-0 z-20 -mx-4 mt-1 flex gap-2 overflow-x-auto bg-bg/95 px-4 py-3 backdrop-blur-md">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => {
              haptic('select');
              onCategoryChange(item);
            }}
            className={cn(
              'h-10 shrink-0 rounded-full px-4 text-[14px] font-bold whitespace-nowrap transition-colors',
              category === item ? 'bg-ink text-white' : 'bg-surface text-ink',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface text-muted">
            <Icon name="search" size={28} />
          </div>
          <p className="mt-3 text-[16px] font-extrabold">Bunday taom topilmadi</p>
          <p className="mt-1 text-[14px] text-muted">Boshqa so‘z bilan qidirib ko‘ring yoki bo‘limni almashtiring.</p>
        </div>
      ) : (
        <div key={category + search} className="stagger grid grid-cols-2 gap-x-3 gap-y-5 pt-1">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
          ))}
        </div>
      )}
    </>
  );
}

export default CatalogScreen;
