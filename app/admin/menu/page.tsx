"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  useCreateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetMenuItemsQuery,
  useGetProductsQuery,
  useGetRestaurantsQuery,
  useUpdateMenuItemMutation
} from "@/redux/api/adminApi";

type MenuMealType = "Breakfast" | "Lunch" | "Dinner";

type MenuItem = {
  _id?: string;
  id?: string;
  menuId: string;
  title: string;
  image?: string;
  restaurantIds: string[];
  restaurants: string[];
  linkedProductSkus: string[];
  visibleDays: string[];
  timeSlots: string[];
  mealTypes: MenuMealType[];
  planCompatibility: string[];
  priority: number;
  status: string;
};

type ProductOption = {
  sku: string;
  name: string;
};

type RestaurantOption = {
  restaurantId: string;
  name: string;
  address: string;
  status: string;
};

const menuMealTypes: MenuMealType[] = ["Breakfast", "Lunch", "Dinner"];
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const initialForm = {
  title: "",
  image: "",
  restaurantIds: [] as string[],
  linkedProductSkus: [] as string[],
  visibleDays: [] as string[],
  timeSlots: "",
  mealTypes: [] as MenuMealType[],
  planCompatibility: "",
  priority: "1",
  status: "Visible"
};

function toggleString(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function getMenuItemId(item: MenuItem) {
  return String(item.id ?? item._id ?? "");
}

export default function MenuPage() {
  const { data, isLoading, isError } = useGetMenuItemsQuery();
  const { data: productsResponse } = useGetProductsQuery();
  const { data: restaurantsResponse } = useGetRestaurantsQuery();
  const [createMenuItem, { isLoading: isCreating }] = useCreateMenuItemMutation();
  const [updateMenuItem, { isLoading: isUpdating }] = useUpdateMenuItemMutation();
  const [deleteMenuItem, { isLoading: isDeleting }] = useDeleteMenuItemMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const items = useMemo<MenuItem[]>(() => {
    return (data?.data ?? []).map((item: Partial<MenuItem>) => ({
      _id: item._id,
      id: item.id,
      menuId: item.menuId ?? "",
      title: item.title ?? "",
      image: item.image ?? "",
      restaurantIds: Array.isArray(item.restaurantIds) ? item.restaurantIds : [],
      restaurants: Array.isArray(item.restaurants) ? item.restaurants : [],
      linkedProductSkus: Array.isArray(item.linkedProductSkus) ? item.linkedProductSkus : [],
      visibleDays: Array.isArray(item.visibleDays) ? item.visibleDays : [],
      timeSlots: Array.isArray(item.timeSlots) ? item.timeSlots : [],
      mealTypes: Array.isArray(item.mealTypes) ? item.mealTypes : [],
      planCompatibility: Array.isArray(item.planCompatibility) ? item.planCompatibility : [],
      priority: Number(item.priority ?? 1),
      status: item.status ?? "Visible"
    }));
  }, [data]);

  const restaurants = useMemo<RestaurantOption[]>(() => {
    return (restaurantsResponse?.data ?? []).map((restaurant: Partial<RestaurantOption>) => ({
      restaurantId: String(restaurant.restaurantId ?? ""),
      name: String(restaurant.name ?? ""),
      address: String(restaurant.address ?? ""),
      status: String(restaurant.status ?? "Active")
    }));
  }, [restaurantsResponse]);

  const products = useMemo<ProductOption[]>(() => {
    return (productsResponse?.data ?? []).map((product: Partial<ProductOption>) => ({
      sku: String(product.sku ?? ""),
      name: String(product.name ?? "")
    }));
  }, [productsResponse]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setSubmitError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.title.trim() || !form.linkedProductSkus.length) return;
    if (!form.restaurantIds.length) {
      setSubmitError("Select at least one restaurant for this menu item.");
      return;
    }

    const currentMenuId = editingId
      ? items.find((item) => getMenuItemId(item) === editingId)?.menuId ?? `MENU-${Date.now()}`
      : `MENU-${Date.now()}`;

    const payload = {
      menuId: currentMenuId,
      title: form.title.trim(),
      image: form.image || undefined,
      restaurantIds: form.restaurantIds,
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
      status: form.status
    };

    try {
      if (editingId) {
        await updateMenuItem({ id: editingId, body: payload }).unwrap();
      } else {
        await createMenuItem(payload).unwrap();
      }
      resetForm();
    } catch {
      setSubmitError("Failed to save menu item.");
    }
  };

  const startEdit = (item: MenuItem) => {
    const id = getMenuItemId(item);
    if (!id) return;

    setEditingId(id);
    setForm({
      title: item.title,
      image: item.image ?? "",
      restaurantIds: item.restaurantIds,
      linkedProductSkus: item.linkedProductSkus,
      visibleDays: item.visibleDays,
      timeSlots: item.timeSlots.join(", "),
      mealTypes: item.mealTypes,
      planCompatibility: item.planCompatibility.join(", "),
      priority: String(item.priority),
      status: item.status
    });
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const removeItem = async (id: string) => {
    try {
      await deleteMenuItem(id).unwrap();
      if (editingId === id) resetForm();
    } catch {
      setSubmitError("Failed to delete menu item.");
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Catalog Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Add Menu Item (Display Level)</h2>
        <p className="mt-2 text-sm text-zinc-300">Curated client-facing menu card with visibility rules and product grouping.</p>
        <p className="mt-2 max-w-3xl text-xs text-zinc-500">
          Plan compatibility is treated as an optional advanced filter only. If you leave it blank, the menu item can appear for all relevant plans.
        </p>
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

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Menu Image Upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-900"
            />
          </label>

          <div className="md:col-span-2">
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/35 p-3">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt={form.title || "Menu preview"}
                  className="max-h-48 rounded-xl object-cover"
                />
              ) : (
                <p className="text-sm text-zinc-500">Uploaded menu image preview will appear here.</p>
              )}
            </div>
          </div>

          <label className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-200">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Assign Restaurant(s)</span>
            {restaurants.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {restaurants.map((restaurant) => (
                  <label key={restaurant.restaurantId} className="flex items-start gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={form.restaurantIds.includes(restaurant.restaurantId)}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          restaurantIds: toggleString(prev.restaurantIds, restaurant.restaurantId)
                        }))
                      }
                    />
                    <span>
                      {restaurant.name}
                      <span className="block text-xs text-zinc-400">
                        {restaurant.address || restaurant.restaurantId}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No restaurants found. Add a restaurant first from the Restaurants section.</p>
            )}
          </label>

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
                        mealTypes: toggleString(prev.mealTypes, mealType) as MenuMealType[]
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
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan Compatibility</span>
            <input
              type="text"
              value={form.planCompatibility}
              onChange={(event) => setForm((prev) => ({ ...prev, planCompatibility: event.target.value }))}
              placeholder="Optional advanced filter, comma separated"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            />
          </label>
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

          {submitError ? <p className="text-sm text-rose-300 md:col-span-2">{submitError}</p> : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={isCreating || isUpdating || !restaurants.length} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
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
            {!restaurants.length ? <p className="text-sm text-zinc-400">Create at least one restaurant before adding a menu item.</p> : null}
          </div>
        </form>
      </section>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Menu Card List</h3>
        <p className="mt-2 text-sm text-zinc-300">Product inventory stays in Products module. This table is client-facing display configuration.</p>
        {isError ? <p className="mt-3 text-sm text-rose-300">Failed to load menu items.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Menu ID</th>
                <th className="pb-2 pr-4 font-medium">Image</th>
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium">Restaurants</th>
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
              {(isLoading ? [] : items).map((item) => {
                const id = getMenuItemId(item);
                return (
                  <tr key={id || item.menuId}>
                    <td className="py-3.5 pr-4 text-zinc-200">{item.menuId}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.title} className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <span className="text-zinc-500">No image</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-100">{item.title}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">{item.restaurants.join(", ") || "All restaurants"}</td>
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
                  <td className="py-3.5 text-zinc-400" colSpan={11}>No menu items found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
