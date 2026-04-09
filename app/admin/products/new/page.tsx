import { ProductEditor } from "@/components/product-editor";
import { createProductAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/admin";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="page-shell narrow">
      <section className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>Add a new product</h1>
      </section>
      <ProductEditor action={createProductAction} submitLabel="Create Product" />
    </div>
  );
}
