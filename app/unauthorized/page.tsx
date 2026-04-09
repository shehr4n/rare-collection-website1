export default function UnauthorizedPage() {
  return (
    <div className="page-shell narrow">
      <section className="auth-card">
        <p className="eyebrow">Access Restricted</p>
        <h1>You are signed in, but not an admin for this store.</h1>
        <p className="muted">
          Ask an existing admin to add your email address in the owner dashboard.
        </p>
      </section>
    </div>
  );
}
