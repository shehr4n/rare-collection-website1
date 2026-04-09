import { CheckoutClient } from "@/components/checkout-client";

export default function CheckoutPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">Checkout</p>
        <h1>Complete your order</h1>
        <p>Guest checkout is available. Enter your name, email, phone number, and shipping details to place the order securely.</p>
      </section>
      <CheckoutClient />
    </div>
  );
}
