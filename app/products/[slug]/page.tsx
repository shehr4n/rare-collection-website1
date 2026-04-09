import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { ProductGallery } from "@/components/product-gallery";
import { getProductBySlug } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="product-detail">
        <div className="product-detail-image-frame">
          <ProductGallery images={product.images} alt={product.name} />
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="price-tag">{formatCurrency(product.price)}</p>
          {product.soldOut ? <p className="sold-note">Sold out</p> : null}
          <p className="product-detail-material">Material: {product.material}</p>
          <p>{product.description}</p>
          <div className="chips">
            {product.colors.map((color) => (
              <span key={color} className="chip">
                {color}
              </span>
            ))}
          </div>
          <AddToCartForm product={product} />
        </div>
      </div>
    </div>
  );
}
