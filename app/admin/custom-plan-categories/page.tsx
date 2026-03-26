"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteCustomPlanCategoryAdminMutation,
  useGetCustomPlanCategoriesAdminQuery,
  useGetMonthlyPlanAdminListQuery,
  useReorderCustomPlanCategoriesAdminMutation,
  useUpsertCustomPlanCategoryAdminMutation
} from "@/redux/api/adminApi";
import type { CustomPlanCategory, SelectionMode } from "@/redux/monthlyPlans/types";

const initialForm = {
  id: "",
  name: "",
  code: "",
  selectionMode: "single" as SelectionMode,
  isActive: true,
  isRequired: true,
  minSelect: 1,
  maxSelect: 1
};

export default function CustomPlanCategoriesPage() {
  const { data: plansData, isLoading: isLoadingPlans } = useGetMonthlyPlanAdminListQuery({ kind: "custom" });
  const customPlans = useMemo(() => plansData?.data ?? [], [plansData]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customPlans.length) return;
    if (!selectedPlanId || !customPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(customPlans[0].id);
    }
  }, [customPlans, selectedPlanId]);

  const { data, isLoading, isError } = useGetCustomPlanCategoriesAdminQuery(selectedPlanId, { skip: !selectedPlanId });
  const [upsertCategory, { isLoading: isSaving }] = useUpsertCustomPlanCategoryAdminMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCustomPlanCategoryAdminMutation();
  const [reorderCategories, { isLoading: isReordering }] = useReorderCustomPlanCategoriesAdminMutation();

  const categories = data?.data ?? [];

  const resetForm = () => {
    setForm(initialForm);
    setError("");
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPlanId) {
      setError("Select a custom plan first.");
      return;
    }
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (form.minSelect < 0) {
      setError("Minimum selection cannot be negative.");
      return;
    }
    if (form.selectionMode === "single" && form.maxSelect !== 1) {
      setError("Single-select category must have max selection 1.");
      return;
    }
    if (form.maxSelect !== null && form.minSelect > form.maxSelect) {
      setError("Minimum selection cannot be greater than maximum selection.");
      return;
    }

    setError("");
    await upsertCategory({
      id: form.id || undefined,
      planId: selectedPlanId,
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      selectionMode: form.selectionMode,
      isActive: form.isActive,
      isRequired: form.isRequired,
      minSelect: form.minSelect,
      maxSelect: form.selectionMode === "single" ? 1 : form.maxSelect
    }).unwrap();
    resetForm();
  };

  const startEdit = (category: CustomPlanCategory) => {
    setForm({
      id: category.id,
      name: category.name,
      code: category.code ?? "",
      selectionMode: category.selectionMode,
      isActive: category.isActive,
      isRequired: category.isRequired,
      minSelect: category.minSelect,
      maxSelect: category.maxSelect ?? 1
    });
    setError("");
  };

  const moveCategory = async (categoryId: string, direction: -1 | 1) => {
    const currentIndex = categories.findIndex((category) => category.id === categoryId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= categories.length) return;
    const reordered = [...categories];
    const [item] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, item);
    await reorderCategories({ planId: selectedPlanId, categoryIds: reordered.map((category) => category.id) }).unwrap();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Custom Plan Builder</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Make Your Plan Categories</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage dynamic modal categories like Proteins, Carbs, Fat, and Sauces from the admin dashboard.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Custom Plan</span>
          <select
            value={selectedPlanId}
            onChange={(event) => {
              setSelectedPlanId(event.target.value);
              resetForm();
            }}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="">Select custom plan</option>
            {customPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{form.id ? "Edit Category" : "Add Category"}</h3>
        <form onSubmit={onSave} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Category Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Proteins"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Code</span>
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="protein"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Selection Mode</span>
            <select
              value={form.selectionMode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  selectionMode: event.target.value as SelectionMode,
                  maxSelect: event.target.value === "single" ? 1 : Math.max(prev.maxSelect, 1)
                }))
              }
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="single">single</option>
              <option value="multi">multi</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Min Select</span>
            <input
              type="number"
              min={0}
              value={form.minSelect}
              onChange={(event) => setForm((prev) => ({ ...prev, minSelect: Number(event.target.value) }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Max Select</span>
            <input
              type="number"
              min={1}
              value={form.maxSelect}
              disabled={form.selectionMode === "single"}
              onChange={(event) => setForm((prev) => ({ ...prev, maxSelect: Number(event.target.value) }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 disabled:opacity-60"
            />
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm text-zinc-200">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))} />
            Active
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm text-zinc-200">
            <input type="checkbox" checked={form.isRequired} onChange={(event) => setForm((prev) => ({ ...prev, isRequired: event.target.checked }))} />
            Required
          </label>
          {error ? <p className="text-sm text-rose-300 md:col-span-2 xl:col-span-4">{error}</p> : null}
          <div className="flex gap-2 md:col-span-2 xl:col-span-4">
            <button type="submit" disabled={isSaving || !selectedPlanId} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60">
              {isSaving ? "Saving..." : form.id ? "Update Category" : "Add Category"}
            </button>
            {form.id ? (
              <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {isLoadingPlans || (selectedPlanId && isLoading) ? <LoadingState label="Loading custom plan categories..." /> : null}
      {isError ? <ErrorState label="Failed to load custom plan categories." /> : null}

      {!isLoading && selectedPlanId ? (
        <section className="admin-panel rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white">Category List</h3>
          <div className="mt-4 space-y-3">
            {categories.map((category, index) => (
              <article key={category.id} className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-base font-semibold text-white">{category.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      code: {category.code || "-"} | mode: {category.selectionMode} | rule: {category.minSelect} to {category.maxSelect ?? "unlimited"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void moveCategory(category.id, -1)} disabled={index === 0 || isReordering} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-100 disabled:opacity-50">
                      Up
                    </button>
                    <button type="button" onClick={() => void moveCategory(category.id, 1)} disabled={index === categories.length - 1 || isReordering} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-100 disabled:opacity-50">
                      Down
                    </button>
                    <button type="button" onClick={() => startEdit(category)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                      Edit
                    </button>
                    <button type="button" onClick={() => void deleteCategory({ id: category.id, planId: selectedPlanId })} disabled={isDeleting} className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">order: {category.displayOrder}</span>
                  <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">status: {category.isActive ? "active" : "inactive"}</span>
                  <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">required: {category.isRequired ? "yes" : "no"}</span>
                </div>
              </article>
            ))}
            {!categories.length ? <p className="text-sm text-zinc-400">No categories created yet for this custom plan.</p> : null}
          </div>
        </section>
      ) : null}
    </section>
  );
}
