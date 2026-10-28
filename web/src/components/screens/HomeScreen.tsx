'use client';

import { useMemo, useRef } from 'react';
import type { AppConfig, Product, User } from '@/lib/types';
import { formatSum, greeting } from '@/lib/utils';
import { flyToCart } from '@/lib/flyToCart';
import { taglineFor } from '@/lib/taglines';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/layout/Header';
import Stories, { type Story } from '@/components/layout/Stories';
import ProductCard from '@/components/features/ProductCard';
import ProductImage from '@/components/ui/ProductImage';
import Icon from '@/components/ui/Icon';
import Stepper from '@/components/ui/Stepper';

interface HomeScreenProps {
  config: AppConfig;
  user: User | null;
  products: Product[];
  onOpenProduct: (product: Product) => void;
  onOpenCategory: (category: string) => void;
}

const CATEGORY_TILES = [
  { category: 'Burgerlar', slug: 'chizburger' },
  { category: 'Lavash va hot-dog', slug: 'lavash-gosht' },
  { category: 'Gazaklar', slug: 'fri' },
  { category: 'Ichimliklar', slug: 'milkshake' },
];

export function HomeScreen({ config, user, products, onOpenProduct, onOpenCategory }: HomeScreenProps) {
  const { haptic, user: tgUser } = useTelegram();
  const { add, setQuantity, quantityOf } = useCart();
  const heroImageRef = useRef<HTMLDivElement>(null);

  const bySlug = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);
  const name = user?.firstName || tgUser?.first_name || '';
  const popular = products.filter((product) => product.isPopular);
  const hero = bySlug.get('klassik-burger') || popular[0] || products[0];
  const recommended = products.filter((product) => !product.isPopular && product.category === 'Burgerlar').slice(0, 4);

  const image = (slug: string) => bySlug.get(slug)?.imageUrl;

  const stories: Story[] = [
    {
      id: 'burger',
      label: 'Burgerlar',
      image: image('klassik-burger'),
      title: 'Grildan endi tushdi',
      text: 'Sersuv mol go‘shti kotleti, yangi sabzavotlar va maxsus sous — har kuni yangi.',
      category: 'Burgerlar',
    },
    {
      id: 'kombo',
      label: 'Kombo',
      image: image('kombo'),
      title: 'Burger + fri — arzonroq',
      text: 'Klassik gamburger va kartoshka fri birga olsangiz, 10 000 so‘m tejaysiz.',
      category: 'Burgerlar',
    },
    {
      id: 'lavash',
      label: 'Lavash',
      image: image('lavash-gosht'),
      title: 'Bir qo‘lda tushlik',
      text: 'Go‘shtli, tovuqli lavash va donar — yo‘lda ham qulay.',
      category: 'Lavash va hot-dog',
    },
    {
      id: 'qanot',
      label: 'Qanotchalar',
      image: image('qanotchalar'),
      title: 'Achchiq-shirin qanotchalar',
      text: 'Qarsildoq, sousga botirilgan — do‘stlar bilan bo‘lishish uchun.',
      category: 'Gazaklar',
    },
    {
      id: 'shake',
      label: 'Milkshake',
      image: image('milkshake'),
      title: 'Shirin yakun',
      text: 'Oreo milkshake — burgerdan keyin eng zo‘r desert.',
      category: 'Ichimliklar',
    },
  ];

  const addHero = () => {
    if (!hero) return;
    haptic('success');
    add(hero, 1);
    flyToCart(heroImageRef.current, hero.imageUrl);
  };

  return (
    <>
      <Header
        title={name ? `${greeting()}, ${name}!` : `${greeting()}!`}
        note="Bugun nima yeymiz? Hammasi issiqqina, 20–30 daqiqada."
      />
      <div className="mt-2 flex items-center gap-1.5 text-[13.5px] font-semibold text-ink/80">
        <Icon name="pin" size={17} className="text-muted" />
        Toshkent bo‘ylab yetkazib beramiz
      </div>

      <Stories items={stories} onOpenCategory={onOpenCategory} />

      {hero && (
        <section className="relative mt-1 overflow-hidden rounded-[26px] bg-ink text-white shadow-[var(--shadow-card)]">
          <button onClick={() => onOpenProduct(hero)} className="block w-full text-left" aria-label={hero.name}>
            <ProductImage ref={heroImageRef} large src={hero.imageUrl} alt={hero.name} className="h-[248px] w-full" />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
            <span className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[12.5px] font-extrabold text-ink">
              <Icon name="flame" size={15} className="text-action" /> Grildan endi tushdi
            </span>
          </button>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <h2 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em]">{hero.name}</h2>
              <div className="tabular mt-0.5 text-[16px] font-bold text-white/90">{formatSum(hero.newPrice)}</div>
              {taglineFor(hero.slug) && (
                <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/85">{taglineFor(hero.slug)}</p>
              )}
            </div>
            {quantityOf(hero.id) > 0 ? (
              <div className="shrink-0 animate-pop">
                <Stepper
                  tone="action"
                  value={quantityOf(hero.id)}
                  onChange={(value) => {
                    haptic('light');
                    setQuantity(hero.id, value);
                  }}
                />
              </div>
            ) : (
              <button
                onClick={addHero}
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-2xl bg-action px-4 text-[15px] font-extrabold shadow-[var(--shadow-action)] transition active:scale-95"
              >
                <Icon name="plus" size={18} strokeWidth={2.6} />
                Savatga
              </button>
            )}
          </div>
        </section>
      )}

      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
          <Icon name="clock" size={20} className="text-action" />
          <span className="text-[13px] leading-tight font-semibold">20–30 daqiqada yetkazamiz</span>
        </div>
        {config.delivery.freeFrom > 0 && (
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface px-3 py-2.5">
            <Icon name="truck" size={20} className="text-action" />
            <span className="text-[13px] leading-tight font-semibold">
              {formatSum(config.delivery.freeFrom)}dan bepul
            </span>
          </div>
        )}
      </div>

      <h2 className="mt-5 mb-3 text-[20px] font-extrabold tracking-[-0.01em]">Hamma sevadigan taomlar</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {popular.map((product) => (
          <div key={product.id} className="w-[158px] shrink-0">
            <ProductCard product={product} onOpen={onOpenProduct} />
          </div>
        ))}
      </div>

      <h2 className="mt-7 mb-3 text-[20px] font-extrabold tracking-[-0.01em]">Menyu bo‘limlari</h2>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_TILES.map((tile) => (
          <button
            key={tile.category}
            onClick={() => onOpenCategory(tile.category)}
            className="group relative h-24 overflow-hidden rounded-[20px] text-left transition active:scale-[0.98]"
          >
            <ProductImage src={image(tile.slug) || ''} alt="" className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-0 bg-linear-to-r from-black/70 to-black/5" />
            <span className="absolute bottom-2.5 left-3 text-[16px] font-extrabold text-white">{tile.category}</span>
          </button>
        ))}
      </div>

      {recommended.length > 0 && (
        <>
          <div className="mt-7 mb-3 flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold tracking-[-0.01em]">Yana burgerlar</h2>
            <button
              onClick={() => onOpenCategory('Barchasi')}
              className="flex items-center gap-0.5 text-[14px] font-bold text-action"
            >
              Hammasi <Icon name="chevronRight" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default HomeScreen;
