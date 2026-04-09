import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/admin";
import { getOrdersByEmail } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function AccountOrdersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser.session || !currentUser.email) {
    redirect("/auth/login?returnTo=/account/orders");
  }

  const orders = getOrdersByEmail(currentUser.email);

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">My Orders</p>
          <h1>Track your placed orders</h1>
          <p>Signed in as {currentUser.email}</p>
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="empty-state">You have not placed any orders yet.</div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <div className="order-card-top">
                <strong>{order.orderNumber}</strong>
                <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
              <p>{formatCurrency(order.totalAmount)}</p>
              <p>{order.paymentMethod}</p>
              {order.paymentReference ? <p>bKash Txn ID: {order.paymentReference}</p> : null}
              <p className="muted">{new Date(order.createdAt).toLocaleDateString("en-BD")}</p>
              <p className="muted">{order.shippingAddress}</p>
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={`${order.id}-${item.productId}-${index}`} className="order-item-line">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="muted">
                      {item.size || "-"} / {item.color || "-"}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
