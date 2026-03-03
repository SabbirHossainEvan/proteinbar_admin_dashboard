"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { products } from "@/data/admin/mock";

type ProductItem = {
  id: string;
  name: string;
  collection: string;
  price: string;
  stock: number;
  description: string;
  imageUrl?: string;
};

const initialProducts: ProductItem[] = products.map((item, index) => ({
  id: item.sku,
  name: item.name,
  collection: item.collection,
  price: item.price,
  stock: 20 + index * 6,
  description: `${item.collection} collection product for proteinbar storefront.`,
}));

export default function ProductsPage() {
  const [items, setItems] = useState<ProductItem[]>(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    collection: "",
    price: "",
    stock: "",
    description: "",
    imageUrl: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      collection: "",
      price: "",
      stock: "",
      description: "",
      imageUrl: "",
    });
    setEditingId(null);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.collection.trim() || !form.price.trim()) return;

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: form.name.trim(),
                collection: form.collection.trim(),
                price: form.price.trim(),
                stock: Number(form.stock) || 0,
                description: form.description.trim() || "No description added yet.",
                imageUrl: form.imageUrl || undefined,
              }
            : item,
        ),
      );
      resetForm();
      return;
    }

    const newItem: ProductItem = {
      id: `PRD-${Date.now()}`,
      name: form.name.trim(),
      collection: form.collection.trim(),
      price: form.price.trim(),
      stock: Number(form.stock) || 0,
      description: form.description.trim() || "No description added yet.",
      imageUrl: form.imageUrl || undefined,
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
  };

  const startEdit = (item: ProductItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      collection: item.collection,
      price: item.price,
      stock: String(item.stock),
      description: item.description,
      imageUrl: item.imageUrl ?? "",
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Catalog Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Products</h2>
        <p className="mt-2 text-sm text-zinc-300">Collections flow: add, edit, remove, and upload product images.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Product" : "Add Product"}</h3>
        <p className="mt-2 text-sm text-zinc-300">Frontend-only product management flow for now.</p>

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
          <input
            type="text"
            value={form.collection}
            onChange={(event) => setForm((prev) => ({ ...prev, collection: event.target.value }))}
            placeholder="Collection (e.g. All Products)"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price (e.g. $12.50)"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            value={form.stock}
            onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
            placeholder="Stock"
            min={0}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200 md:col-span-2">
            <label htmlFor="product-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Upload Product Image
            </label>
            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Product description"
            className="md:col-span-2 min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {form.imageUrl ? (
            <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={form.imageUrl} alt="Product preview" width={1200} height={320} className="h-40 w-full object-cover" unoptimized />
            </div>
          ) : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200">
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

      <section id="product-details" className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Product Details</h3>
        <p className="mt-2 text-sm text-zinc-300">Current storefront product list.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Image</th>
                <th className="pb-2 pr-4 font-medium">Product ID</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Collection</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 pr-4 font-medium">Stock</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-4">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={96} height={56} className="h-14 w-24 rounded-lg object-cover" unoptimized />
                    ) : (
                      <div className="h-14 w-24 rounded-lg bg-zinc-800" />
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.id}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.name}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.collection}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.price}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.stock}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-400/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
