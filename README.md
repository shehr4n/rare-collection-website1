# Rare Collection Boutique

Full-stack boutique website for Rare Collection with:

- storefront catalog and product pages
- cart and checkout flow
- Auth0-based login
- owner admin dashboard for products and orders
- local SQLite development mode and Vercel-compatible production storage

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env.local
```

3. Fill in your Auth0 app values in `.env.local`

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Admin access

- `shehran.salam@gmail.com` is seeded as the super-admin email
- that email can log in through Auth0 and add more admin emails from `/admin`

## Vercel deployment

For production on Vercel, connect:

- a Postgres database integration that provides `POSTGRES_URL`
- Vercel Blob that provides `BLOB_READ_WRITE_TOKEN`

The app keeps local SQLite and local uploads for development, but switches to Postgres + Blob automatically when those production environment variables are present.
