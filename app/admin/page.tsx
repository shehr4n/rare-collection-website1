import Link from "next/link";
import {
  addAdminAction,
  deleteOrderAction,
  toggleProductSoldAction,
  updateOrderStatusAction
} from "@/lib/actions";
import { ensureDefaultAdmins, requireAdmin } from "@/lib/admin";
import { getDashboardStats, getOrders, getProducts } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{
    adminAdded?: string;
    adminError?: string;
    orderUpdated?: string;
    orderDeleted?: string;
    productSold?: string;
  }>;
}) {
  const currentUser = await requireAdmin();
  const params = await searchParams;

  const stats = await getDashboardStats();
  const products = await getProducts();
  const orders = await getOrders();
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
        {typeof params.productSold !== "undefined" ? (
          <p className="success-note">
            Product {params.productSold === "1" ? "marked as sold." : "marked as available."}
          </p>
        ) : null}
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
              <span>
                {product.name} {product.soldOut ? <span className="status-pill status-cancelled">Sold</span> : null}
              </span>
              <span>{product.category}</span>
              <span>{formatCurrency(product.price)}</span>
              <span>{product.inventory}</span>
              <span className="inventory-actions">
                <Link href={`/admin/products/${product.id}`} className="inline-link">
                  Edit
                </Link>
                <form action={toggleProductSoldAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="soldOut" value={product.soldOut ? "false" : "true"} />
                  <button className="text-button" type="submit">
                    {product.soldOut ? "Mark available" : "Mark sold"}
                  </button>
                </form>
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
        {params.orderUpdated ? <p className="success-note">Order status updated.</p> : null}
        {params.orderDeleted ? <p className="success-note">Order deleted.</p> : null}
        <div className="orders-grid">
          {orders.length === 0 ? (
            <div className="empty-state">No orders yet.</div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-card-top">
                  <strong>{order.orderNumber}</strong>
                  <span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
                <p>{order.customerName}</p>
                <p>{order.customerEmail}</p>
                <p>{order.paymentMethod}</p>
                {order.paymentReference ? <p>bKash Txn ID: {order.paymentReference}</p> : null}
                <p>{formatCurrency(order.totalAmount)}</p>
                <p className="muted">{order.shippingAddress}</p>
                <div className="order-admin-actions">
                  <form action={updateOrderStatusAction} className="order-status-form">
                    <input type="hidden" name="id" value={order.id} />
                    <select name="status" defaultValue={order.status}>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button className="button button-secondary" type="submit">
                      Update
                    </button>
                  </form>
                  <form action={deleteOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button className="button button-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
