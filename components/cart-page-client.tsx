"use client";

import Link from "next/link";
import { useCart, getCartItemKey } from "@/components/cart-provider";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, removeItem, updateQuantity } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (items.length === 0) {
    return <div className="empty-state">Your cart is empty.</div>;
  }

  return (
    <div className="cart-layout">
      <div className="cart-items">
        {items.map((item) => {
          const key = getCartItemKey(item);
          return (
            <article key={key} className="cart-item">
              <div
                className="cart-item-image"
                style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.04), rgba(0,0,0,0.18)), url(${item.image})` }}
              />
              <div className="cart-item-copy">
                <h3>{item.name}</h3>
                <p className="muted">
                  {item.size} / {item.color}
                </p>
                <p>{formatCurrency(item.price)}</p>
                <div className="cart-item-actions">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(key, Number(event.target.value))}
                  />
                  <button className="text-button" onClick={() => removeItem(key)}>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="cart-summary">
        <p className="eyebrow">Summary</p>
        <h2>{formatCurrency(subtotal)}</h2>
        <p className="muted">Shipping rates can be added later to match your delivery process.</p>
        <Link href="/checkout" className="button button-primary">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
