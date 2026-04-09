import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { getProductBySlug } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="product-detail">
        <div className="product-detail-image-frame">
          <Image
            src={product.image}
            alt={product.name}
            width={900}
            height={1200}
            className="product-detail-image"
          />
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="price-tag">{formatCurrency(product.price)}</p>
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
