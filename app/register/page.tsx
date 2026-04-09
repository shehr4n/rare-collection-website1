export default function RegisterPage() {
  return (
    <div className="page-shell narrow">
      <section className="auth-card">
        <p className="eyebrow">Register</p>
        <h1>Create your account with Auth0</h1>
        <p className="muted">Customer sign-up is handled on the hosted Auth0 page.</p>
        <a className="button button-primary" href="/auth/login?screen_hint=signup">
          Continue to sign up
        </a>
      </section>
    </div>
  );
}
