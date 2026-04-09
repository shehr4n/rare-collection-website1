import { CheckoutClient } from "@/components/checkout-client";

export default function CheckoutPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">Checkout</p>
        <h1>Complete your order</h1>
        <p>Choose a payment option and place the order securely.</p>
      </section>
      <CheckoutClient />
    </div>
  );
}
