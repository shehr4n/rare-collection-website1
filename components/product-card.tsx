import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({
  product,
  compact = false
}: {
  product: Product;
  compact?: boolean;
}) {
  return (
    <article className={`product-card${compact ? " product-card-compact" : ""}`}>
      <Link href={`/products/${product.slug}`} className="product-image-link">
        <div
          className="product-image"
          style={{ backgroundImage: `linear-gradient(rgba(20,6,10,0.06), rgba(20,6,10,0.38)), url(${product.image})` }}
        />
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta">
          <span>{product.category}</span>
          <span>{formatCurrency(product.price)}</span>
        </div>
        <h3>{product.name}</h3>
        {!compact ? <p>{product.description}</p> : null}
        {!compact ? (
          <Link href={`/products/${product.slug}`} className="inline-link">
            View piece
          </Link>
        ) : null}
      </div>
    </article>
  );
}
