"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteMealLibraryAdminMutation,
  useGetMealLibraryAdminQuery,
  useUpsertMealLibraryAdminMutation
} from "@/redux/api/adminApi";
import type { MealLibraryItem, MealType } from "@/redux/monthlyPlans/types";

const mealTypeOptions: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

const initialForm = {
  id: "",
  name: "",
  mealType: "Lunch" as MealType,
  mealTypes: ["Lunch"] as MealType[],
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  tags: "",
  addOnOptions: "",
  status: "active" as "active" | "inactive",
  image: ""
};

export default function MealLibraryPage() {
  const { data, isLoading, isError } = useGetMealLibraryAdminQuery();
  const [upsertMeal, { isLoading: isSaving }] = useUpsertMealLibraryAdminMutation();
  const [deleteMeal, { isLoading: isDeleting }] = useDeleteMealLibraryAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const meals = useMemo(() => data?.data ?? [], [data]);
  const activeCount = useMemo(() => meals.filter((meal) => meal.status === "active").length, [meals]);
  const protectedMeals = useMemo(
    () => meals.filter((meal) => meal.status === "inactive" && (meal.archivedPlanCount ?? 0) > 0),
    [meals]
  );
  const archivedProtectedCount = useMemo(
    () => protectedMeals.length,
    [protectedMeals]
  );

  const getProtectedMealMessage = (meal: MealLibraryItem) => {
    if (meal.archiveReason) return meal.archiveReason;
    const planCount = meal.archivedPlanCount ?? 0;
    if (planCount > 1) return `Archived because this meal is still assigned to ${planCount} plans.`;
    if (planCount === 1) return "Archived because this meal is still assigned to 1 plan.";
    return "Archived to avoid breaking existing plan data.";
  };

  const toggleMealType = (mealType: MealType) => {
    setForm((prev) => {
      const nextMealTypes = prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter((type) => type !== mealType)
        : [...prev.mealTypes, mealType];
      return {
        ...prev,
        mealTypes: nextMealTypes,
        mealType: nextMealTypes[0] ?? prev.mealType
      };
    });
  };

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

  const getApiMessage = (issue: unknown, fallback: string) =>
    issue && typeof issue === "object" && "data" in issue && issue.data && typeof issue.data === "object" && "message" in issue.data
      ? String((issue.data as { message?: string }).message ?? fallback)
      : fallback;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Meal name is required.");
      return;
    }
    if (form.mealTypes.length === 0) {
      setError("Select at least one meal type.");
      return;
    }
    setError("");
    setFeedback("");
    const payload: MealLibraryItem = {
      id: form.id || `meal-${Date.now()}`,
      name: form.name.trim(),
      mealType: form.mealTypes[0] ?? "Lunch",
      mealTypes: form.mealTypes,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      addOnOptions: form.addOnOptions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: form.status,
      image: form.image || undefined
    };
    try {
      await upsertMeal(payload).unwrap();
      setForm(initialForm);
      setFeedback(form.id ? "Meal updated successfully." : "Meal added successfully.");
    } catch (issue) {
      setError(getApiMessage(issue, "Failed to save meal."));
    }
  };

  const startEdit = (meal: MealLibraryItem) => {
    setError("");
    setFeedback("");
    setForm({
      id: meal.id,
      name: meal.name,
      mealType: meal.mealTypes?.[0] ?? meal.mealType,
      mealTypes: meal.mealTypes?.length ? meal.mealTypes : [meal.mealType],
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      tags: meal.tags.join(", "),
      addOnOptions: (meal.addOnOptions ?? []).join(", "),
      status: meal.status,
      image: meal.image ?? ""
    });
  };

  const removeMeal = async (meal: MealLibraryItem) => {
    setError("");
    setFeedback("");

    try {
      const response = await deleteMeal(meal.id).unwrap();
      if (form.id === meal.id) {
        setForm(initialForm);
      }
      setFeedback(
        response.message ??
          (meal.status === "inactive"
            ? "Meal removed successfully."
            : "Meal status updated successfully.")
      );
    } catch (issue) {
      setError(getApiMessage(issue, "Failed to remove meal."));
    }
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
        <p className="mt-1 text-sm text-zinc-300">
          Archived but still used in plans: <span className="font-semibold text-zinc-100">{archivedProtectedCount}</span>
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Removing a meal that is already used in plans will archive it automatically so existing plan data does not break.
        </p>
        {archivedProtectedCount > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            <p className="font-semibold">Some meals were not removed.</p>
            <p className="mt-1 text-amber-50/90">
              {archivedProtectedCount === 1
                ? "1 meal is still used in active or saved plans, so it was archived instead of deleted."
                : `${archivedProtectedCount} meals are still used in active or saved plans, so they were archived instead of deleted.`}
            </p>
            <p className="mt-1 text-amber-50/80">Those meals stay visible here as inactive to protect existing monthly plans.</p>
          </div>
        ) : null}
        <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Meal name"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            />
          </label>
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Types</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 p-2">
              {mealTypeOptions.map((mealType) => {
                const isSelected = form.mealTypes.includes(mealType);
                return (
                  <label
                    key={mealType}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? "border-amber-300 bg-amber-300/15 text-amber-100"
                        : "border-zinc-700 bg-zinc-950/40 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMealType(mealType)}
                      className="h-4 w-4 accent-amber-300"
                    />
                    {mealType}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500">Select every slot where this meal can be used.</p>
          </div>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Status</span>
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
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Tags</span>
            <input
              value={form.tags}
              onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="Tags (comma separated)"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1 md:col-span-3">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Extra Options</span>
            <input
              value={form.addOnOptions}
              onChange={(event) => setForm((prev) => ({ ...prev, addOnOptions: event.target.value }))}
              placeholder="Extra Chicken, Extra Potatoes"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Image Upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-900"
            />
          </label>
          <div className="md:col-span-3">
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/35 p-3">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt={form.name || "Meal preview"}
                  className="max-h-48 rounded-xl object-cover"
                />
              ) : (
                <p className="text-sm text-zinc-500">Uploaded image preview will appear here.</p>
              )}
            </div>
          </div>
          {error ? <p className="text-sm text-rose-300 md:col-span-3">{error}</p> : null}
          {feedback ? <p className="text-sm text-emerald-300 md:col-span-3">{feedback}</p> : null}
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
          {protectedMeals.length > 0 ? (
            <div className="mb-4 rounded-2xl border border-amber-300/25 bg-zinc-950/40 p-4">
              <p className="text-sm font-semibold text-amber-200">Archived meals protected from deletion</p>
              <div className="mt-2 space-y-2">
                {protectedMeals.slice(0, 5).map((meal) => (
                  <p key={meal.id} className="text-sm text-zinc-200">
                    <span className="font-medium text-white">{meal.name}:</span> {getProtectedMealMessage(meal)}
                  </p>
                ))}
                {protectedMeals.length > 5 ? (
                  <p className="text-xs text-zinc-400">Showing 5 of {protectedMeals.length} protected meals.</p>
                ) : null}
              </div>
            </div>
          ) : null}
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Meal</th>
                <th className="pb-2 pr-4 font-medium">Image</th>
                <th className="pb-2 pr-4 font-medium">Types</th>
                <th className="pb-2 pr-4 font-medium">Macros</th>
                <th className="pb-2 pr-4 font-medium">Tags</th>
                <th className="pb-2 pr-4 font-medium">Extras</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal) => (
                <tr key={meal.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">
                    <div className="space-y-1">
                      <p>{meal.name}</p>
                      {meal.status === "inactive" && (meal.archiveReason || (meal.archivedPlanCount ?? 0) > 0) ? (
                        <p className="max-w-xs text-xs text-amber-200">
                          Not removed: {getProtectedMealMessage(meal)}
                          {(meal.archivedPlanCount ?? 0) > 0
                            ? ` Existing plans using this meal: ${meal.archivedPlanCount}.`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {meal.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-zinc-500">No image</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    <div className="flex flex-wrap gap-1.5">
                      {(meal.mealTypes?.length ? meal.mealTypes : [meal.mealType]).map((mealType) => (
                        <span
                          key={`${meal.id}-${mealType}`}
                          className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-xs text-amber-100"
                        >
                          {mealType}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    kcal:{meal.calories} P:{meal.protein} C:{meal.carbs} F:{meal.fat}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{meal.tags.join(", ") || "-"}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{meal.addOnOptions?.join(", ") || "-"}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <div className="space-y-1">
                      <span>{meal.status}</span>
                      {meal.status === "inactive" && (meal.archiveReason || (meal.archivedPlanCount ?? 0) > 0) ? (
                        <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-200">
                          Protected from deletion
                        </span>
                      ) : null}
                    </div>
                  </td>
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
                        onClick={() => void removeMeal(meal)}
                        disabled={isDeleting}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-60"
                      >
                        {meal.status === "inactive" ? "Remove" : "Archive / Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!meals.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={8}>
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

