'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { AppConfig, Order, Product, User } from '@/lib/types';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import { useCartStore } from '@/store/cartStore';
import BottomNavigation, { type Tab } from '@/components/layout/BottomNavigation';
import Onboarding from '@/components/features/Onboarding';
import ProductSheet from '@/components/features/ProductSheet';
import CheckoutSheet from '@/components/features/CheckoutSheet';
import OrderSuccess from '@/components/features/OrderSuccess';
import HomeScreen from '@/components/screens/HomeScreen';
import CatalogScreen from '@/components/screens/CatalogScreen';
import CartScreen from '@/components/screens/CartScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import Icon from '@/components/ui/Icon';
import { formatSum } from '@/lib/utils';
import { CART_BUMP_EVENT } from '@/lib/flyToCart';
import { randomCheer } from '@/lib/taglines';

const ONBOARDING_KEY = 'gamburger-onboarded';

interface AppData {
  config: AppConfig;
  user: User;
  products: Product[];
  categories: string[];
  bump: Product | null;
}

function readOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Page() {
  const { isReady, isTelegram, haptic, close } = useTelegram();

  const [data, setData] = useState<AppData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  const [tab, setTab] = useState<Tab>('home');
  const [category, setCategory] = useState('Barchasi');
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState('');

  const cart = useCart(data?.config.delivery);
  const syncWithProducts = useCartStore((state) => state.syncWithProducts);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await api.getOrders());
    } catch {
      // Buyurtmalar tarixi yuklanmasa ham ilova ishlayveradi
    }
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const [config, user, products, categories, bump] = await Promise.all([
        api.getConfig(),
        api.getMe(),
        api.getProducts(),
        api.getCategories(),
        api.getBump(),
      ]);
      setData({ config, user, products, categories, bump });
      syncWithProducts(products);
      // Onboarding bir marta: bazada yoki shu qurilmada belgilangan bo'lsa ko'rsatilmaydi
      setOnboarded(user.onboarded || readOnboarded());
      loadOrders();
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, [loadOrders, syncWithProducts]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  // Savatga qo'shilganda quvnoq xabar — har safar emas, joniga tegmasligi uchun 8 soniyada bir marta
  useEffect(() => {
    let last = 0;
    const onAdded = () => {
      const now = Date.now();
      if (now - last < 8000) return;
      last = now;
      setToast(randomCheer());
    };
    window.addEventListener(CART_BUMP_EVENT, onAdded);
    return () => window.removeEventListener(CART_BUMP_EVENT, onAdded);
  }, []);

  const finishOnboarding = () => {
    setOnboarded(true);
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // ignore
    }
    api.setOnboarded().catch(() => {});
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    window.scrollTo({ top: 0 });
  };

  const openCategory = (next: string) => {
    haptic('light');
    setCategory(next);
    changeTab('catalog');
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

  if (!data || onboarded === null) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-action border-r-transparent" />
        <p className="text-[14px] font-semibold text-muted">Gril qizimoqda…</p>
      </main>
    );
  }

  if (!onboarded) {
    const photo = (slug: string) => data.products.find((product) => product.slug === slug)?.imageUrl || '';
    return <Onboarding onFinish={finishOnboarding} images={[photo('klassik-burger'), photo('lavash-gosht'), photo('kombo')]} />;
  }

  return (
    <>
      <main className="mx-auto max-w-lg px-4 pb-[calc(var(--nav-height)+var(--safe-bottom)+96px)]">
        {tab === 'home' && (
          <HomeScreen
            config={data.config}
            user={data.user}
            products={data.products}
            onOpenProduct={setSheetProduct}
            onOpenCategory={openCategory}
          />
        )}

        {tab === 'catalog' && (
          <CatalogScreen
            products={data.products}
            categories={data.categories}
            category={category}
            onCategoryChange={setCategory}
            onOpenProduct={setSheetProduct}
          />
        )}

        {tab === 'cart' && (
          <CartScreen
            config={data.config}
            bump={data.bump}
            onGoCatalog={() => changeTab('catalog')}
            onCheckout={() => setCheckoutOpen(true)}
          />
        )}

        {tab === 'profile' && (
          <ProfileScreen
            config={data.config}
            user={data.user}
            orders={orders}
            products={data.products}
            onReload={loadOrders}
            onGoCart={() => changeTab('cart')}
            showToast={setToast}
          />
        )}
      </main>

      {(tab === 'home' || tab === 'catalog') && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(var(--nav-height)+var(--safe-bottom)+8px)] z-30 px-4">
          <button
            onClick={() => {
              haptic('medium');
              changeTab('cart');
            }}
            className="mx-auto flex h-14 w-full max-w-lg animate-rise items-center justify-between rounded-2xl bg-ink px-5 text-white shadow-[var(--shadow-float)] active:scale-[0.98]"
          >
            <span className="flex items-center gap-2 text-[15px] font-extrabold">
              <Icon name="bag" size={20} /> Savatcha · {cart.count} ta
            </span>
            <span className="tabular text-[15px] font-extrabold">{formatSum(cart.total)}</span>
          </button>
        </div>
      )}

      <BottomNavigation tab={tab} onChange={changeTab} cartCount={cart.count} />

      <ProductSheet product={sheetProduct} onClose={() => setSheetProduct(null)} />

      <CheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        config={data.config}
        user={data.user}
        onUserChange={(user) => setData((prev) => (prev ? { ...prev, user } : prev))}
        onSuccess={(order) => {
          setCheckoutOpen(false);
          setSuccessOrder(order);
          loadOrders();
          api.getMe().then((user) => setData((prev) => (prev ? { ...prev, user } : prev))).catch(() => {});
        }}
      />

      {successOrder && (
        <OrderSuccess
          order={successOrder}
          isTelegram={isTelegram}
          onClose={close}
          onDone={() => {
            setSuccessOrder(null);
            changeTab('profile');
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </>
  );
}
