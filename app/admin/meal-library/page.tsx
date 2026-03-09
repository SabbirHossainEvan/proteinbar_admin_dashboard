"use client";

import { FormEvent, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteMealLibraryAdminMutation,
  useGetMealLibraryAdminQuery,
  useUpsertMealLibraryAdminMutation
} from "@/redux/api/adminApi";
import type { MealLibraryItem, MealType } from "@/redux/monthlyPlans/types";

const initialForm = {
  id: "",
  name: "",
  mealType: "Lunch" as MealType,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  tags: "",
  status: "active" as "active" | "inactive"
};

export default function MealLibraryPage() {
  const { data, isLoading, isError } = useGetMealLibraryAdminQuery();
  const [upsertMeal, { isLoading: isSaving }] = useUpsertMealLibraryAdminMutation();
  const [deleteMeal, { isLoading: isDeleting }] = useDeleteMealLibraryAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const meals = data?.data ?? [];
  const activeCount = useMemo(() => meals.filter((meal) => meal.status === "active").length, [meals]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Meal name is required.");
      return;
    }
    setError("");
    const payload: MealLibraryItem = {
      id: form.id || `meal-${Date.now()}`,
      name: form.name.trim(),
      mealType: form.mealType,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: form.status
    };
    await upsertMeal(payload).unwrap();
    setForm(initialForm);
  };

  const startEdit = (meal: MealLibraryItem) => {
    setForm({
      id: meal.id,
      name: meal.name,
      mealType: meal.mealType,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      tags: meal.tags.join(", "),
      status: meal.status
    });
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Meal Catalog</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Meal Library</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage meals that can be assigned by week/date and meal type in monthly plans.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <p className="text-sm text-zinc-300">
          Active meals: <span className="font-semibold text-amber-200">{activeCount}</span>
        </p>
        <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Name (customer list-e dekhabe)</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Meal name"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Type (Breakfast/Lunch/Dinner/Snack)</span>
            <select
              value={form.mealType}
              onChange={(event) => setForm((prev) => ({ ...prev, mealType: event.target.value as MealType }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Status (Active hole assign করা যাবে)</span>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as "active" | "inactive" }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Calories (kcal per serving)</span>
            <input
              type="number"
              min={0}
              value={form.calories}
              onChange={(event) => setForm((prev) => ({ ...prev, calories: Number(event.target.value) }))}
              placeholder="Calories"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Protein (gram)</span>
            <input
              type="number"
              min={0}
              value={form.protein}
              onChange={(event) => setForm((prev) => ({ ...prev, protein: Number(event.target.value) }))}
              placeholder="Protein"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Carbs (gram)</span>
            <input
              type="number"
              min={0}
              value={form.carbs}
              onChange={(event) => setForm((prev) => ({ ...prev, carbs: Number(event.target.value) }))}
              placeholder="Carbs"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Fat (gram)</span>
            <input
              type="number"
              min={0}
              value={form.fat}
              onChange={(event) => setForm((prev) => ({ ...prev, fat: Number(event.target.value) }))}
              placeholder="Fat"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Tags (filter/badge er jonno, comma separated)</span>
            <input
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="Tags (comma separated)"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          {error ? <p className="text-sm text-rose-300 md:col-span-3">{error}</p> : null}
          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : form.id ? "Update Meal" : "Add Meal"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm text-zinc-100"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {isLoading ? <LoadingState label="Loading meal library..." /> : null}
      {isError ? <ErrorState label="Failed to load meal library." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Meal</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Macros</th>
                <th className="pb-2 pr-4 font-medium">Tags</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">{meal.name}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{meal.mealType}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    kcal:{meal.calories} P:{meal.protein} C:{meal.carbs} F:{meal.fat}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{meal.tags.join(", ") || "-"}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{meal.status}</td>
                  <td className="py-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(meal)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMeal(meal.id)}
                        disabled={isDeleting}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!meals.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={6}>
                    No meals found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}
