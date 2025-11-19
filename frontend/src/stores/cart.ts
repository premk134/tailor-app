import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  shopId: string;
  shopName: string;
  quantity: number;
  basePrice: number;
  totalPrice: number;
  measurementId?: string;
  customizationOptions?: Record<string, string>;
  customNotes?: string;
  estimatedDays?: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearShop: (shopId: string) => void;
  getItemCount: () => number;
  getTotal: () => number;
  getItemsByShop: () => Map<string, CartItem[]>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          // Check if item already exists (same product with same customizations)
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.measurementId === item.measurementId &&
              JSON.stringify(i.customizationOptions) === JSON.stringify(item.customizationOptions)
          );

          if (existingIndex >= 0) {
            // Update quantity of existing item
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + item.quantity,
              totalPrice:
                (updatedItems[existingIndex].quantity + item.quantity) *
                (item.totalPrice / item.quantity),
            };
            return { items: updatedItems };
          }

          // Add new item
          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity,
                  totalPrice: (item.totalPrice / item.quantity) * quantity,
                }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      clearShop: (shopId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.shopId !== shopId),
        }));
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.totalPrice, 0);
      },

      getItemsByShop: () => {
        const itemsByShop = new Map<string, CartItem[]>();
        get().items.forEach((item) => {
          const shopItems = itemsByShop.get(item.shopId) || [];
          shopItems.push(item);
          itemsByShop.set(item.shopId, shopItems);
        });
        return itemsByShop;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
