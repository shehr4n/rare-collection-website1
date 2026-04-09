import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="page-shell narrow">
      <section className="auth-card">
        <p className="eyebrow">Order Confirmed</p>
        <h1>Thank you for shopping with Rare Collection</h1>
        <p>Your order number is <strong>{params.order || "pending"}</strong>.</p>
        <p className="muted">The owner dashboard now includes this order so your mom can review it immediately.</p>
        <Link href="/shop" className="button button-primary">
          Continue shopping
        </Link>
      </section>
    </div>
  );
}
