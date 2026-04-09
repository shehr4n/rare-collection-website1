import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/product-editor";
import { updateProductAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";
import { getProductById } from "@/lib/db";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) {
    notFound();
  }

  return (
    <div className="page-shell narrow">
      <section className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>Edit product</h1>
      </section>
      <ProductEditor action={updateProductAction} submitLabel="Save Changes" product={product} />
    </div>
  );
}
