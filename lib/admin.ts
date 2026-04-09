import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { addAdminEmail, getAdminEmails, isAdminEmail, isSuperAdminEmail } from "@/lib/db";

export const SUPER_ADMIN_EMAIL = "shehran.salam@gmail.com";

export async function getCurrentUser() {
  const session = await auth0.getSession();
  const email = session?.user.email?.toLowerCase() || "";

  return {
    session,
    email,
    name: session?.user.name || session?.user.nickname || email || "Account",
    isAdmin: email ? await isAdminEmail(email) : false,
    isSuperAdmin: email ? isSuperAdminEmail(email) : false
  };
}

export async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser.session) {
    redirect("/auth/login?returnTo=/admin");
  }

  if (!currentUser.isAdmin) {
    redirect("/unauthorized");
  }

  return currentUser;
}

export async function ensureDefaultAdmins() {
  await addAdminEmail(SUPER_ADMIN_EMAIL, SUPER_ADMIN_EMAIL);
  return await getAdminEmails();
}
