"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  useCreateRestaurantMutation,
  useDeleteRestaurantMutation,
  useGetRestaurantsQuery,
  useUpdateRestaurantMutation
} from "@/redux/api/adminApi";

type RestaurantItem = {
  _id?: string;
  id?: string;
  restaurantId: string;
  name: string;
  address: string;
  workingDays: string[];
  openingHours: string;
  status: string;
};

type RestaurantApiItem = Partial<RestaurantItem>;

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const initialForm = {
  name: "",
  address: "",
  workingDays: [] as string[],
  openingHours: "",
  status: "Active"
};

function getRestaurantDocId(item: RestaurantItem) {
  return String(item.id ?? item._id ?? "");
}

function toggleDay(days: string[], day: string) {
  return days.includes(day) ? days.filter((item) => item !== day) : [...days, day];
}

export default function RestaurantsPage() {
  const { data, isLoading, isError } = useGetRestaurantsQuery();
  const [createRestaurant, { isLoading: isCreating }] = useCreateRestaurantMutation();
  const [updateRestaurant, { isLoading: isUpdating }] = useUpdateRestaurantMutation();
  const [deleteRestaurant, { isLoading: isDeleting }] = useDeleteRestaurantMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const restaurants = useMemo<RestaurantItem[]>(() => {
    return (data?.data ?? []).map((restaurant: RestaurantApiItem) => ({
      _id: restaurant._id,
      id: restaurant.id,
      restaurantId: restaurant.restaurantId ?? "",
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      workingDays: Array.isArray(restaurant.workingDays) ? restaurant.workingDays : [],
      openingHours: restaurant.openingHours ?? "",
      status: restaurant.status ?? "Active"
    }));
  }, [data]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSubmitError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.name.trim()) return;

    const currentRestaurantId = editingId
      ? restaurants.find((restaurant) => getRestaurantDocId(restaurant) === editingId)?.restaurantId ?? `REST-${Date.now()}`
      : `REST-${Date.now()}`;

    const payload = {
      restaurantId: currentRestaurantId,
      name: form.name.trim(),
      address: form.address.trim(),
      workingDays: form.workingDays,
      openingHours: form.openingHours.trim(),
      status: form.status
    };

    try {
      if (editingId) {
        await updateRestaurant({ id: editingId, body: payload }).unwrap();
      } else {
        await createRestaurant(payload).unwrap();
      }
      resetForm();
    } catch {
      setSubmitError("Failed to save restaurant.");
    }
  };

  const startEdit = (restaurant: RestaurantItem) => {
    const id = getRestaurantDocId(restaurant);
    if (!id) return;

    setEditingId(id);
    setForm({
      name: restaurant.name,
      address: restaurant.address,
      workingDays: restaurant.workingDays,
      openingHours: restaurant.openingHours,
      status: restaurant.status
    });

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const removeRestaurant = async (id: string) => {
    try {
      await deleteRestaurant(id).unwrap();
      if (editingId === id) resetForm();
    } catch {
      setSubmitError("Failed to delete restaurant.");
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Menu Setup</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Restaurants</h2>
        <p className="mt-2 text-sm text-zinc-300">Create restaurants first, then attach menu items to the correct branch from the menu module.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Restaurant" : "Add Restaurant"}</h3>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Restaurant / branch name"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input
            type="text"
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="Address / branch note (optional)"
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <label className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-200 md:col-span-2">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Working Days</span>
            <div className="grid grid-cols-4 gap-1.5">
              {weekDays.map((day) => (
                <label key={day} className="flex items-center gap-1 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.workingDays.includes(day)}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        workingDays: toggleDay(prev.workingDays, day)
                      }))
                    }
                  />
                  {day}
                </label>
              ))}
            </div>
          </label>
          <input
            type="text"
            value={form.openingHours}
            onChange={(event) => setForm((prev) => ({ ...prev, openingHours: event.target.value }))}
            placeholder="Opening hours (example: 9:30 - 00:00)"
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />

          {submitError ? <p className="text-sm text-rose-300 md:col-span-2">{submitError}</p> : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={isCreating || isUpdating} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
              {editingId ? "Update Restaurant" : "Add Restaurant"}
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
        <h3 className="text-lg font-semibold text-white">Restaurant List</h3>
        {isError ? <p className="mt-3 text-sm text-rose-300">Failed to load restaurants.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Restaurant</th>
                <th className="pb-2 pr-4 font-medium">Address</th>
                <th className="pb-2 pr-4 font-medium">Working Days / Hours</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : restaurants).map((restaurant) => {
                const id = getRestaurantDocId(restaurant);
                return (
                  <tr key={id || restaurant.restaurantId}>
                    <td className="py-3.5 pr-4 text-zinc-100">
                      {restaurant.name}
                      <p className="text-xs text-zinc-400">{restaurant.restaurantId}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-300">{restaurant.address || "-"}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">
                      {restaurant.workingDays.join(", ") || "-"}
                      <p className="text-xs text-zinc-400">{restaurant.openingHours || "No hours set"}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge label={restaurant.status} />
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(restaurant)}
                          className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => id && removeRestaurant(id)}
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
              {!isLoading && restaurants.length === 0 ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={5}>No restaurants found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
