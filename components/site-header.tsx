import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/admin";
import { CartCount } from "@/components/cart-count";

export async function SiteHeader() {
  const currentUser = await getCurrentUser();

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        Rare Collection Boutique
      </Link>
      <nav className="site-nav">
        <Link href="/shop">Shop</Link>
        {currentUser.isAdmin ? <Link href="/admin">Admin</Link> : null}
        {currentUser.session ? (
          <>
            <Link href="/account/orders">{currentUser.name}</Link>
            <a href="/auth/logout">Logout</a>
          </>
        ) : (
          <a href="/auth/login">Login</a>
        )}
        <Link href="/cart" className="cart-link">
          <ShoppingBag size={18} />
          <CartCount />
        </Link>
      </nav>
    </header>
  );
}
