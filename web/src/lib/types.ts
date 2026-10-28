export type PaymentMethod = 'cash' | 'click' | 'payme' | 'telegram_stars';
export type OrderStatus = 'new' | 'accepted' | 'cooking' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  ingredients: string[];
  imageUrl: string;
  oldPrice: number;
  newPrice: number;
  category: string;
  isPopular: boolean;
  isBump: boolean;
  isActive: boolean;
}

export interface User {
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  onboarded: boolean;
  isAdmin?: boolean;
}

export interface OrderItem {
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  sum: number;
}

export interface Order {
  id: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  phone: string;
  address: string;
  comment: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  userId?: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AppConfig {
  restaurant: { name: string; phone: string; address: string };
  delivery: { fee: number; freeFrom: number };
  paymentMethods: PaymentMethod[];
  starsRate: number;
}

export interface CreateOrderBody {
  items: { productId: number; quantity: number }[];
  customerName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  comment?: string;
  paymentMethod: PaymentMethod;
}

export interface AdminProduct extends Product {
  sortOrder: number;
}

/** Admin paneldan yuboriladigan taom maydonlari. */
export type ProductInput = Partial<Omit<AdminProduct, 'id' | 'slug'>>;

export interface AdminStats {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  newOrders: number;
  avgCheck: number;
  users: number;
  week: { day: string; revenue: number; orders: number }[];
  top: { name: string; quantity: number; revenue: number }[];
}
