"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/types";

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[0] || "");
  const [color, setColor] = useState(product.colors[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div className="purchase-panel">
      <label>
        Size
        <select value={size} onChange={(event) => setSize(event.target.value)}>
          {product.sizes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        Color
        <select value={color} onChange={(event) => setColor(event.target.value)}>
          {product.colors.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input
          type="number"
          min={1}
          max={product.inventory}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
      </label>
      <button
        className="button button-primary"
        type="button"
        onClick={() => {
          addItem({
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image,
            quantity,
            size,
            color
          });
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1400);
        }}
      >
        {added ? "Added" : "Add to cart"}
      </button>
    </div>
  );
}
