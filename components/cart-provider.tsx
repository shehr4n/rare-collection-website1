"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

function itemKey(item: CartItem) {
  return `${item.productId}-${item.size || ""}-${item.color || ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem("rare-collection-cart");
    if (raw) {
      setItems(JSON.parse(raw));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rare-collection-cart", JSON.stringify(items));
  }, [items]);

  const value: CartContextType = {
    items,
    addItem(item) {
      setItems((current) => {
        const key = itemKey(item);
        const existing = current.find((entry) => itemKey(entry) === key);

        if (existing) {
          return current.map((entry) =>
            itemKey(entry) === key ? { ...entry, quantity: entry.quantity + item.quantity } : entry
          );
        }

        return [...current, item];
      });
    },
    removeItem(key) {
      setItems((current) => current.filter((item) => itemKey(item) !== key));
    },
    updateQuantity(key, quantity) {
      setItems((current) =>
        current
          .map((item) => (itemKey(item) === key ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0)
      );
    },
    clearCart() {
      setItems([]);
    }
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}

export function getCartItemKey(item: CartItem) {
  return itemKey(item);
}
