"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteCustomPlanFoodItemAdminMutation,
  useGetCustomPlanCategoriesAdminQuery,
  useGetCustomPlanFoodItemsAdminQuery,
  useGetMonthlyPlanAdminListQuery,
  useReorderCustomPlanFoodItemsAdminMutation,
  useUpsertCustomPlanFoodItemAdminMutation
} from "@/redux/api/adminApi";
import type { CustomPlanFoodItem, CustomPlanFoodSize } from "@/redux/monthlyPlans/types";

type SizeDraft = Omit<CustomPlanFoodSize, "foodItemId" | "displayOrder" | "isActive"> & {
  displayOrder?: number;
  isActive?: boolean;
};

const createSizeDraft = (): SizeDraft => ({
  id: "",
  label: "",
  unit: "g",
  price: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
});

const initialForm = {
  id: "",
  name: "",
  imageUrl: "",
  description: "",
  categoryId: "",
  isActive: true,
  sizes: [createSizeDraft()]
};

export default function CustomPlanFoodItemsPage() {
  const { data: plansData, isLoading: isLoadingPlans } = useGetMonthlyPlanAdminListQuery({ kind: "custom" });
  const customPlans = useMemo(() => plansData?.data ?? [], [plansData]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customPlans.length) return;
    if (!selectedPlanId || !customPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(customPlans[0].id);
    }
  }, [customPlans, selectedPlanId]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCustomPlanCategoriesAdminQuery(selectedPlanId, { skip: !selectedPlanId });
  const categories = useMemo(() => categoriesData?.data ?? [], [categoriesData]);

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategoryId("");
      return;
    }
    if (!selectedCategoryId || !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const { data, isLoading, isError } = useGetCustomPlanFoodItemsAdminQuery(
    { planId: selectedPlanId, categoryId: selectedCategoryId || undefined },
    { skip: !selectedPlanId }
  );

  const [upsertFoodItem, { isLoading: isSaving }] = useUpsertCustomPlanFoodItemAdminMutation();
  const [deleteFoodItem, { isLoading: isDeleting }] = useDeleteCustomPlanFoodItemAdminMutation();
  const [reorderFoodItems, { isLoading: isReordering }] = useReorderCustomPlanFoodItemsAdminMutation();

  const items = data?.data ?? [];

  const resetForm = () => {
    setForm({ ...initialForm, categoryId: selectedCategoryId });
    setError("");
  };

  useEffect(() => {
    setForm((prev) => ({ ...prev, categoryId: prev.id ? prev.categoryId : selectedCategoryId }));
  }, [selectedCategoryId]);

  const updateSize = (index: number, patch: Partial<SizeDraft>) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, sizeIndex) => (sizeIndex === index ? { ...size, ...patch } : size))
    }));
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPlanId) {
      setError("Select a custom plan first.");
      return;
    }
    if (!form.categoryId) {
      setError("Category is required.");
      return;
    }
    if (!form.name.trim()) {
      setError("Food item name is required.");
      return;
    }
    if (!form.imageUrl.trim()) {
      setError("Image URL is required.");
      return;
    }
    if (!form.sizes.length || form.sizes.some((size) => !size.label.trim())) {
      setError("At least one valid size is required.");
      return;
    }

    setError("");
    await upsertFoodItem({
      id: form.id || undefined,
      planId: selectedPlanId,
      categoryId: form.categoryId,
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      sizes: form.sizes.map((size, index) => ({
        id: size.id || undefined,
        foodItemId: form.id || "",
        label: size.label.trim(),
        unit: size.unit?.trim() || undefined,
        price: Number(size.price),
        calories: Number(size.calories),
        protein: Number(size.protein),
        carbs: Number(size.carbs),
        fat: Number(size.fat),
        displayOrder: index + 1,
        isActive: size.isActive ?? true
      }))
    }).unwrap();
    resetForm();
  };

  const startEdit = (item: CustomPlanFoodItem) => {
    setForm({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      description: item.description ?? "",
      categoryId: item.categoryId,
      isActive: item.isActive,
      sizes: item.sizes.map((size) => ({
        id: size.id,
        label: size.label,
        unit: size.unit ?? "",
        price: size.price,
        calories: size.calories,
        protein: size.protein,
        carbs: size.carbs,
        fat: size.fat,
        isActive: size.isActive
      }))
    });
    setError("");
  };

  const moveItem = async (itemId: string, direction: -1 | 1) => {
    if (!selectedPlanId || !selectedCategoryId) return;
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return;
    const reordered = [...items];
    const [item] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, item);
    await reorderFoodItems({ planId: selectedPlanId, categoryId: selectedCategoryId, itemIds: reordered.map((entry) => entry.id) }).unwrap();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Custom Plan Builder</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Make Your Plan Food Items</h2>
        <p className="mt-2 text-sm text-zinc-300">Upload and manage food cards, sizes, prices, and nutrition for each dynamic category.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Custom Plan</span>
            <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300">
              <option value="">Select custom plan</option>
              {customPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Category Filter</span>
            <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{form.id ? "Edit Food Item" : "Add Food Item"}</h3>
        <form onSubmit={onSave} className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Food Name</span>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Category</span>
              <select value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300">
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-zinc-200">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
              Active
            </label>
            <label className="space-y-1 md:col-span-2 xl:col-span-4">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Image URL</span>
              <input value={form.imageUrl} onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://..." className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
            </label>
            <label className="space-y-1 md:col-span-2 xl:col-span-4">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Description</span>
              <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className="min-h-24 w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-white">Available Sizes</h4>
              <button type="button" onClick={() => setForm((prev) => ({ ...prev, sizes: [...prev.sizes, createSizeDraft()] }))} className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-semibold text-zinc-900">
                + Add Size
              </button>
            </div>
            {form.sizes.map((size, index) => (
              <div key={`${size.id || "new"}-${index}`} className="grid gap-3 rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-4 md:grid-cols-2 xl:grid-cols-8">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Label</span>
                  <input value={size.label} onChange={(event) => updateSize(index, { label: event.target.value })} placeholder="100g" className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Unit</span>
                  <input value={size.unit ?? ""} onChange={(event) => updateSize(index, { unit: event.target.value })} placeholder="g/ml" className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Price</span>
                  <input type="number" min={0} value={size.price} onChange={(event) => updateSize(index, { price: Number(event.target.value) })} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Calories</span>
                  <input type="number" min={0} value={size.calories} onChange={(event) => updateSize(index, { calories: Number(event.target.value) })} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Protein</span>
                  <input type="number" min={0} value={size.protein} onChange={(event) => updateSize(index, { protein: Number(event.target.value) })} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Carbs</span>
                  <input type="number" min={0} value={size.carbs} onChange={(event) => updateSize(index, { carbs: Number(event.target.value) })} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Fat</span>
                  <input type="number" min={0} value={size.fat} onChange={(event) => updateSize(index, { fat: Number(event.target.value) })} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <div className="flex items-end">
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, sizes: prev.sizes.filter((_, sizeIndex) => sizeIndex !== index) }))} disabled={form.sizes.length === 1} className="w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 disabled:opacity-50">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div className="flex gap-2">
            <button type="submit" disabled={isSaving || !selectedPlanId} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60">
              {isSaving ? "Saving..." : form.id ? "Update Food Item" : "Add Food Item"}
            </button>
            {form.id ? (
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {isLoadingPlans || isLoadingCategories || (selectedPlanId && isLoading) ? <LoadingState label="Loading custom plan food items..." /> : null}
      {isError ? <ErrorState label="Failed to load custom plan food items." /> : null}

      {!isLoading && selectedPlanId ? (
        <section className="admin-panel rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white">Food Item List</h3>
          <div className="mt-4 space-y-3">
            {items.map((item, index) => (
              <article key={item.id} className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-zinc-400">{item.description || "No description"}</p>
                    <p className="text-xs text-zinc-500">{item.imageUrl}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">status: {item.isActive ? "active" : "inactive"}</span>
                      <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">sizes: {item.sizes.length}</span>
                      <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">order: {item.displayOrder}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.sizes.map((size) => (
                        <span key={size.id} className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                          {size.label} | {size.price}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void moveItem(item.id, -1)} disabled={index === 0 || isReordering} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-100 disabled:opacity-50">
                      Up
                    </button>
                    <button type="button" onClick={() => void moveItem(item.id, 1)} disabled={index === items.length - 1 || isReordering} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-100 disabled:opacity-50">
                      Down
                    </button>
                    <button type="button" onClick={() => startEdit(item)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                      Edit
                    </button>
                    <button type="button" onClick={() => void deleteFoodItem({ id: item.id, planId: selectedPlanId })} disabled={isDeleting} className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!items.length ? <p className="text-sm text-zinc-400">No food items found for this plan/category.</p> : null}
          </div>
        </section>
      ) : null}
    </section>
  );
}
