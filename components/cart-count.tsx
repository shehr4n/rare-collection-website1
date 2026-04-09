"use client";

import { useCart } from "@/components/cart-provider";

export function CartCount() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return <span>{count}</span>;
}
