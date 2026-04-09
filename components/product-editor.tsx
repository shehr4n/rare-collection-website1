import Image from "next/image";
import type { Product } from "@/lib/types";

type ProductEditorProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  product?: Product;
};

export function ProductEditor({ action, submitLabel, product }: ProductEditorProps) {
  return (
    <form action={action} className="stack-form editor-form">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {product ? <input type="hidden" name="existingImage" value={product.image} /> : null}
      <input name="name" type="text" placeholder="Product name" defaultValue={product?.name} required />
      <input name="category" type="text" placeholder="Category" defaultValue={product?.category} required />
      <input
        name="material"
        type="text"
        placeholder="Material"
        defaultValue={product?.material}
        required
      />
      <input
        name="price"
        type="number"
        step="0.01"
        min="0"
        placeholder="Price"
        defaultValue={product?.price}
        required
      />
      <input
        name="inventory"
        type="number"
        min="0"
        placeholder="Inventory quantity"
        defaultValue={product?.inventory}
        required
      />
      <label className="file-field">
        Product photo
        <input name="image" type="file" accept="image/*" capture="environment" {...(product ? {} : { required: true })} />
      </label>
      {product?.image ? (
        <div className="existing-image-preview">
          <span className="muted">Current image</span>
          <Image src={product.image} alt={product.name} width={320} height={400} />
        </div>
      ) : null}
      <input
        name="sizes"
        type="text"
        placeholder="Sizes, comma separated"
        defaultValue={product?.sizes.join(", ")}
        required
      />
      <input
        name="colors"
        type="text"
        placeholder="Colors, comma separated"
        defaultValue={product?.colors.join(", ")}
        required
      />
      <textarea
        name="description"
        rows={5}
        placeholder="Product description"
        defaultValue={product?.description}
        required
      />
      <label className="checkbox-row">
        <input name="featured" type="checkbox" defaultChecked={product?.featured} />
        Feature this product on the homepage
      </label>
      <button className="button button-primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
