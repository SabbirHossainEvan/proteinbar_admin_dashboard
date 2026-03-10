"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteMealLibraryAdminMutation,
  useGetMealLibraryAdminQuery,
  useUpsertMealLibraryAdminMutation,
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
  status: "active" as "active" | "inactive",
  image: "",
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read image file."));
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function toErrorMessage(error: unknown) {
  const fallback = "Failed to save meal.";

  if (!error || typeof error !== "object") {
    return fallback;
  }

  if ("data" in error && error.data && typeof error.data === "object") {
    const data = error.data as { message?: unknown };
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return fallback;
}

export default function MealLibraryPage() {
  const { data, isLoading, isError } = useGetMealLibraryAdminQuery();
  const [upsertMeal, { isLoading: isSaving }] =
    useUpsertMealLibraryAdminMutation();
  const [deleteMeal, { isLoading: isDeleting }] =
    useDeleteMealLibraryAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [error, setError] = useState("");

  const meals = data?.data ?? [];
  const activeCount = useMemo(
    () => meals.filter((meal) => meal.status === "active").length,
    [meals],
  );

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Meal name is required.");
      return;
    }

    try {
      setError("");
      const image =
        imageFile !== null ? await fileToDataUrl(imageFile) : form.image;
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
        status: form.status,
        image,
      };

      await upsertMeal(payload).unwrap();
      setForm(initialForm);
      setImageFile(null);
    } catch (saveError) {
      setError(toErrorMessage(saveError));
    }
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
      status: meal.status,
      image: meal.image ?? "",
    });
    setImageFile(null);
    setError("");
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
          Meal Catalog
        </p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Meal Library</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Manage meals that can be assigned by week/date and meal type in
          monthly plans.
        </p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <p className="text-sm text-zinc-300">
          Active meals:{" "}
          <span className="font-semibold text-amber-200">{activeCount}</span>
        </p>
        <form onSubmit={save} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Meal Name (customer list-e dekhabe)
            </span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Meal name"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Meal Type (Breakfast/Lunch/Dinner/Snack)
            </span>
            <select
              value={form.mealType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  mealType: event.target.value as MealType,
                }))
              }
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Status (Active hole assign করা যাবে)
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as "active" | "inactive",
                }))
              }
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Calories (kcal per serving)
            </span>
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
              placeholder="Calories"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Protein (gram)
            </span>
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
              placeholder="Protein"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Carbs (gram)
            </span>
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
              placeholder="Carbs"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Fat (gram)
            </span>
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
              placeholder="Fat"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Tags (filter/badge er jonno, comma separated)
            </span>
            <input
              value={form.tags}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tags: event.target.value }))
              }
              placeholder="Tags (comma separated)"
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1 md:col-span-3">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              Meal Image
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  setImageFile(null);
                  return;
                }

                if (!file.type.startsWith("image/")) {
                  setError("Please choose a valid image file.");
                  return;
                }

                if (file.size > 5 * 1024 * 1024) {
                  setError("Image must be 5MB or less.");
                  return;
                }

                setError("");
                setImageFile(file);
              }}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-1.5 file:text-xs file:text-zinc-100 focus:border-amber-300"
            />
            <p className="text-xs text-zinc-400">JPG/PNG/WEBP/GIF, max 5MB.</p>
            {imagePreviewUrl || form.image ? (
              <div className="flex items-start gap-3">
                <img
                  src={imagePreviewUrl || form.image}
                  alt={form.name || "Meal image preview"}
                  className="h-20 w-20 rounded-lg border border-zinc-600 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setForm((prev) => ({ ...prev, image: "" }));
                  }}
                  className="rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs text-zinc-100"
                >
                  Remove Image
                </button>
              </div>
            ) : null}
          </label>
          {error ? (
            <p className="text-sm text-rose-300 md:col-span-3">{error}</p>
          ) : null}
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
                onClick={() => {
                  setForm(initialForm);
                  setImageFile(null);
                  setError("");
                }}
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
                <th className="pb-2 pr-4 font-medium">Image</th>
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
                    {meal.image ? (
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="h-12 w-12 rounded-lg border border-zinc-600 object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    kcal:{meal.calories} P:{meal.protein} C:{meal.carbs} F:
                    {meal.fat}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {meal.tags.join(", ") || "-"}
                  </td>
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
                  <td className="py-3.5 text-zinc-400" colSpan={7}>
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
