"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import {
  createOrder,
  createProduct,
  deleteOrder,
  getOrderById,
  setProductsSoldState,
  setProductSoldOut,
  updateOrderStatus,
  updateProduct
} from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/admin";
import { addAdminEmail } from "@/lib/db";
import { put } from "@vercel/blob";
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
  const bytes = await file.arrayBuffer();

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${filename}`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined
    });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const uploadPath = path.join(uploadDir, filename);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, Buffer.from(bytes));
  return `/uploads/${filename}`;
}

async function saveUploadedImages(files: FormDataEntryValue[], existingImages: string[] = []) {
  const uploaded: string[] = [];

  for (const file of files) {
    const saved = await saveUploadedImage(file);
    if (saved) {
      uploaded.push(saved);
    }
  }

  return uploaded.length ? uploaded : existingImages;
}

function parseJsonList(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const images = await saveUploadedImages(formData.getAll("images"));
  const image = images[0] || "";

  await createProduct({
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    category: String(formData.get("category") || ""),
    material: String(formData.get("material") || ""),
    image,
    images,
    sizes: parseList(formData.get("sizes")),
    colors: parseList(formData.get("colors")),
    featured: formData.get("featured") === "on",
    soldOut: formData.get("soldOut") === "on",
    inventory: Number(formData.get("inventory") || 0)
  });

  redirect("/admin");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const existingImages = parseJsonList(formData.get("existingImages"));
  const images = await saveUploadedImages(formData.getAll("images"), existingImages);
  const image = images[0] || String(formData.get("existingImage") || "");

  await updateProduct(Number(formData.get("id")), {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") || 0),
    category: String(formData.get("category") || ""),
    material: String(formData.get("material") || ""),
    image,
    images,
    sizes: parseList(formData.get("sizes")),
    colors: parseList(formData.get("colors")),
    featured: formData.get("featured") === "on",
    soldOut: formData.get("soldOut") === "on",
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
  const paymentReference = String(formData.get("paymentReference") || "").trim();

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

  if (!["Cash on delivery", "bKash payment"].includes(paymentMethod)) {
    return { ok: false as const };
  }

  if (paymentMethod === "bKash payment" && !paymentReference) {
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

  const orderNumber = await createOrder({
    customerName,
    customerEmail,
    paymentMethod,
    paymentReference: paymentMethod === "bKash payment" ? paymentReference : null,
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

  await addAdminEmail(email, currentUser.email);
  redirect("/admin?adminAdded=1");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") || 0);
  const status = String(formData.get("status") || "").trim();
  const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  if (!id || !allowedStatuses.includes(status)) {
    redirect("/admin");
  }

  const order = await getOrderById(id);
  if (!order) {
    redirect("/admin");
  }

  await updateOrderStatus(id, status);

  if (status === "Cancelled" && order.status !== "Cancelled") {
    await setProductsSoldState(order.items, false);
  }

  if (status !== "Cancelled" && order.status === "Cancelled") {
    await setProductsSoldState(order.items, true);
  }

  redirect("/admin?orderUpdated=1");
}

export async function deleteOrderAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") || 0);
  if (!id) {
    redirect("/admin");
  }

  const order = await getOrderById(id);
  if (!order) {
    redirect("/admin");
  }

  await setProductsSoldState(order.items, false);
  await deleteOrder(id);
  redirect("/admin?orderDeleted=1");
}

export async function toggleProductSoldAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id") || 0);
  const soldOut = String(formData.get("soldOut") || "") === "true";

  if (!id) {
    redirect("/admin");
  }

  await setProductSoldOut(id, soldOut);
  redirect(`/admin?productSold=${soldOut ? "1" : "0"}`);
}
