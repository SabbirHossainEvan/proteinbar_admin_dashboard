"use client";

import { FormEvent, useRef, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { menuItems, menuMealTypes, products, weekDays, type MenuMealType } from "@/data/admin/mock";

type MenuItem = (typeof menuItems)[number];

const initialForm = {
  title: "",
  linkedProductSkus: [] as string[],
  visibleDays: [] as string[],
  timeSlots: "",
  mealTypes: [] as MenuMealType[],
  planCompatibility: "",
  priority: "1",
  status: "Visible",
};

function toggleString(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.linkedProductSkus.length) return;

    const payload: MenuItem = {
      id: editingId ?? `MENU-${Date.now()}`,
      title: form.title.trim(),
      linkedProductSkus: form.linkedProductSkus,
      visibleDays: form.visibleDays,
      timeSlots: form.timeSlots
        .split(",")
        .map((slot) => slot.trim())
        .filter(Boolean),
      mealTypes: form.mealTypes,
      planCompatibility: form.planCompatibility
        .split(",")
        .map((plan) => plan.trim())
        .filter(Boolean),
      priority: Number(form.priority) || 1,
      status: form.status,
    };

    if (editingId) {
      setItems((prev) => prev.map((item) => (item.id === editingId ? payload : item)));
      resetForm();
      return;
    }

    setItems((prev) => [payload, ...prev]);
    resetForm();
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      linkedProductSkus: item.linkedProductSkus,
      visibleDays: item.visibleDays,
      timeSlots: item.timeSlots.join(", "),
      mealTypes: item.mealTypes,
      planCompatibility: item.planCompatibility.join(", "),
      priority: String(item.priority),
      status: item.status,
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
        <h2 className="mt-1 text-3xl font-semibold text-white">Add Menu Item (Display Level)</h2>
        <p className="mt-2 text-sm text-zinc-300">Curated client-facing menu card with visibility rules and product grouping.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h3>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Display title"
            required
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />

          <label className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Attach Product(s)</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {products.map((product) => (
                <label key={product.sku} className="flex items-center gap-2 text-zinc-200">
                  <input
                    type="checkbox"
                    checked={form.linkedProductSkus.includes(product.sku)}
                    onChange={() => setForm((prev) => ({ ...prev, linkedProductSkus: toggleString(prev.linkedProductSkus, product.sku) }))}
                  />
                  <span>
                    {product.name} <span className="text-zinc-400">({product.sku})</span>
                  </span>
                </label>
              ))}
            </div>
          </label>

          <label className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Visible Days</span>
            <div className="grid grid-cols-4 gap-1.5">
              {weekDays.map((day) => (
                <label key={day} className="flex items-center gap-1 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.visibleDays.includes(day)}
                    onChange={() => setForm((prev) => ({ ...prev, visibleDays: toggleString(prev.visibleDays, day) }))}
                  />
                  {day}
                </label>
              ))}
            </div>
          </label>

          <label className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Type Filters</span>
            <div className="space-y-1.5">
              {menuMealTypes.map((mealType) => (
                <label key={mealType} className="flex items-center gap-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.mealTypes.includes(mealType)}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        mealTypes: toggleString(prev.mealTypes, mealType) as MenuMealType[],
                      }))
                    }
                  />
                  {mealType}
                </label>
              ))}
            </div>
          </label>

          <input
            type="text"
            value={form.timeSlots}
            onChange={(event) => setForm((prev) => ({ ...prev, timeSlots: event.target.value }))}
            placeholder="Visible time slots (comma separated)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.planCompatibility}
            onChange={(event) => setForm((prev) => ({ ...prev, planCompatibility: event.target.value }))}
            placeholder="Plan compatibility (comma separated)"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={1}
            value={form.priority}
            onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            placeholder="Priority / Sort order"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="Visible">Visible</option>
            <option value="Hidden">Hidden</option>
          </select>

          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200">
              {editingId ? "Update Menu Item" : "Add Menu Item"}
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
        <h3 className="text-lg font-semibold text-white">Menu Card List</h3>
        <p className="mt-2 text-sm text-zinc-300">Product inventory stays in Products module. This table is client-facing display configuration.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Menu ID</th>
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium">Linked Products</th>
                <th className="pb-2 pr-4 font-medium">Visibility</th>
                <th className="pb-2 pr-4 font-medium">Meal Types</th>
                <th className="pb-2 pr-4 font-medium">Plans</th>
                <th className="pb-2 pr-4 font-medium">Priority</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.id}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.title}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.linkedProductSkus.join(", ")}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.visibleDays.join(", ")}
                    <p className="text-xs text-zinc-400">{item.timeSlots.join(", ") || "No slot set"}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.mealTypes.join(", ") || "-"}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.planCompatibility.join(", ") || "All plans"}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.priority}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={item.status} />
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
