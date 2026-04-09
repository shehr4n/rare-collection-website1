import path from "path";
import { createPool } from "@vercel/postgres";
import type { AdminEmailRecord, CartItem, Order, Product } from "@/lib/types";
import { slugify } from "@/lib/utils";

type SqliteDatabase = {
  pragma(source: string): void;
  exec(source: string): void;
  prepare(source: string): {
    run: (...params: unknown[]) => { lastInsertRowid: number | bigint; changes: number };
    get: (...params: unknown[]) => unknown;
    all: (...params: unknown[]) => unknown[];
  };
};

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  material: string;
  image: string;
  images: string;
  sizes: string;
  colors: string;
  featured: number;
  sold_out: number;
  inventory: number;
  created_at: string;
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

type AdminEmailRow = {
  id: number;
  email: string;
  added_by: string;
  created_at: string;
};

const dbPath = path.join(process.cwd(), "data.sqlite");
const useRemoteDb = Boolean(process.env.POSTGRES_URL);

declare global {
  // eslint-disable-next-line no-var
  var boutiqueDb: SqliteDatabase | undefined;
  // eslint-disable-next-line no-var
  var boutiqueInitPromise: Promise<void> | undefined;
}

let pool = useRemoteDb ? createPool() : null;

function getSqliteDb(): SqliteDatabase {
  if (!global.boutiqueDb) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BetterSqlite3 = require("better-sqlite3") as new (filename?: string) => SqliteDatabase;
    const sqlite = new BetterSqlite3(dbPath);
    sqlite.pragma("journal_mode = WAL");
    global.boutiqueDb = sqlite;
  }

  return global.boutiqueDb;
}

async function initDb() {
  if (!global.boutiqueInitPromise) {
    global.boutiqueInitPromise = useRemoteDb ? initRemoteDb() : initLocalDb();
  }

  await global.boutiqueInitPromise;
}

async function initRemoteDb() {
  if (!pool) {
    pool = createPool();
  }

  await pool!.query(`
    CREATE TABLE IF NOT EXISTS admin_emails (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      added_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      category TEXT NOT NULL,
      material TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      sizes TEXT NOT NULL,
      colors TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      sold_out INTEGER NOT NULL DEFAULT 0,
      inventory INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      total_amount DOUBLE PRECISION NOT NULL,
      payment_method TEXT NOT NULL,
      payment_reference TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool!.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT NOT NULL DEFAULT ''`);
  await pool!.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT NOT NULL DEFAULT '[]'`);
  await pool!.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_out INTEGER NOT NULL DEFAULT 0`);
  await pool!.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT`);
  await pool!.query(`UPDATE products SET images = json_build_array(image)::text WHERE images = '[]' OR images = ''`);

  await pool!.query(
    `INSERT INTO admin_emails (email, added_by) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
    ["shehran.salam@gmail.com", "shehran.salam@gmail.com"]
  );

  const { rows } = await pool!.query<{ count: string }>(`SELECT COUNT(*)::text as count FROM products`);
  if (Number(rows[0]?.count || 0) === 0) {
    await seedProducts(async (product) => {
      await pool!.query(
        `
          INSERT INTO products
          (name, slug, description, price, category, material, image, images, sizes, colors, featured, sold_out, inventory)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (slug) DO NOTHING
        `,
        [
          product.name,
          slugify(product.name),
          product.description,
          product.price,
          product.category,
          product.material,
          product.image,
          JSON.stringify(product.images),
          JSON.stringify(product.sizes),
          JSON.stringify(product.colors),
          product.featured ? 1 : 0,
          product.soldOut ? 1 : 0,
          product.inventory
        ]
      );
    });
  }
}

async function initLocalDb() {
  const db = getSqliteDb();
  db.exec(`
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
    } catch {}
  }
  if (!productColumns.some((column) => column.name === "images")) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN images TEXT NOT NULL DEFAULT '[]'");
      db.exec("UPDATE products SET images = json_array(image) WHERE images = '[]' OR images = ''");
    } catch {}
  }
  if (!productColumns.some((column) => column.name === "sold_out")) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN sold_out INTEGER NOT NULL DEFAULT 0");
    } catch {}
  }

  const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
  if (!orderColumns.some((column) => column.name === "payment_reference")) {
    try {
      db.exec("ALTER TABLE orders ADD COLUMN payment_reference TEXT");
    } catch {}
  }

  db.prepare("INSERT OR IGNORE INTO admin_emails (email, added_by) VALUES (?, ?)").run(
    "shehran.salam@gmail.com",
    "shehran.salam@gmail.com"
  );

  const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (productCount.count === 0) {
    await seedProducts(async (product) => {
      db.prepare(
        `
          INSERT OR IGNORE INTO products
          (name, slug, description, price, category, material, image, images, sizes, colors, featured, sold_out, inventory)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      ).run(
        product.name,
        slugify(product.name),
        product.description,
        product.price,
        product.category,
        product.material,
        product.image,
        JSON.stringify(product.images),
        JSON.stringify(product.sizes),
        JSON.stringify(product.colors),
        product.featured,
        product.soldOut,
        product.inventory
      );
    });
  }
}

async function seedProducts(insert: (product: Omit<Product, "id" | "slug" | "createdAt">) => Promise<void>) {
  const demoProducts: Array<Omit<Product, "id" | "slug" | "createdAt">> = [
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
      featured: true,
      soldOut: false,
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
      featured: true,
      soldOut: false,
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
      featured: false,
      soldOut: false,
      inventory: 7
    }
  ];

  for (const product of demoProducts) {
    await insert(product);
  }
}

function mapProduct(row: ProductRow): Product {
  const parsedImages = JSON.parse(row.images || "[]") as string[];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    category: row.category,
    material: row.material,
    image: row.image,
    images: parsedImages.length ? parsedImages : [row.image],
    sizes: JSON.parse(row.sizes),
    colors: JSON.parse(row.colors),
    featured: Boolean(row.featured),
    soldOut: Boolean(row.sold_out),
    inventory: row.inventory,
    createdAt: row.created_at
  };
}

function mapOrder(row: OrderRow): Order {
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

export async function getProducts(query?: string): Promise<Product[]> {
  await initDb();

  if (useRemoteDb) {
    const result = query
      ? await pool!.query<ProductRow>(
          `
            SELECT *
            FROM products
            WHERE name ILIKE $1 OR category ILIKE $1
            ORDER BY featured DESC, created_at DESC
          `,
          [`%${query}%`]
        )
      : await pool!.query<ProductRow>(`SELECT * FROM products ORDER BY featured DESC, created_at DESC`);

    return result.rows.map(mapProduct);
  }

  const db = getSqliteDb();
  const rows = query
    ? (db
        .prepare(
          `
            SELECT *
            FROM products
            WHERE name LIKE ? OR category LIKE ?
            ORDER BY featured DESC, created_at DESC
          `
        )
        .all(`%${query}%`, `%${query}%`) as ProductRow[])
    : (db.prepare(`SELECT * FROM products ORDER BY featured DESC, created_at DESC`).all() as ProductRow[]);

  return rows.map(mapProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.featured).slice(0, 3);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<ProductRow>(`SELECT * FROM products WHERE slug = $1 LIMIT 1`, [slug]);
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  const db = getSqliteDb();
  const row = db.prepare(`SELECT * FROM products WHERE slug = ?`).get(slug) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export async function getProductById(id: number): Promise<Product | null> {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<ProductRow>(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [id]);
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  const db = getSqliteDb();
  const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export async function createProduct(input: Omit<Product, "id" | "slug" | "createdAt">) {
  await initDb();
  const slug = slugify(input.name);

  if (useRemoteDb) {
    await pool!.query(
      `
        INSERT INTO products
        (name, slug, description, price, category, material, image, images, sizes, colors, featured, sold_out, inventory)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
      [
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
      ]
    );
    return;
  }

  const db = getSqliteDb();
  db.prepare(
    `
      INSERT INTO products
      (name, slug, description, price, category, material, image, images, sizes, colors, featured, sold_out, inventory)
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

export async function updateProduct(
  id: number,
  input: Omit<Product, "id" | "slug" | "createdAt">
) {
  await initDb();
  const slug = slugify(input.name);

  if (useRemoteDb) {
    await pool!.query(
      `
        UPDATE products
        SET name = $1, slug = $2, description = $3, price = $4, category = $5, material = $6, image = $7, images = $8, sizes = $9, colors = $10, featured = $11, sold_out = $12, inventory = $13
        WHERE id = $14
      `,
      [
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
      ]
    );
    return;
  }

  const db = getSqliteDb();
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

export async function setProductSoldOut(id: number, soldOut: boolean) {
  await initDb();

  if (useRemoteDb) {
    await pool!.query(
      `
        UPDATE products
        SET sold_out = $1, inventory = CASE WHEN $1 = 1 THEN 0 WHEN inventory = 0 THEN 1 ELSE inventory END
        WHERE id = $2
      `,
      [soldOut ? 1 : 0, id]
    );
    return;
  }

  const db = getSqliteDb();
  db.prepare(
    `
      UPDATE products
      SET sold_out = ?, inventory = CASE WHEN ? = 1 THEN 0 WHEN inventory = 0 THEN 1 ELSE inventory END
      WHERE id = ?
    `
  ).run(soldOut ? 1 : 0, soldOut ? 1 : 0, id);
}

export async function setProductsSoldState(items: CartItem[], soldOut: boolean) {
  const seen = new Set<number>();
  for (const item of items) {
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    await setProductSoldOut(item.productId, soldOut);
  }
}

export async function createOrder(input: {
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  paymentReference?: string | null;
  shippingAddress: string;
  items: CartItem[];
}) {
  await initDb();

  const totalAmount = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNumber = `RC-${Date.now().toString().slice(-8)}`;

  if (useRemoteDb) {
    await pool!.query(
      `
        INSERT INTO orders
        (order_number, customer_name, customer_email, total_amount, payment_method, payment_reference, shipping_address, items_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        orderNumber,
        input.customerName,
        input.customerEmail,
        totalAmount,
        input.paymentMethod,
        input.paymentReference || null,
        input.shippingAddress,
        JSON.stringify(input.items)
      ]
    );
  } else {
    const db = getSqliteDb();
    db.prepare(
      `
        INSERT INTO orders
        (order_number, customer_name, customer_email, total_amount, payment_method, payment_reference, shipping_address, items_json)
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
  }

  await setProductsSoldState(input.items, true);
  return orderNumber;
}

export async function getOrders(): Promise<Order[]> {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<OrderRow>(`SELECT * FROM orders ORDER BY created_at DESC`);
    return result.rows.map(mapOrder);
  }

  const db = getSqliteDb();
  const rows = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all() as OrderRow[];
  return rows.map(mapOrder);
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<OrderRow>(
      `SELECT * FROM orders WHERE LOWER(customer_email) = $1 ORDER BY created_at DESC`,
      [email.toLowerCase()]
    );
    return result.rows.map(mapOrder);
  }

  const db = getSqliteDb();
  const rows = db
    .prepare(`SELECT * FROM orders WHERE LOWER(customer_email) = ? ORDER BY created_at DESC`)
    .all(email.toLowerCase()) as OrderRow[];
  return rows.map(mapOrder);
}

export async function getOrderById(id: number): Promise<Order | null> {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<OrderRow>(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [id]);
    return result.rows[0] ? mapOrder(result.rows[0]) : null;
  }

  const db = getSqliteDb();
  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as OrderRow | undefined;
  return row ? mapOrder(row) : null;
}

export async function updateOrderStatus(id: number, status: string) {
  await initDb();

  if (useRemoteDb) {
    await pool!.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, id]);
    return;
  }

  const db = getSqliteDb();
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
}

export async function deleteOrder(id: number) {
  await initDb();

  if (useRemoteDb) {
    await pool!.query(`DELETE FROM orders WHERE id = $1`, [id]);
    return;
  }

  const db = getSqliteDb();
  db.prepare(`DELETE FROM orders WHERE id = ?`).run(id);
}

export async function getDashboardStats() {
  await initDb();

  if (useRemoteDb) {
    const [products, orders, revenue] = await Promise.all([
      pool!.query<{ count: string }>(`SELECT COUNT(*)::text as count FROM products`),
      pool!.query<{ count: string }>(`SELECT COUNT(*)::text as count FROM orders`),
      pool!.query<{ total: string }>(`SELECT COALESCE(SUM(total_amount), 0)::text as total FROM orders`)
    ]);

    return {
      productCount: Number(products.rows[0]?.count || 0),
      orderCount: Number(orders.rows[0]?.count || 0),
      totalRevenue: Number(revenue.rows[0]?.total || 0)
    };
  }

  const db = getSqliteDb();
  const { count: productCount } = db.prepare(`SELECT COUNT(*) as count FROM products`).get() as { count: number };
  const { count: orderCount } = db.prepare(`SELECT COUNT(*) as count FROM orders`).get() as { count: number };
  const { total } = db.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders`).get() as {
    total: number;
  };

  return { productCount, orderCount, totalRevenue: total };
}

export async function isAdminEmail(email: string) {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<{ id: number }>(
      `SELECT id FROM admin_emails WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    );
    return Boolean(result.rows[0]);
  }

  const db = getSqliteDb();
  const row = db.prepare(`SELECT id FROM admin_emails WHERE email = ?`).get(email.toLowerCase()) as
    | { id: number }
    | undefined;
  return Boolean(row);
}

export function isSuperAdminEmail(email: string) {
  return email.toLowerCase() === "shehran.salam@gmail.com";
}

export async function addAdminEmail(email: string, addedBy: string) {
  await initDb();

  if (useRemoteDb) {
    await pool!.query(
      `INSERT INTO admin_emails (email, added_by) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase(), addedBy.toLowerCase()]
    );
    return;
  }

  const db = getSqliteDb();
  db.prepare(`INSERT OR IGNORE INTO admin_emails (email, added_by) VALUES (?, ?)`).run(
    email.toLowerCase(),
    addedBy.toLowerCase()
  );
}

export async function getAdminEmails(): Promise<AdminEmailRecord[]> {
  await initDb();

  if (useRemoteDb) {
    const result = await pool!.query<AdminEmailRow>(`SELECT * FROM admin_emails ORDER BY created_at ASC`);
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      addedBy: row.added_by,
      createdAt: row.created_at
    }));
  }

  const db = getSqliteDb();
  const rows = db.prepare(`SELECT * FROM admin_emails ORDER BY created_at ASC`).all() as AdminEmailRow[];
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    addedBy: row.added_by,
    createdAt: row.created_at
  }));
}
