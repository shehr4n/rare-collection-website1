import { CartPageClient } from "@/components/cart-page-client";

export default function CartPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">Cart</p>
        <h1>Your selected pieces</h1>
        <p>Review sizes, quantities, and continue to checkout. No login is required to place an order.</p>
      </section>
      <CartPageClient />
    </div>
  );
}
