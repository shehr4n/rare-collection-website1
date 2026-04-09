export type UserRole = "customer" | "admin";

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  material: string;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  featured: boolean;
  soldOut: boolean;
  inventory: number;
  createdAt: string;
};

export type UserSession = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type AdminEmailRecord = {
  id: number;
  email: string;
  addedBy: string;
  createdAt: string;
};

export type CartItem = {
  productId: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
};

export type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  paymentMethod: string;
  paymentReference: string | null;
  status: string;
  shippingAddress: string;
  createdAt: string;
  items: CartItem[];
};
