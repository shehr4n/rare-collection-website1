import Link from "next/link";
import { addAdminAction } from "@/lib/actions";
import { ensureDefaultAdmins, requireAdmin } from "@/lib/admin";
import { getDashboardStats, getOrders, getProducts } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ adminAdded?: string; adminError?: string }>;
}) {
  const currentUser = await requireAdmin();
  const params = await searchParams;

  const stats = getDashboardStats();
  const products = getProducts();
  const orders = getOrders();
  const adminEmails = await ensureDefaultAdmins();

  return (
    <div className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Owner Dashboard</p>
          <h1>Manage Rare Collection Boutique</h1>
          <p>Signed in as {currentUser.name}</p>
        </div>
        <div className="dashboard-actions">
          <Link href="/admin/products/new" className="button button-primary">
            Add New Product
          </Link>
          <a href="/auth/logout" className="button button-secondary">
            Logout
          </a>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total products</span>
          <strong>{stats.productCount}</strong>
        </div>
        <div className="stat-card">
          <span>Total orders</span>
          <strong>{stats.orderCount}</strong>
        </div>
        <div className="stat-card">
          <span>Revenue</span>
          <strong>{formatCurrency(stats.totalRevenue)}</strong>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admins</p>
            <h2>Access management</h2>
          </div>
        </div>
        {currentUser.isSuperAdmin ? (
          <div className="admin-access-panel">
            <form action={addAdminAction} className="admin-email-form">
              <input name="email" type="email" placeholder="Add admin by email" required />
              <button className="button button-primary" type="submit">
                Add Admin
              </button>
            </form>
            {params.adminAdded ? <p className="success-note">Admin access updated.</p> : null}
            {params.adminError ? <p className="form-error">Please enter an email address.</p> : null}
          </div>
        ) : (
          <p className="muted">Only the super-admin can add additional admins.</p>
        )}
        <div className="admin-email-list">
          {adminEmails.map((admin) => (
            <div key={admin.id} className="admin-email-card">
              <strong>{admin.email}</strong>
              <span className="muted">Added by {admin.addedBy}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Products</p>
            <h2>Inventory manager</h2>
          </div>
        </div>
        <div className="data-table">
          <div className="table-row table-head">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Inventory</span>
            <span>Actions</span>
          </div>
          {products.map((product) => (
            <div key={product.id} className="table-row">
              <span>{product.name}</span>
              <span>{product.category}</span>
              <span>{formatCurrency(product.price)}</span>
              <span>{product.inventory}</span>
              <span>
                <Link href={`/admin/products/${product.id}`} className="inline-link">
                  Edit
                </Link>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Recent purchases</h2>
          </div>
        </div>
        <div className="orders-grid">
          {orders.length === 0 ? (
            <div className="empty-state">No orders yet.</div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card-top">
                  <strong>{order.orderNumber}</strong>
                  <span>{order.status}</span>
                </div>
                <p>{order.customerName}</p>
                <p>{order.customerEmail}</p>
                <p>{order.paymentMethod}</p>
                <p>{formatCurrency(order.totalAmount)}</p>
                <p className="muted">{order.shippingAddress}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
