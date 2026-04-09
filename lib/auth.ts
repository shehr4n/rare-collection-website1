import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserSession } from "@/lib/types";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "rare-collection-dev-secret-change-me"
);

const SESSION_NAME = "rare_collection_session";

export async function createSession(session: UserSession) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<UserSession>(token, secret);
    return verified.payload;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_NAME);
}
