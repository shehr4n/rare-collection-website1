export default function LoginPage() {
  return (
    <div className="page-shell narrow">
      <section className="auth-card">
        <p className="eyebrow">Login</p>
        <h1>Sign in with Auth0</h1>
        <p className="muted">Authentication is now handled by Auth0 instead of local passwords.</p>
        <a className="button button-primary" href="/auth/login">
          Continue to login
        </a>
        <a className="button button-secondary" href="/auth/login?screen_hint=signup">
          Create account
        </a>
      </section>
    </div>
  );
}
