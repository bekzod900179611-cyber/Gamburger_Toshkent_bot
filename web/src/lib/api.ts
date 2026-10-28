import type {
  AdminProduct,
  AdminStats,
  AppConfig,
  CreateOrderBody,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  User,
} from './types';

const BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

/** Serverga yuklangan rasm (/api/images/5) — lokalda API boshqa portda turadi. */
export function assetUrl(src: string): string {
  return src.startsWith('/api/') ? `${BASE}${src}` : src;
}

function initData(): string {
  if (typeof window === 'undefined') return '';
  return window.Telegram?.WebApp?.initData || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `tma ${initData()}`,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error('Server bilan aloqa yo‘q. Internetni tekshiring.');
  }

  let payload: { ok: boolean; data?: T; error?: string } | null = null;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Server javobini o‘qib bo‘lmadi');
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Nomaʼlum xatolik');
  }

  return payload.data as T;
}

const post = (body?: unknown): RequestInit => ({
  method: 'POST',
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  getConfig: () => request<AppConfig>('/config'),

  getMe: () => request<User>('/me'),
  setOnboarded: () => request<User>('/me/onboarded', post()),
  setPhone: (phone: string) => request<User>('/me/phone', post({ phone })),

  reverseGeocode: (latitude: number, longitude: number) =>
    request<{ address: string }>(`/geocode?lat=${latitude}&lon=${longitude}`),

  getCategories: () => request<string[]>('/categories'),
  getProducts: () => request<Product[]>('/products'),
  getBump: () => request<Product | null>('/products/bump'),

  getOrders: () => request<Order[]>('/orders'),
  createOrder: (body: CreateOrderBody) =>
    request<{ order: Order; invoiceLink: string | null }>('/orders', post(body)),
  createInvoice: (orderId: number) =>
    request<{ invoiceLink: string }>(`/orders/${orderId}/invoice`, post()),
};

export const adminApi = {
  stats: () => request<AdminStats>('/admin/stats'),

  orders: (filter: 'active' | 'done') => request<Order[]>(`/admin/orders?filter=${filter}`),
  setOrderStatus: (orderId: number, status: OrderStatus) =>
    request<Order>(`/admin/orders/${orderId}/status`, post({ status })),

  products: () => request<{ products: AdminProduct[]; categories: string[] }>('/admin/products'),
  createProduct: (body: ProductInput) => request<AdminProduct>('/admin/products', post(body)),
  updateProduct: (id: number, body: ProductInput) =>
    request<AdminProduct>(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProduct: (id: number) => request<boolean>(`/admin/products/${id}`, { method: 'DELETE' }),

  uploadImage: (image: Blob) =>
    request<{ url: string }>('/admin/images', {
      method: 'POST',
      body: image,
      headers: { 'Content-Type': image.type },
    }),
};

export default api;
