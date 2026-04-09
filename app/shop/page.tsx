import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/db";

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();
  const products = getProducts(query).sort((a, b) => {
    const aIsDress = a.category.toLowerCase() === "dresses";
    const bIsDress = b.category.toLowerCase() === "dresses";

    if (aIsDress === bIsDress) {
      return 0;
    }

    return aIsDress ? -1 : 1;
  });

  return (
    <div className="page-shell">
      <section className="page-header page-header-shop">
        <p className="eyebrow">Shop</p>
        <h1>Complete Collection</h1>
      </section>

      <form className="search-bar" action="/shop">
        <input type="text" name="q" placeholder="Search dresses, sets, abayas..." defaultValue={query} />
        <button className="button button-primary" type="submit">
          Search
        </button>
      </form>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    </div>
  );
}
