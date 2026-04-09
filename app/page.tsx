import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/db";

export default function HomePage() {
  const allProducts = getProducts();
  const homepageProducts = [...allProducts].sort((a, b) => {
    const aIsDress = a.category.toLowerCase() === "dresses";
    const bIsDress = b.category.toLowerCase() === "dresses";

    if (aIsDress === bIsDress) {
      return 0;
    }

    return aIsDress ? -1 : 1;
  });

  return (
    <div className="page-shell">
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dresses</p>
            <h2>All signature dresses, front and center</h2>
          </div>
          <Link href="/shop" className="inline-link">
            View full collection <ArrowRight size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {homepageProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="hero hero-secondary">
        <div className="hero-copy-block">
          <p className="eyebrow">Rare Collection Boutique</p>
          <h1>Refined Bangladeshi party wear for weddings, dawats, and festive evenings.</h1>
          <p className="hero-copy">
            Shop hand-tailored traditional dresses and formal looks shaped for elegant occasions.
          </p>
          <div className="hero-actions">
            <Link href="/shop" className="button button-primary">
              Explore The Collection
            </Link>
            <a href="/auth/login?returnTo=/admin" className="button button-secondary">
              Owner Dashboard
            </a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-stat">
            <span>Tailored edit</span>
            <strong>{allProducts.length}+ boutique pieces</strong>
          </div>
          <div className="hero-stat">
            <span>Bangladesh-ready checkout</span>
            <strong>COD, bKash, and local delivery details</strong>
          </div>
          <div className="hero-stat">
            <span>Owner tools</span>
            <strong>Manage inventory, uploads, and customer orders</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
