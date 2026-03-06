"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  useCreateIngredientMutation,
  useCreateMonthlyPlanMutation,
  useDeleteIngredientMutation,
  useDeleteMonthlyPlanMutation,
  useGetIngredientsQuery,
  useGetMonthlyPlansQuery,
  useGetPlanFlowsQuery,
  useUpdateIngredientMutation,
  useUpdateMonthlyPlanMutation,
  useUpdatePlanFlowMutation
} from "@/redux/api/adminApi";

type PlanItem = {
  _id?: string;
  id?: string;
  planId: string;
  name: string;
  basePrice: string;
  members: number;
  status: string;
  description?: string;
  isNew?: boolean;
  imageUrl?: string;
};

type FlowItem = {
  step: string;
  title: string;
};

type IngredientItem = {
  _id?: string;
  id?: string;
  ingredientId: string;
  category: string;
  item: string;
  quantityLabel: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

const fallbackIngredientCategories = ["Protein", "Carb", "Legume", "Fruit"];

function getPlanDocId(plan: PlanItem) {
  return String(plan.id ?? plan._id ?? "");
}

function getIngredientDocId(ingredient: IngredientItem) {
  return String(ingredient.id ?? ingredient._id ?? "");
}

function toStepItems(steps: FlowItem[]) {
  return steps.map((step, index) => ({ ...step, step: `Step ${index + 1}` }));
}

function getDefaultSelection(items: IngredientItem[], categories: string[]) {
  return categories.reduce<Record<string, string>>((acc, category) => {
    const firstInCategory = items.find((item) => item.category === category);
    acc[category] = firstInCategory ? getIngredientDocId(firstInCategory) : "";
    return acc;
  }, {});
}

export default function MonthlyPlansPage() {
  const { data: plansData, isLoading: isPlansLoading, isError: isPlansError } = useGetMonthlyPlansQuery();
  const { data: ingredientsData, isLoading: isIngredientsLoading, isError: isIngredientsError } = useGetIngredientsQuery();
  const { data: flowData } = useGetPlanFlowsQuery();

  const [createMonthlyPlan, { isLoading: isCreatingPlan }] = useCreateMonthlyPlanMutation();
  const [updateMonthlyPlan, { isLoading: isUpdatingPlan }] = useUpdateMonthlyPlanMutation();
  const [deleteMonthlyPlan, { isLoading: isDeletingPlan }] = useDeleteMonthlyPlanMutation();

  const [createIngredient, { isLoading: isCreatingIngredient }] = useCreateIngredientMutation();
  const [updateIngredient, { isLoading: isUpdatingIngredient }] = useUpdateIngredientMutation();
  const [deleteIngredient, { isLoading: isDeletingIngredient }] = useDeleteIngredientMutation();

  const [updatePlanFlow] = useUpdatePlanFlowMutation();

  const [customFlowSteps, setCustomFlowSteps] = useState<FlowItem[]>([]);
  const [presetFlowSteps, setPresetFlowSteps] = useState<FlowItem[]>([]);
  const [activeFlowType, setActiveFlowType] = useState<"custom" | "preset">("custom");
  const [newFlowTitle, setNewFlowTitle] = useState("");
  const [flowError, setFlowError] = useState("");

  const [mealSelection, setMealSelection] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ingredientEditingId, setIngredientEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [ingredientError, setIngredientError] = useState("");

  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const plans = useMemo<PlanItem[]>(() => {
    return (plansData?.data ?? []).map((plan: any) => ({
      _id: plan._id,
      id: plan.id,
      planId: plan.planId ?? "",
      name: plan.name ?? "",
      basePrice: plan.basePrice ?? "",
      members: Number(plan.members ?? 0),
      status: plan.status ?? "Active",
      description: plan.description ?? "",
      isNew: Boolean(plan.isNew),
      imageUrl: plan.imageUrl ?? ""
    }));
  }, [plansData]);

  const ingredients = useMemo<IngredientItem[]>(() => {
    return (ingredientsData?.data ?? []).map((item: any) => ({
      _id: item._id,
      id: item.id,
      ingredientId: item.ingredientId ?? "",
      category: item.category ?? "",
      item: item.item ?? "",
      quantityLabel: item.quantityLabel ?? "",
      kcal: Number(item.kcal ?? 0),
      protein: Number(item.protein ?? 0),
      carbs: Number(item.carbs ?? 0),
      fat: Number(item.fat ?? 0)
    }));
  }, [ingredientsData]);

  const ingredientCategories = useMemo(() => {
    const source = [...fallbackIngredientCategories, ...ingredients.map((item) => item.category).filter(Boolean)];
    return Array.from(new Set(source));
  }, [ingredients]);

  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    members: "",
    description: "",
    isNew: false,
    imageUrl: ""
  });

  const [ingredientForm, setIngredientForm] = useState({
    category: fallbackIngredientCategories[0],
    item: "",
    quantityLabel: "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: ""
  });

  useEffect(() => {
    if (!flowData?.data) return;

    const custom = flowData.data.find((row: any) => row.flowType === "custom");
    const preset = flowData.data.find((row: any) => row.flowType === "preset");

    setCustomFlowSteps(custom?.steps?.length ? toStepItems(custom.steps) : []);
    setPresetFlowSteps(preset?.steps?.length ? toStepItems(preset.steps) : []);
  }, [flowData]);

  useEffect(() => {
    if (!ingredientCategories.length) return;

    setIngredientForm((prev) => {
      if (ingredientCategories.includes(prev.category)) return prev;
      return { ...prev, category: ingredientCategories[0] };
    });

    setMealSelection((prev) => {
      const next = { ...prev };

      ingredientCategories.forEach((category) => {
        const selectedId = next[category];
        const stillExists = ingredients.some((item) => item.category === category && getIngredientDocId(item) === selectedId);
        if (!selectedId || !stillExists) {
          const first = ingredients.find((item) => item.category === category);
          next[category] = first ? getIngredientDocId(first) : "";
        }
      });

      Object.keys(next).forEach((key) => {
        if (!ingredientCategories.includes(key)) {
          delete next[key];
        }
      });

      return next;
    });
  }, [ingredientCategories, ingredients]);

  const resetForm = () => {
    setForm({
      name: "",
      basePrice: "",
      members: "",
      description: "",
      isNew: false,
      imageUrl: ""
    });
    setEditingId(null);
    setSubmitError("");
  };

  const resetIngredientForm = () => {
    setIngredientForm({
      category: ingredientCategories[0] ?? fallbackIngredientCategories[0],
      item: "",
      quantityLabel: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: ""
    });
    setIngredientEditingId(null);
    setIngredientError("");
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.name.trim() || !form.basePrice.trim()) return;

    const currentPlanId = editingId
      ? plans.find((plan) => getPlanDocId(plan) === editingId)?.planId ?? `PLAN-${Date.now()}`
      : `PLAN-${Date.now()}`;

    const payload = {
      planId: currentPlanId,
      name: form.name.trim(),
      basePrice: form.basePrice.trim(),
      members: Number(form.members) || 0,
      status: "Active",
      isNew: form.isNew,
      description: form.description.trim() || "No description added yet.",
      imageUrl: form.imageUrl || ""
    };

    try {
      if (editingId) {
        await updateMonthlyPlan({ id: editingId, body: payload }).unwrap();
      } else {
        await createMonthlyPlan(payload).unwrap();
      }
      resetForm();
    } catch {
      setSubmitError("Failed to save monthly plan.");
    }
  };

  const handleSubmitIngredient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIngredientError("");

    if (!ingredientForm.item.trim() || !ingredientForm.quantityLabel.trim()) return;

    const currentIngredientId = ingredientEditingId
      ? ingredients.find((item) => getIngredientDocId(item) === ingredientEditingId)?.ingredientId ?? `${ingredientForm.category.toUpperCase()}-${Date.now()}`
      : `${ingredientForm.category.toUpperCase()}-${ingredientForm.item.trim().replace(/\s+/g, "-").toUpperCase()}-${Date.now()}`;

    const payload = {
      ingredientId: currentIngredientId,
      category: ingredientForm.category,
      item: ingredientForm.item.trim(),
      quantityLabel: ingredientForm.quantityLabel.trim(),
      kcal: Number(ingredientForm.kcal) || 0,
      protein: Number(ingredientForm.protein) || 0,
      carbs: Number(ingredientForm.carbs) || 0,
      fat: Number(ingredientForm.fat) || 0
    };

    try {
      if (ingredientEditingId) {
        await updateIngredient({ id: ingredientEditingId, body: payload }).unwrap();
      } else {
        await createIngredient(payload).unwrap();
      }
      resetIngredientForm();
    } catch {
      setIngredientError("Failed to save ingredient.");
    }
  };

  const startEditPlan = (plan: PlanItem) => {
    const id = getPlanDocId(plan);
    if (!id) return;

    setEditingId(id);
    setForm({
      name: plan.name,
      basePrice: plan.basePrice,
      members: String(plan.members),
      description: plan.description ?? "",
      isNew: Boolean(plan.isNew),
      imageUrl: plan.imageUrl ?? ""
    });

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const startEditIngredient = (item: IngredientItem) => {
    const id = getIngredientDocId(item);
    if (!id) return;

    setIngredientEditingId(id);
    setIngredientForm({
      category: item.category,
      item: item.item,
      quantityLabel: item.quantityLabel,
      kcal: String(item.kcal),
      protein: String(item.protein),
      carbs: String(item.carbs),
      fat: String(item.fat)
    });
  };

  const removePlan = async (id: string) => {
    try {
      await deleteMonthlyPlan(id).unwrap();
      if (editingId === id) resetForm();
    } catch {
      setSubmitError("Failed to delete plan.");
    }
  };

  const removeIngredient = async (id: string) => {
    const removed = ingredients.find((item) => getIngredientDocId(item) === id);

    try {
      await deleteIngredient(id).unwrap();
      if (!removed) return;

      setMealSelection((prev) => {
        const next = { ...prev };
        if (next[removed.category] === id) {
          next[removed.category] = "";
        }
        return next;
      });

      if (ingredientEditingId === id) {
        resetIngredientForm();
      }
    } catch {
      setIngredientError("Failed to delete ingredient.");
    }
  };

  const persistFlow = async (flowType: "custom" | "preset", steps: FlowItem[]) => {
    try {
      setFlowError("");
      await updatePlanFlow({ flowType, body: { steps } }).unwrap();
    } catch {
      setFlowError("Failed to save flow changes.");
    }
  };

  const handleAddFlowStep = async () => {
    if (!newFlowTitle.trim()) return;

    const appendStep = (previous: FlowItem[]) =>
      toStepItems([
        ...previous,
        {
          step: "",
          title: newFlowTitle.trim()
        }
      ]);

    if (activeFlowType === "custom") {
      const next = appendStep(customFlowSteps);
      setCustomFlowSteps(next);
      await persistFlow("custom", next);
    } else {
      const next = appendStep(presetFlowSteps);
      setPresetFlowSteps(next);
      await persistFlow("preset", next);
    }

    setNewFlowTitle("");
  };

  const removeFlowStep = async (targetStep: string, flowType: "custom" | "preset") => {
    const remove = (items: FlowItem[]) => toStepItems(items.filter((item) => item.step !== targetStep));

    if (flowType === "custom") {
      const next = remove(customFlowSteps);
      setCustomFlowSteps(next);
      await persistFlow("custom", next);
      return;
    }

    const next = remove(presetFlowSteps);
    setPresetFlowSteps(next);
    await persistFlow("preset", next);
  };

  const groupedIngredients = useMemo(() => {
    return ingredientCategories.map((category) => ({
      category,
      items: ingredients.filter((item) => item.category === category)
    }));
  }, [ingredientCategories, ingredients]);

  const builderTotals = useMemo(() => {
    const selected = ingredientCategories
      .map((category) => ingredients.find((item) => getIngredientDocId(item) === mealSelection[category]))
      .filter((item): item is IngredientItem => Boolean(item));

    return selected.reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.kcal,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredientCategories, ingredients, mealSelection]);

  const activeFlow = activeFlowType === "custom" ? customFlowSteps : presetFlowSteps;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Subscriptions</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Monthly Plans</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage plan cards, custom vs preset setup flows, and custom meal macro options.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Monthly Plan" : "Add Monthly Plan"}</h3>
        <p className="mt-2 text-sm text-zinc-300">Create, image upload, edit, and delete plan cards.</p>
        <form onSubmit={handleSubmitPlan} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Plan name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="text"
            placeholder="Price (e.g. $209/mo)"
            value={form.basePrice}
            onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="number"
            placeholder="Active members"
            value={form.members}
            onChange={(event) => setForm((prev) => ({ ...prev, members: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            min={0}
          />
          <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(event) => setForm((prev) => ({ ...prev, isNew: event.target.checked }))}
              className="h-4 w-4 accent-amber-300"
            />
            Mark as NEW plan
          </label>
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <label htmlFor="plan-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Upload Plan Image
            </label>
            <input id="plan-image" type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900" />
          </div>
          <textarea
            placeholder="Plan description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="md:col-span-2 min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {form.imageUrl ? (
            <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={form.imageUrl} alt="Plan preview" width={1200} height={300} className="h-36 w-full object-cover" unoptimized />
            </div>
          ) : null}
          {submitError ? <p className="text-sm text-rose-300 md:col-span-2">{submitError}</p> : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isCreatingPlan || isUpdatingPlan}
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {editingId ? "Update Plan" : "Add Plan"}
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

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Plan Setup Flow Control</h3>
        <p className="mt-2 text-sm text-zinc-300">Keep custom plan and preset plan journeys separate and updated with front-office behavior.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFlowType("custom")}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              activeFlowType === "custom" ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-200"
            }`}
          >
            Custom Plan Flow
          </button>
          <button
            onClick={() => setActiveFlowType("preset")}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              activeFlowType === "preset" ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-200"
            }`}
          >
            Preset Plan Flow
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeFlow.map((item) => (
            <article key={`${activeFlowType}-${item.step}`} className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-200">{item.step}</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{item.title}</p>
              <button
                onClick={() => void removeFlowStep(item.step, activeFlowType)}
                className="mt-3 rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100"
              >
                Remove Step
              </button>
            </article>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newFlowTitle}
            onChange={(event) => setNewFlowTitle(event.target.value)}
            placeholder="Add new step title"
            className="min-w-72 flex-1 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <button
            onClick={() => void handleAddFlowStep()}
            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Add Step
          </button>
        </div>
        {flowError ? <p className="mt-3 text-sm text-rose-300">{flowError}</p> : null}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Custom Meal Macro Builder</h3>
        <p className="mt-2 text-sm text-zinc-300">Manage ingredient options by category and verify automatic macro totals for custom-made meals.</p>

        <form onSubmit={handleSubmitIngredient} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={ingredientForm.category}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            {ingredientCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Ingredient name"
            value={ingredientForm.item}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, item: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="text"
            placeholder="Quantity (e.g. 150g)"
            value={ingredientForm.quantityLabel}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, quantityLabel: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Kcal"
            value={ingredientForm.kcal}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, kcal: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Protein (g)"
            value={ingredientForm.protein}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, protein: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Carbs (g)"
            value={ingredientForm.carbs}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, carbs: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            placeholder="Fat (g)"
            value={ingredientForm.fat}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, fat: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <div className="flex items-center gap-2 xl:col-span-1">
            <button
              type="submit"
              disabled={isCreatingIngredient || isUpdatingIngredient}
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {ingredientEditingId ? "Update" : "Add"}
            </button>
            {ingredientEditingId ? (
              <button
                type="button"
                onClick={resetIngredientForm}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
          {ingredientError ? <p className="text-sm text-rose-300 xl:col-span-4">{ingredientError}</p> : null}
        </form>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {groupedIngredients.map((group) => (
            <article key={group.category} className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-200">{group.category}</p>
              <div className="mt-3 space-y-2">
                {group.items.length ? (
                  group.items.map((item) => {
                    const docId = getIngredientDocId(item);
                    return (
                      <div key={docId || item.ingredientId} className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
                        <p className="text-sm font-semibold text-zinc-100">{item.item} - {item.quantityLabel}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {item.kcal} kcal | P {item.protein}g | C {item.carbs}g | F {item.fat}g
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => startEditIngredient(item)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                            Edit
                          </button>
                          <button
                            onClick={() => docId && void removeIngredient(docId)}
                            disabled={!docId || isDeletingIngredient}
                            className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500">No options yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <article className="mt-5 rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
          <h4 className="text-base font-semibold text-white">Macro Auto-Calculation Preview</h4>
          <p className="mt-1 text-sm text-zinc-300">Select one source from each category to validate the total custom meal macros.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ingredientCategories.map((category) => (
              <div key={category}>
                <label className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">{category}</label>
                <select
                  value={mealSelection[category] ?? ""}
                  onChange={(event) => setMealSelection((prev) => ({ ...prev, [category]: event.target.value }))}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                >
                  <option value="">Not selected</option>
                  {ingredients
                    .filter((item) => item.category === category)
                    .map((item) => {
                      const docId = getIngredientDocId(item);
                      return (
                        <option key={docId || item.ingredientId} value={docId}>
                          {item.item} ({item.quantityLabel})
                        </option>
                      );
                    })}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
            <p className="text-sm font-medium text-amber-100">Total Meal Macros</p>
            <p className="mt-2 text-sm text-zinc-100">
              {builderTotals.kcal.toFixed(1)} kcal | Protein {builderTotals.protein.toFixed(1)}g | Carbs {builderTotals.carbs.toFixed(1)}g | Fat {builderTotals.fat.toFixed(1)}g
            </p>
          </div>
        </article>
      </section>

      {isPlansError || isIngredientsError ? <p className="text-sm text-rose-300">Failed to load some monthly-plan data.</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(isPlansLoading ? [] : plans).map((plan) => {
          const docId = getPlanDocId(plan);
          return (
            <article key={docId || plan.planId} className="admin-panel rounded-2xl p-5">
              {plan.imageUrl ? (
                <Image
                  src={plan.imageUrl}
                  alt={`${plan.name} plan`}
                  width={1000}
                  height={240}
                  className="mb-4 h-28 w-full rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-zinc-700/70 via-zinc-800/70 to-zinc-900/70" />
              )}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="flex items-center gap-2">
                  {plan.isNew ? <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-zinc-900">NEW</span> : null}
                  <StatusBadge label={plan.status} />
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{plan.description}</p>
              <p className="mt-4 text-2xl font-semibold text-zinc-100">{plan.basePrice}</p>
              <p className="mt-1 text-sm text-zinc-400">{plan.members} active members</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => startEditPlan(plan)}
                  className="rounded-xl bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
                >
                  Edit Plan
                </button>
                <button
                  onClick={() => docId && void removePlan(docId)}
                  disabled={!docId || isDeletingPlan}
                  className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3.5 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
