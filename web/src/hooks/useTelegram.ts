'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTelegramContext } from '@/providers/TelegramProvider';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'select';

/** window.Telegram.WebApp bilan ishlash uchun qulay funksiyalar. */
export function useTelegram() {
  const { webApp, user, isReady } = useTelegramContext();

  const haptic = useCallback(
    (style: HapticStyle = 'light') => {
      try {
        if (!webApp?.HapticFeedback) return;
        if (style === 'success' || style === 'error' || style === 'warning') {
          webApp.HapticFeedback.notificationOccurred(style);
        } else if (style === 'select') {
          webApp.HapticFeedback.selectionChanged();
        } else {
          webApp.HapticFeedback.impactOccurred(style);
        }
      } catch {
        // ignore
      }
    },
    [webApp],
  );

  /** To'lov oynasini ochadi; Telegramdan tashqarida 'failed' qaytaradi. */
  const openInvoice = useCallback(
    (url: string) =>
      new Promise<InvoiceStatus>((resolve) => {
        if (!webApp) return resolve('failed');
        webApp.openInvoice(url, resolve);
      }),
    [webApp],
  );

  /** Telegram'dagi telefon raqamini botga yuborishni so'raydi. */
  const requestContact = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        if (!webApp?.requestContact || !webApp.isVersionAtLeast('6.9')) return resolve(false);
        webApp.requestContact((shared) => resolve(Boolean(shared)));
      }),
    [webApp],
  );

  /**
   * Mijoz joylashuvini oladi: avval Telegram LocationManager (Bot API 8.0+),
   * bo'lmasa brauzer geolokatsiyasi. Rad etilsa yoki aniqlanmasa null.
   */
  const getLocation = useCallback(
    () =>
      new Promise<TelegramLocationData | null>((resolve) => {
        const fromBrowser = () => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 12000 },
          );
        };

        const manager = webApp?.LocationManager;
        if (!manager || !webApp?.isVersionAtLeast('8.0')) return fromBrowser();

        const request = () => {
          if (!manager.isLocationAvailable) return fromBrowser();
          manager.getLocation((data) => (data ? resolve(data) : resolve(null)));
        };

        if (manager.isInited) request();
        else manager.init(request);
      }),
    [webApp],
  );

  const close = useCallback(() => webApp?.close(), [webApp]);

  return {
    webApp,
    user,
    isReady,
    isTelegram: Boolean(webApp),
    haptic,
    openInvoice,
    requestContact,
    getLocation,
    close,
  };
}

/** Ochiq bo'lsa Telegram'ning "Orqaga" tugmasini ko'rsatadi va bosilganda onBack ni chaqiradi. */
export function useBackButton(active: boolean, onBack: () => void) {
  const { webApp } = useTelegramContext();
  const callback = useRef(onBack);
  callback.current = onBack;

  useEffect(() => {
    if (!webApp || !active) return;
    const handler = () => callback.current();

    webApp.BackButton.onClick(handler);
    webApp.BackButton.show();

    return () => {
      webApp.BackButton.offClick(handler);
      webApp.BackButton.hide();
    };
  }, [webApp, active]);
}

export default useTelegram;
