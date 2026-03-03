 "use client";

import { FormEvent, useRef, useState } from "react";
import { customers } from "@/data/admin/mock";

type LocationItem = (typeof customers)[number];

export default function CustomersPage() {
  const [locations, setLocations] = useState<LocationItem[]>(customers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    orders: "",
    totalSpent: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      city: "",
      orders: "",
      totalSpent: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.city.trim() || !form.totalSpent.trim()) return;

    if (editingId) {
      setLocations((prev) =>
        prev.map((location) =>
          location.id === editingId
            ? {
                ...location,
                name: form.name.trim(),
                email: form.email.trim(),
                city: form.city.trim(),
                orders: Number(form.orders) || 0,
                totalSpent: form.totalSpent.trim(),
              }
            : location,
        ),
      );
      resetForm();
      return;
    }

    const newLocation: LocationItem = {
      id: `LOC-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      orders: Number(form.orders) || 0,
      totalSpent: form.totalSpent.trim(),
    };

    setLocations((prev) => [newLocation, ...prev]);
    resetForm();
  };

  const startEdit = (location: LocationItem) => {
    setEditingId(location.id);
    setForm({
      name: location.name,
      email: location.email,
      city: location.city,
      orders: String(location.orders),
      totalSpent: location.totalSpent,
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((location) => location.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Branch Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Locations</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage branches, contact channels, delivery coverage, and availability hours.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Location" : "Add Location"}</h3>
        <p className="mt-2 text-sm text-zinc-300">Frontend-only local state for now.</p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Branch name"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Branch email"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="City"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            value={form.orders}
            onChange={(event) => setForm((prev) => ({ ...prev, orders: event.target.value }))}
            placeholder="Monthly orders"
            min={0}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.totalSpent}
            onChange={(event) => setForm((prev) => ({ ...prev, totalSpent: event.target.value }))}
            placeholder="Availability / Coverage"
            required
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200">
              {editingId ? "Update Location" : "Add Location"}
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
        <h3 className="text-lg font-semibold text-white">Location List</h3>
        <p className="mt-2 text-sm text-zinc-300">Live list of all active branches and delivery hubs.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Branch</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 pr-4 font-medium">City</th>
                <th className="pb-2 pr-4 font-medium">Monthly Orders</th>
                <th className="pb-2 pr-4 font-medium">Availability</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">{location.name}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{location.email}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{location.city}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{location.orders}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{location.totalSpent}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(location)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id)}
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
