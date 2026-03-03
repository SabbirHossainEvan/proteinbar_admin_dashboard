"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { products } from "@/data/admin/mock";

type MenuItem = (typeof products)[number] & { imageUrl?: string; description?: string };

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(products);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    price: "",
    description: "",
    imageUrl: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      price: "",
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
    if (!form.name.trim() || !form.category.trim() || !form.price.trim()) return;

    if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.sku === editingId
            ? {
                ...item,
                name: form.name.trim(),
                collection: form.category.trim(),
                calories: Number(form.calories) || 0,
                protein: form.protein.trim(),
                carbs: form.carbs.trim(),
                fat: form.fat.trim(),
                price: form.price.trim(),
                description: form.description.trim(),
                imageUrl: form.imageUrl || undefined,
              }
            : item,
        ),
      );
      resetForm();
      return;
    }

    const newItem: MenuItem = {
      sku: `MENU-${Date.now()}`,
      name: form.name.trim(),
      collection: form.category.trim(),
      calories: Number(form.calories) || 0,
      protein: form.protein.trim() || "0g",
      carbs: form.carbs.trim() || "0g",
      fat: form.fat.trim() || "0g",
      price: form.price.trim(),
      description: form.description.trim() || "No description added yet.",
      imageUrl: form.imageUrl || undefined,
    };

    setItems((prev) => [newItem, ...prev]);
    resetForm();
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.sku);
    setForm({
      name: item.name,
      category: item.collection,
      calories: String(item.calories),
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      price: item.price,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const deleteItem = (sku: string) => {
    setItems((prev) => prev.filter((item) => item.sku !== sku));
    if (editingId === sku) resetForm();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Menu Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Menu Items</h2>
        <p className="mt-2 text-sm text-zinc-300">Same flow as website menu details: add, edit, delete and image upload.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h3>
        <p className="mt-2 text-sm text-zinc-300">Frontend-only local state for now.</p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Item name"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            placeholder="Category (e.g. Bowls)"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            value={form.calories}
            onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
            placeholder="Calories"
            min={0}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price (e.g. $11.90)"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.protein}
            onChange={(event) => setForm((prev) => ({ ...prev, protein: event.target.value }))}
            placeholder="Protein (e.g. 38g)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.carbs}
            onChange={(event) => setForm((prev) => ({ ...prev, carbs: event.target.value }))}
            placeholder="Carbs (e.g. 42g)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.fat}
            onChange={(event) => setForm((prev) => ({ ...prev, fat: event.target.value }))}
            placeholder="Fat (e.g. 18g)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <label htmlFor="menu-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Upload Menu Image
            </label>
            <input
              id="menu-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Item description"
            className="md:col-span-2 min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {form.imageUrl ? (
            <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={form.imageUrl} alt="Menu preview" width={1200} height={320} className="h-40 w-full object-cover" unoptimized />
            </div>
          ) : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200">
              {editingId ? "Update Item" : "Add Item"}
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

      <section id="menu-details" className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Menu Details</h3>
        <p className="mt-2 text-sm text-zinc-300">Live list of current menu items for storefront rendering.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Image</th>
                <th className="pb-2 pr-4 font-medium">Item ID</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 pr-4 font-medium">Calories</th>
                <th className="pb-2 pr-4 font-medium">Protein</th>
                <th className="pb-2 pr-4 font-medium">Carbs</th>
                <th className="pb-2 pr-4 font-medium">Fat</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sku}>
                  <td className="py-3.5 pr-4">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={96} height={56} className="h-14 w-24 rounded-lg object-cover" unoptimized />
                    ) : (
                      <div className="h-14 w-24 rounded-lg bg-zinc-800" />
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.sku}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.name}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.collection}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.calories}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.protein}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.carbs}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.fat}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.price}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.sku)}
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
