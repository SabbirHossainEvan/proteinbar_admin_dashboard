"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useForceDeleteMealLibraryAdminMutation,
  useGetMealLibraryAdminQuery,
  useUpsertMealLibraryAdminMutation,
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
  image: "",
};

export default function MealLibraryPage() {
  const { data, isLoading, isError } = useGetMealLibraryAdminQuery();
  const [upsertMeal, { isLoading: isSaving }] =
    useUpsertMealLibraryAdminMutation();
  const [forceDeleteMeal, { isLoading: isForceDeleting }] =
    useForceDeleteMealLibraryAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [mealPendingDelete, setMealPendingDelete] =
    useState<MealLibraryItem | null>(null);
  const editorRef = useRef<HTMLElement | null>(null);
  const mealNameInputRef = useRef<HTMLInputElement | null>(null);

  const meals = useMemo(() => data?.data ?? [], [data]);
  const activeCount = useMemo(
    () => meals.filter((meal) => meal.status === "active").length,
    [meals],
  );
  const toggleMealType = (mealType: MealType) => {
    setForm((prev) => {
      const nextMealTypes = prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter((type) => type !== mealType)
        : [...prev.mealTypes, mealType];
      return {
        ...prev,
        mealTypes: nextMealTypes,
        mealType: nextMealTypes[0] ?? prev.mealType,
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
    issue &&
    typeof issue === "object" &&
    "data" in issue &&
    issue.data &&
    typeof issue.data === "object" &&
    "message" in issue.data
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
      image: form.image || undefined,
    };
    try {
      await upsertMeal(payload).unwrap();
      setForm(initialForm);
      setFeedback(
        form.id ? "Meal updated successfully." : "Meal added successfully.",
      );
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
      image: meal.image ?? "",
    });
    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      mealNameInputRef.current?.focus({ preventScroll: true });
    }, 0);
  };

  const openDeleteModal = (meal: MealLibraryItem) => {
    setError("");
    setFeedback("");
    setMealPendingDelete(meal);
  };

  const closeDeleteModal = () => {
    if (isForceDeleting) return;
    setMealPendingDelete(null);
  };

  const confirmDeleteMeal = async () => {
    if (!mealPendingDelete) return;
    setError("");
    setFeedback("");

    try {
      const response = await forceDeleteMeal(mealPendingDelete.id).unwrap();
      if (form.id === mealPendingDelete.id) {
        setForm(initialForm);
      }
      setMealPendingDelete(null);
      setFeedback(response.message ?? "Meal deleted from all dependent areas.");
    } catch (issue) {
      setError(getApiMessage(issue, "Failed to delete meal."));
    }
  };

  return (
    <section className="space-y-6 sm:space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
          Meal Catalog
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
          Meal Library
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          Manage meals that can be assigned by week/date and meal type in
          monthly plans.
        </p>
      </div>

      <section ref={editorRef} className="admin-panel scroll-mt-24 rounded-3xl p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-amber-200">
              Meal editor
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              {form.id ? "Update meal details" : "Create a meal library item"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Add the meal once, choose every meal type it supports, and reuse
              it across monthly plans. Deleting a meal removes it from every
              dependent monthly plan after confirmation.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-[340px]">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-3 sm:p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                Active meals
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">
                {activeCount}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-3 sm:p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                Total meals
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {meals.length}
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={save}
          className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:gap-5"
        >
          <div className="space-y-4 rounded-3xl border border-zinc-700/70 bg-zinc-950/35 p-3 sm:p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.2fr)_180px_minmax(280px,0.9fr)]">
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Meal Name
                </span>
                <input
                  ref={mealNameInputRef}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Chicken Burrito Bowl"
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as "active" | "inactive",
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>

              <div className="space-y-1.5 md:col-span-2 2xl:col-span-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Meal Types
                </span>
                <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-2">
                  {mealTypeOptions.map((mealType) => {
                    const isSelected = form.mealTypes.includes(mealType);
                    return (
                      <label
                        key={mealType}
                        className={`flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-center text-xs font-medium transition sm:flex-none ${
                          isSelected
                            ? "border-amber-300 bg-amber-300 text-zinc-950"
                            : "border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:border-amber-300/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMealType(mealType)}
                          className="sr-only"
                        />
                        {mealType}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Nutrition per serving
                </p>
                <p className="text-xs text-zinc-500">
                  kcal, protein, carbs, fat
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                <label className="space-y-1.5">
                  <span className="text-xs text-zinc-500">Calories</span>
                  <input
                    type="number"
                    min={0}
                    value={form.calories}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        calories: Number(event.target.value),
                      }))
                    }
                    placeholder="520"
                    className="h-11 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-zinc-500">Protein</span>
                  <input
                    type="number"
                    min={0}
                    value={form.protein}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        protein: Number(event.target.value),
                      }))
                    }
                    placeholder="38"
                    className="h-11 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-zinc-500">Carbs</span>
                  <input
                    type="number"
                    min={0}
                    value={form.carbs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        carbs: Number(event.target.value),
                      }))
                    }
                    placeholder="46"
                    className="h-11 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-zinc-500">Fat</span>
                  <input
                    type="number"
                    min={0}
                    value={form.fat}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        fat: Number(event.target.value),
                      }))
                    }
                    placeholder="18"
                    className="h-11 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Tags
                </span>
                <input
                  value={form.tags}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tags: event.target.value }))
                  }
                  placeholder="High protein, Balanced"
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Extra Options
                </span>
                <input
                  value={form.addOnOptions}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      addOnOptions: event.target.value,
                    }))
                  }
                  placeholder="Extra chicken, Extra potatoes"
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
            {feedback ? (
              <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {feedback}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? "Saving..." : form.id ? "Update Meal" : "Add Meal"}
              </button>
              {form.id ? (
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
                >
                  Cancel Edit
                </button>
              ) : null}
              <p className="text-xs text-zinc-500">
                Meals can be active in multiple slots, such as lunch and dinner.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-700/70 bg-zinc-950/35 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Meal image
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Upload or replace the preview image.
                </p>
              </div>
            </div>

            <label className="mt-4 block cursor-pointer overflow-hidden rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/70 transition hover:border-amber-300/70">
              <div className="flex min-h-48 items-center justify-center p-3 sm:min-h-60 xl:min-h-72">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt={form.name || "Meal preview"}
                    className="h-full max-h-56 w-full rounded-2xl object-cover sm:max-h-72 xl:max-h-80"
                  />
                ) : (
                  <div className="px-6 text-center">
                    <p className="text-sm font-medium text-zinc-200">
                      Drop in a meal photo
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Click to browse. A strong image helps admins identify the
                      meal quickly.
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>

            <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-amber-300/70 hover:text-amber-100">
              {form.image ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>
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
                    <p>{meal.name}</p>
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
                      {(meal.mealTypes?.length
                        ? meal.mealTypes
                        : [meal.mealType]
                      ).map((mealType) => (
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
                    kcal:{meal.calories} P:{meal.protein} C:{meal.carbs} F:
                    {meal.fat}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {meal.tags.join(", ") || "-"}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {meal.addOnOptions?.join(", ") || "-"}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <span>{meal.status}</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(meal)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(meal)}
                        disabled={isForceDeleting}
                        className="rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/25 disabled:opacity-60"
                      >
                        Delete
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

      {mealPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-red-400/30 bg-zinc-950 p-5 shadow-2xl shadow-black/40 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">
              Confirm delete
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              Delete {mealPendingDelete.name}?
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              This will permanently delete this meal from the Meal Library and
              remove it from every dependent monthly plan, assigned date, and
              meal selection source where it is used.
            </p>
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
              This action cannot be undone. Existing plans that used this meal
              will no longer include it.
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isForceDeleting}
                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteMeal()}
                disabled={isForceDeleting}
                className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                {isForceDeleting ? "Deleting..." : "OK, delete everywhere"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
