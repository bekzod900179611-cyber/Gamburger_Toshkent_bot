import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/lib/types';

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  quantity: number;
}

const MAX_QUANTITY = 50;

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  /** Bazadagi yangi narx/nomlar bilan yangilaydi, menyudan olib tashlanganlarni o'chiradi. */
  syncWithProducts: (products: Product[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + quantity) }
                  : item,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl,
                category: product.category,
                price: product.newPrice,
                quantity: Math.min(MAX_QUANTITY, quantity),
              },
            ],
          };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: Math.min(MAX_QUANTITY, quantity) }
                    : item,
                ),
        })),

      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

      clear: () => set({ items: [] }),

      syncWithProducts: (products) =>
        set((state) => {
          const byId = new Map(products.map((product) => [product.id, product]));
          return {
            items: state.items
              .filter((item) => byId.has(item.productId))
              .map((item) => {
                const product = byId.get(item.productId)!;
                return { ...item, name: product.name, imageUrl: product.imageUrl, price: product.newPrice };
              }),
          };
        }),
    }),
    {
      name: 'gamburger-cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
