# Rare Collection Boutique

Full-stack boutique website for Rare Collection with:

- storefront catalog and product pages
- cart and checkout flow
- Auth0-based login
- owner admin dashboard for products and orders
- SQLite database with seeded demo data

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
