// Telegram Mini App obyektining loyihada ishlatiladigan qismi.
// To'liq hujjat: https://core.telegram.org/bots/webapps

interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

interface TelegramBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
}

interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

interface TelegramLocationData {
  latitude: number;
  longitude: number;
}

/** Bot API 8.0+ — Telegram'ning o'z lokatsiya ruxsati (brauzer geolokatsiyasidan ishonchliroq). */
interface TelegramLocationManager {
  isInited: boolean;
  isLocationAvailable: boolean;
  isAccessRequested: boolean;
  isAccessGranted: boolean;
  init(callback?: () => void): void;
  getLocation(callback: (data: TelegramLocationData | null) => void): void;
  openSettings(): void;
}

interface TelegramWebApp {
  LocationManager?: TelegramLocationManager;
  initData: string;
  initDataUnsafe: { user?: TelegramWebAppUser; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportStableHeight: number;
  BackButton: TelegramBackButton;
  HapticFeedback: TelegramHapticFeedback;
  ready(): void;
  expand(): void;
  close(): void;
  isVersionAtLeast(version: string): boolean;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  disableVerticalSwipes?(): void;
  enableClosingConfirmation?(): void;
  openInvoice(url: string, callback?: (status: InvoiceStatus) => void): void;
  requestContact?(callback?: (shared: boolean) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm?(message: string, callback?: (confirmed: boolean) => void): void;
  openTelegramLink(url: string): void;
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
