'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface TelegramContextValue {
  /** Telegram WebApp obyekti (oddiy brauzerda null) */
  webApp: TelegramWebApp | null;
  /** Telegram'dagi foydalanuvchi (imzosiz, faqat ko'rsatish uchun) */
  user: TelegramWebAppUser | null;
  /** Mini App yuklanib, Telegram obyekti tekshirib bo'lindi */
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  user: null,
  isReady: false,
});

const BRAND_BG = '#fffaf3';

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>({ webApp: null, user: null, isReady: false });

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;

    // Oddiy brauzerda ochilganda initData bo'sh bo'ladi
    if (!webApp || !webApp.initData) {
      setValue({ webApp: null, user: null, isReady: true });
      return;
    }

    webApp.ready();
    webApp.expand();

    try {
      webApp.setHeaderColor(BRAND_BG);
      webApp.setBackgroundColor(BRAND_BG);
      webApp.setBottomBarColor?.(BRAND_BG);
      webApp.disableVerticalSwipes?.();
    } catch {
      // Eski Telegram versiyalarida bu metodlar bo'lmasligi mumkin
    }

    setValue({ webApp, user: webApp.initDataUnsafe.user || null, isReady: true });
  }, []);

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegramContext() {
  return useContext(TelegramContext);
}
