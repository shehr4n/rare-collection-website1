"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { createOrder, createProduct, updateProduct } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/admin";
import { addAdminEmail } from "@/lib/db";
import { bangladeshLocations } from "@/lib/bd-locations";

function parseList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function saveUploadedImage(file: FormDataEntryValue | null, fallback?: string) {
  if (!file || typeof file === "string" || file.size === 0) {
    return fallback || "";
  }

  const safeBaseName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const extension = path.extname(safeBaseName) || ".jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const uploadPath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(uploadPath, Buffer.from(bytes));

  return `/uploads/${filename}`;
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const image = await saveUploadedImage(formData.get("image"));

  createProduct({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    category: String(formData.get("category") || ""),
    material: String(formData.get("material") || ""),
    image,
    sizes: parseList(formData.get("sizes")),
    colors: parseList(formData.get("colors")),
    featured: formData.get("featured") === "on",
    inventory: Number(formData.get("inventory") || 0)
  });

  redirect("/admin");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const image = await saveUploadedImage(
    formData.get("image"),
    String(formData.get("existingImage") || "")
  );

  updateProduct(Number(formData.get("id")), {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    category: String(formData.get("category") || ""),
    material: String(formData.get("material") || ""),
    image,
    sizes: parseList(formData.get("sizes")),
    colors: parseList(formData.get("colors")),
    featured: formData.get("featured") === "on",
    inventory: Number(formData.get("inventory") || 0)
  });

  redirect("/admin");
}

export async function checkoutAction(formData: FormData) {
  const itemsRaw = String(formData.get("items") || "[]");
  const items = JSON.parse(itemsRaw);

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false as const };
  }

  const customerName = String(formData.get("customerName") || "").trim();
  const customerEmail = String(formData.get("customerEmail") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const division = String(formData.get("division") || "").trim();
  const district = String(formData.get("district") || "").trim();
  const area = String(formData.get("area") || "").trim();
  const streetAddress = String(formData.get("streetAddress") || "").trim();
  const landmark = String(formData.get("landmark") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "").trim();

  const divisionData = bangladeshLocations[division as keyof typeof bangladeshLocations];
  const districtData = divisionData?.[district as keyof typeof divisionData];
  const validPhone = /^(\+8801|01)[3-9]\d{8}$/.test(phone);

  if (
    !customerName ||
    !customerEmail ||
    !validPhone ||
    !divisionData ||
    !districtData ||
    !districtData.includes(area) ||
    !streetAddress ||
    !paymentMethod
  ) {
    return { ok: false as const };
  }

  const shippingAddress = [
    streetAddress,
    landmark ? `Landmark: ${landmark}` : "",
    `Area: ${area}`,
    `District/City: ${district}`,
    `Division: ${division}`,
    `Mobile: ${phone}`
  ]
    .filter(Boolean)
    .join(", ");

  const orderNumber = createOrder({
    customerName,
    customerEmail,
    paymentMethod,
    shippingAddress,
    items
  });

  return { ok: true as const, orderNumber };
}

export async function addAdminAction(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (!currentUser.session) {
    redirect("/auth/login?returnTo=/admin");
  }

  if (!currentUser.isSuperAdmin) {
    redirect("/admin");
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!email) {
    redirect("/admin?adminError=missing");
  }

  addAdminEmail(email, currentUser.email);
  redirect("/admin?adminAdded=1");
}
