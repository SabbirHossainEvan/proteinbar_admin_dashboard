"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation
} from "@/redux/api/adminApi";

type ProductAvailability = "Active" | "Inactive";

type ProductItem = {
  _id?: string;
  id?: string;
  sku: string;
  name: string;
  category: string;
  price: string;
  kcal: number;
  protein: string;
  carbs: string;
  fat: string;
  tags: string[];
  allergens: string[];
  availability: ProductAvailability;
  imageUrl?: string;
};

type ProductApiItem = Partial<ProductItem>;

const availabilityOptions: ProductAvailability[] = ["Active", "Inactive"];
const fallbackCategories = ["Breakfast", "Lunch", "Dinner", "Snack", "Add-on", "Ingredient"];

function getProductId(item: ProductItem) {
  return String(item.id ?? item._id ?? "");
}

function toList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function ProductsPage() {
  const { data, isLoading, isError } = useGetProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo<ProductItem[]>(() => {
    return (data?.data ?? []).map((item: ProductApiItem) => ({
      _id: item._id,
      id: item.id,
      sku: item.sku ?? "",
      name: item.name ?? "",
      category: item.category ?? "",
      price: item.price ?? "",
      kcal: Number(item.kcal ?? 0),
      protein: item.protein ?? "0g",
      carbs: item.carbs ?? "0g",
      fat: item.fat ?? "0g",
      tags: Array.isArray(item.tags) ? item.tags : [],
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      availability: item.availability === "Inactive" ? "Inactive" : "Active",
      imageUrl: item.imageUrl ?? ""
    }));
  }, [data]);

  const productCategories = useMemo(() => {
    const all = [...fallbackCategories, ...items.map((item) => item.category).filter(Boolean)];
    return Array.from(new Set(all));
  }, [items]);

  const defaultCategory = productCategories[0] ?? "Breakfast";

  const [form, setForm] = useState({
    name: "",
    category: defaultCategory,
    price: "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
    tags: "",
    allergens: "",
    availability: "Active" as ProductAvailability,
    imageUrl: ""
  });

  const isSaving = isCreating || isUpdating;

  const resetForm = () => {
    setForm({
      name: "",
      category: defaultCategory,
      price: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
      tags: "",
      allergens: "",
      availability: "Active",
      imageUrl: ""
    });
    setEditingId(null);
    setSubmitError("");
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.name.trim() || !form.price.trim()) return;

    const payload = {
      sku: editingId ? items.find((item) => getProductId(item) === editingId)?.sku ?? `PRD-${Date.now()}` : `PRD-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      price: form.price.trim(),
      kcal: Number(form.kcal) || 0,
      protein: form.protein.trim() || "0g",
      carbs: form.carbs.trim() || "0g",
      fat: form.fat.trim() || "0g",
      tags: toList(form.tags),
      allergens: toList(form.allergens),
      availability: form.availability,
      imageUrl: form.imageUrl || ""
    };

    try {
      if (editingId) {
        await updateProduct({ id: editingId, body: payload }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      resetForm();
    } catch {
      setSubmitError("Failed to save product.");
    }
  };

  const startEdit = (item: ProductItem) => {
    const id = getProductId(item);
    if (!id) return;

    setEditingId(id);
    setForm({
      name: item.name,
      category: item.category || defaultCategory,
      price: item.price,
      kcal: String(item.kcal),
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      tags: item.tags.join(", "),
      allergens: item.allergens.join(", "),
      availability: item.availability,
      imageUrl: item.imageUrl ?? ""
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const removeItem = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      if (editingId === id) resetForm();
    } catch {
      setSubmitError("Failed to delete product.");
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Catalog Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Add Product (SKU Level)</h2>
        <p className="mt-2 text-sm text-zinc-300">Single inventory item with price, macros, category, tags, and availability.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Product" : "Add Product"}</h3>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Product name"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price (e.g. 119 MAD)"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            value={form.kcal}
            onChange={(event) => setForm((prev) => ({ ...prev, kcal: event.target.value }))}
            placeholder="kcal"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.protein}
            onChange={(event) => setForm((prev) => ({ ...prev, protein: event.target.value }))}
            placeholder="Protein (g)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.carbs}
            onChange={(event) => setForm((prev) => ({ ...prev, carbs: event.target.value }))}
            placeholder="Carbs (g)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.fat}
            onChange={(event) => setForm((prev) => ({ ...prev, fat: event.target.value }))}
            placeholder="Fat (g)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={form.availability}
            onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value as ProductAvailability }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            {availabilityOptions.map((availability) => (
              <option key={availability} value={availability}>
                {availability}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={form.tags}
            onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="Tags (comma separated)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.allergens}
            onChange={(event) => setForm((prev) => ({ ...prev, allergens: event.target.value }))}
            placeholder="Allergens (comma separated)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200 md:col-span-2">
            <label htmlFor="product-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Optional Product Image
            </label>
            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900"
            />
          </div>
          {form.imageUrl ? (
            <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={form.imageUrl} alt="Product preview" width={1200} height={320} className="h-40 w-full object-cover" unoptimized />
            </div>
          ) : null}
          {submitError ? <p className="text-sm text-rose-300 md:col-span-2">{submitError}</p> : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={isSaving} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
              {editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Product Inventory List</h3>
        {isError ? <p className="mt-3 text-sm text-rose-300">Failed to load products.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Image</th>
                <th className="pb-2 pr-4 font-medium">SKU</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 pr-4 font-medium">Macros</th>
                <th className="pb-2 pr-4 font-medium">Tags / Allergens</th>
                <th className="pb-2 pr-4 font-medium">Availability</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : items).map((item) => {
                const id = getProductId(item);
                return (
                  <tr key={id || item.sku}>
                    <td className="py-3.5 pr-4">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} width={96} height={56} className="h-14 w-24 rounded-lg object-cover" unoptimized />
                      ) : (
                        <div className="h-14 w-24 rounded-lg bg-zinc-800" />
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-200">{item.sku}</td>
                    <td className="py-3.5 pr-4 text-zinc-100">{item.name}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">{item.category}</td>
                    <td className="py-3.5 pr-4 text-zinc-200">{item.price}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">
                      {item.kcal} kcal | P{item.protein.replace("g", "")} C{item.carbs.replace("g", "")} F{item.fat.replace("g", "")}
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-300">
                      <p>{item.tags.length ? item.tags.join(", ") : "-"}</p>
                      <p className="text-xs text-zinc-400">Allergens: {item.allergens.length ? item.allergens.join(", ") : "None"}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={item.availability} />
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => id && removeItem(id)}
                          disabled={!id || isDeleting}
                          className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-400/20 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && items.length === 0 ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={9}>No products found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
