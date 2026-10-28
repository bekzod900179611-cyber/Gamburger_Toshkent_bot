/** Tasdiqlash oynasi: Telegram ichida — Telegram'ning o'z oynasi, brauzerda — window.confirm. */
export function confirmAction(message: string): Promise<boolean> {
  const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  if (webApp?.showConfirm && webApp.isVersionAtLeast('6.2')) {
    return new Promise((resolve) => webApp.showConfirm!(message, (confirmed) => resolve(Boolean(confirmed))));
  }
  return Promise.resolve(window.confirm(message));
}
