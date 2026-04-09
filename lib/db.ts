import Database from "better-sqlite3";
import path from "path";
import { slugify } from "@/lib/utils";
import type { AdminEmailRecord, CartItem, Order, Product } from "@/lib/types";

type ProductRow = Omit<Product, "sizes" | "colors" | "featured" | "images" | "soldOut"> & {
  images: string;
  sizes: string;
  colors: string;
  featured: number;
  soldOut: number;
};

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  shipping_address: string;
  items_json: string;
  created_at: string;
};

const dbPath = path.join(process.cwd(), "data.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var boutiqueDb: Database | undefined;
}

const db = global.boutiqueDb ?? new Database(dbPath);

if (!global.boutiqueDb) {
  db.pragma("journal_mode = WAL");
  initDb();
  global.boutiqueDb = db;
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      added_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      material TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      sizes TEXT NOT NULL,
      colors TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      sold_out INTEGER NOT NULL DEFAULT 0,
      inventory INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_reference TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
  if (!productColumns.some((column) => column.name === "material")) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN material TEXT NOT NULL DEFAULT ''");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("duplicate column name")) {
        throw error;
      }
    }
  }
  if (!productColumns.some((column) => column.name === "images")) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'");
      db.exec("UPDATE products SET images = json_array(image) WHERE images = '[]' OR images = ''");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("duplicate column name")) {
        throw error;
      }
    }
  }
  if (!productColumns.some((column) => column.name === "sold_out")) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN sold_out INTEGER NOT NULL DEFAULT 0");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("duplicate column name")) {
        throw error;
      }
    }
  }
  const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
  if (!orderColumns.some((column) => column.name === "payment_reference")) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN payment_reference TEXT");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("duplicate column name")) {
        throw error;
      }
    }
  }

  db.prepare("INSERT OR IGNORE INTO admin_emails (email, added_by) VALUES (?, ?)").run(
    "shehran.salam@gmail.com",
    "shehran.salam@gmail.com"
  );

  const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (productCount.count === 0) {
    const demoProducts = [
      {
        name: "Emerald Evening Dress",
        description:
          "Flowing satin evening dress with a sculpted waistline and effortless movement for celebrations and formal nights.",
        price: 129,
        category: "Dresses",
        material: "Satin",
        image:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80"
        ],
        sizes: ["S", "M", "L"],
        colors: ["Emerald", "Black"],
        featured: 1,
        soldOut: 0,
        inventory: 12
      },
      {
        name: "Rose Linen Set",
        description:
          "Soft two-piece linen set designed for polished everyday wear with breathable comfort and a tailored fit.",
        price: 94,
        category: "Sets",
        material: "Linen Blend",
        image:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80"
        ],
        sizes: ["XS", "S", "M", "L"],
        colors: ["Rose", "Cream"],
        featured: 1,
        soldOut: 0,
        inventory: 9
      },
      {
        name: "Midnight Abaya",
        description:
          "Elegant abaya with understated trim and a graceful drape, suitable for both occasions and elevated daily wear.",
        price: 118,
        category: "Abayas",
        material: "Nida",
        image:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
        images: [
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80"
        ],
        sizes: ["M", "L", "XL"],
        colors: ["Midnight", "Taupe"],
        featured: 0,
        soldOut: 0,
        inventory: 7
      }
    ];

    const insert = db.prepare(`
      INSERT OR IGNORE INTO products (name, slug, description, price, category, material, image, images, sizes, colors, featured, sold_out, inventory)
      VALUES (@name, @slug, @description, @price, @category, @material, @image, @images, @sizes, @colors, @featured, @soldOut, @inventory)
    `);

    for (const product of demoProducts) {
      insert.run({
        ...product,
        slug: slugify(product.name),
        images: JSON.stringify(product.images),
        sizes: JSON.stringify(product.sizes),
        colors: JSON.stringify(product.colors)
      });
    }
  }
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category,
    material: row.material,
    image: row.image,
    images: JSON.parse(row.images || "[]").length ? JSON.parse(row.images || "[]") : [row.image],
    sizes: JSON.parse(row.sizes),
    colors: JSON.parse(row.colors),
    featured: Boolean(row.featured),
    soldOut: Boolean(row.soldOut),
    inventory: row.inventory,
    createdAt: row.createdAt
  };
}

export function getProducts(query?: string) {
  const statement = query
    ? db.prepare(`
        SELECT
          id,
          name,
          slug,
          description,
          price,
          category,
          material,
          image,
          images,
          sizes,
          colors,
          featured,
          sold_out as soldOut,
          inventory,
          created_at as createdAt
        FROM products
        WHERE name LIKE ? OR category LIKE ?
        ORDER BY featured DESC, created_at DESC
      `)
    : db.prepare(`
        SELECT
          id,
          name,
          slug,
          description,
          price,
          category,
          material,
          image,
          images,
          sizes,
          colors,
          featured,
          sold_out as soldOut,
          inventory,
          created_at as createdAt
        FROM products
        ORDER BY featured DESC, created_at DESC
      `);

  const rows = query
    ? (statement.all(`%${query}%`, `%${query}%`) as ProductRow[])
    : (statement.all() as ProductRow[]);

  return rows.map(mapProduct);
}

export function getFeaturedProducts() {
  const rows = db
    .prepare(`
      SELECT
        id,
        name,
        slug,
        description,
        price,
        category,
        material,
        image,
        images,
        sizes,
        colors,
        featured,
        sold_out as soldOut,
        inventory,
        created_at as createdAt
      FROM products
      WHERE featured = 1
      ORDER BY created_at DESC
      LIMIT 3
    `)
    .all() as ProductRow[];

  return rows.map(mapProduct);
}

export function getProductBySlug(slug: string) {
  const row = db
    .prepare(`
      SELECT
        id,
        name,
        slug,
        description,
        price,
        category,
        material,
        image,
        images,
        sizes,
        colors,
        featured,
        sold_out as soldOut,
        inventory,
        created_at as createdAt
      FROM products
      WHERE slug = ?
    `)
    .get(slug) as ProductRow | undefined;

  return row ? mapProduct(row) : null;
}

export function getProductById(id: number) {
  const row = db
    .prepare(`
      SELECT
        id,
        name,
        slug,
        description,
        price,
        category,
        material,
        image,
        images,
        sizes,
        colors,
        featured,
        sold_out as soldOut,
        inventory,
        created_at as createdAt
      FROM products
      WHERE id = ?
    `)
    .get(id) as ProductRow | undefined;

  return row ? mapProduct(row) : null;
}

export function createProduct(input: {
  name: string;
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
}) {
  const slug = slugify(input.name);
  db.prepare(
    `
      INSERT INTO products (name, slug, description, price, category, material, image, images, sizes, colors, featured, sold_out, inventory)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    input.name,
    slug,
    input.description,
    input.price,
    input.category,
    input.material,
    input.image,
    JSON.stringify(input.images),
    JSON.stringify(input.sizes),
    JSON.stringify(input.colors),
    input.featured ? 1 : 0,
    input.soldOut ? 1 : 0,
    input.inventory
  );
}

export function updateProduct(
  id: number,
  input: {
    name: string;
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
  }
) {
  const slug = slugify(input.name);
  db.prepare(
    `
      UPDATE products
      SET name = ?, slug = ?, description = ?, price = ?, category = ?, material = ?, image = ?, images = ?, sizes = ?, colors = ?, featured = ?, sold_out = ?, inventory = ?
      WHERE id = ?
    `
  ).run(
    input.name,
    slug,
    input.description,
    input.price,
    input.category,
    input.material,
    input.image,
    JSON.stringify(input.images),
    JSON.stringify(input.sizes),
    JSON.stringify(input.colors),
    input.featured ? 1 : 0,
    input.soldOut ? 1 : 0,
    input.inventory,
    id
  );
}

export function setProductSoldOut(id: number, soldOut: boolean) {
  db.prepare(
    `
      UPDATE products
      SET sold_out = ?, inventory = CASE WHEN ? = 1 THEN 0 WHEN inventory = 0 THEN 1 ELSE inventory END
      WHERE id = ?
    `
  ).run(soldOut ? 1 : 0, soldOut ? 1 : 0, id);
}

export function setProductsSoldState(items: CartItem[], soldOut: boolean) {
  const seen = new Set<number>();

  for (const item of items) {
    if (seen.has(item.productId)) {
      continue;
    }
    seen.add(item.productId);
    setProductSoldOut(item.productId, soldOut);
  }
}

export function createOrder(input: {
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  paymentReference?: string | null;
  shippingAddress: string;
  items: CartItem[];
}) {
  const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNumber = `RC-${Date.now().toString().slice(-8)}`;

  db.prepare(
    `
      INSERT INTO orders (order_number, customer_name, customer_email, total_amount, payment_method, payment_reference, shipping_address, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    orderNumber,
    input.customerName,
    input.customerEmail,
    totalAmount,
    input.paymentMethod,
    input.paymentReference || null,
    input.shippingAddress,
    JSON.stringify(input.items)
  );

  setProductsSoldState(input.items, true);

  return orderNumber;
}

export function getOrderById(id: number): Order | null {
  const row = db
    .prepare(
      `
        SELECT *
        FROM orders
        WHERE id = ?
      `
    )
    .get(id) as OrderRow | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    status: row.status,
    shippingAddress: row.shipping_address,
    createdAt: row.created_at,
    items: JSON.parse(row.items_json)
  };
}

export function getOrders(): Order[] {
  const rows = db
    .prepare(
      `
        SELECT *
        FROM orders
        ORDER BY created_at DESC
      `
    )
    .all() as OrderRow[];

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    status: row.status,
    shippingAddress: row.shipping_address,
    createdAt: row.created_at,
    items: JSON.parse(row.items_json)
  }));
}

export function getOrdersByEmail(email: string): Order[] {
  const rows = db
    .prepare(
      `
        SELECT *
        FROM orders
        WHERE LOWER(customer_email) = ?
        ORDER BY created_at DESC
      `
    )
    .all(email.toLowerCase()) as OrderRow[];

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    status: row.status,
    shippingAddress: row.shipping_address,
    createdAt: row.created_at,
    items: JSON.parse(row.items_json)
  }));
}

export function updateOrderStatus(id: number, status: string) {
  db.prepare(
    `
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `
  ).run(status, id);
}

export function deleteOrder(id: number) {
  db.prepare(
    `
      DELETE FROM orders
      WHERE id = ?
    `
  ).run(id);
}

export function getDashboardStats() {
  const { count: productCount } = db.prepare("SELECT COUNT(*) as count FROM products").get() as {
    count: number;
  };
  const { count: orderCount } = db.prepare("SELECT COUNT(*) as count FROM orders").get() as {
    count: number;
  };
  const { total } = db
    .prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders")
    .get() as { total: number };

  return { productCount, orderCount, totalRevenue: total };
}

export function isAdminEmail(email: string) {
  const row = db
    .prepare("SELECT id FROM admin_emails WHERE email = ?")
    .get(email.toLowerCase()) as { id: number } | undefined;

  return Boolean(row);
}

export function isSuperAdminEmail(email: string) {
  return email.toLowerCase() === "shehran.salam@gmail.com";
}

export function addAdminEmail(email: string, addedBy: string) {
  db.prepare("INSERT OR IGNORE INTO admin_emails (email, added_by) VALUES (?, ?)").run(
    email.toLowerCase(),
    addedBy.toLowerCase()
  );
}

export function getAdminEmails(): AdminEmailRecord[] {
  return db
    .prepare(
      `
        SELECT
          id,
          email,
          added_by as addedBy,
          created_at as createdAt
        FROM admin_emails
        ORDER BY created_at ASC
      `
    )
    .all() as AdminEmailRecord[];
}
