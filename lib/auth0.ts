import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || "example.us.auth0.com",
  clientId: process.env.AUTH0_CLIENT_ID || "placeholder-client-id",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "placeholder-client-secret",
  secret:
    process.env.AUTH0_SECRET || "replace-this-with-a-32-byte-random-string-for-production",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000"
});
