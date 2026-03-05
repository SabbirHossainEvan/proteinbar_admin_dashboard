"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import StatusBadge from "@/components/admin/StatusBadge";
import { customMealIngredients, customPlanFlow, monthlyPlans, presetPlanFlow } from "@/data/admin/mock";

type PlanItem = (typeof monthlyPlans)[number] & { imageUrl?: string };
type FlowItem = (typeof customPlanFlow)[number];
type IngredientItem = (typeof customMealIngredients)[number];
type IngredientCategory = IngredientItem["category"];

const ingredientCategories: IngredientCategory[] = ["Protein", "Carb", "Legume", "Fruit"];

const toStepItems = (steps: FlowItem[]) => steps.map((step, index) => ({ ...step, step: `Step ${index + 1}` }));

const getDefaultSelection = (items: IngredientItem[]) => {
  return ingredientCategories.reduce(
    (acc, category) => {
      const firstInCategory = items.find((item) => item.category === category);
      acc[category] = firstInCategory?.id ?? "";
      return acc;
    },
    {} as Record<IngredientCategory, string>,
  );
};

export default function MonthlyPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>(monthlyPlans);
  const [customFlowSteps, setCustomFlowSteps] = useState<FlowItem[]>(customPlanFlow);
  const [presetFlowSteps, setPresetFlowSteps] = useState<FlowItem[]>(presetPlanFlow);
  const [activeFlowType, setActiveFlowType] = useState<"custom" | "preset">("custom");
  const [newFlowTitle, setNewFlowTitle] = useState("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>(customMealIngredients);
  const [ingredientEditingId, setIngredientEditingId] = useState<string | null>(null);
  const [mealSelection, setMealSelection] = useState<Record<IngredientCategory, string>>(getDefaultSelection(customMealIngredients));
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    members: "",
    description: "",
    isNew: false,
    imageUrl: "",
  });

  const [ingredientForm, setIngredientForm] = useState({
    category: "Protein" as IngredientCategory,
    item: "",
    quantityLabel: "",
    kcal: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      basePrice: "",
      members: "",
      description: "",
      isNew: false,
      imageUrl: "",
    });
    setEditingId(null);
  };

  const resetIngredientForm = () => {
    setIngredientForm({
      category: "Protein",
      item: "",
      quantityLabel: "",
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
    });
    setIngredientEditingId(null);
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

  const handleSubmitPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.basePrice.trim()) {
      return;
    }

    if (editingId) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingId
            ? {
                ...plan,
                name: form.name.trim(),
                basePrice: form.basePrice.trim(),
                members: Number(form.members) || 0,
                description: form.description.trim() || "No description added yet.",
                isNew: form.isNew,
                imageUrl: form.imageUrl || undefined,
              }
            : plan,
        ),
      );
      resetForm();
      return;
    }

    const newPlan: PlanItem = {
      id: `PLAN-${Date.now()}`,
      name: form.name.trim(),
      basePrice: form.basePrice.trim(),
      members: Number(form.members) || 0,
      description: form.description.trim() || "No description added yet.",
      status: "Active",
      isNew: form.isNew,
      imageUrl: form.imageUrl || undefined,
    };

    setPlans((prev) => [newPlan, ...prev]);
    resetForm();
  };

  const handleSubmitIngredient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!ingredientForm.item.trim() || !ingredientForm.quantityLabel.trim()) {
      return;
    }

    const normalized: IngredientItem = {
      id:
        ingredientEditingId ??
        `${ingredientForm.category.toUpperCase()}-${ingredientForm.item.trim().replace(/\s+/g, "-").toUpperCase()}-${Date.now()}`,
      category: ingredientForm.category,
      item: ingredientForm.item.trim(),
      quantityLabel: ingredientForm.quantityLabel.trim(),
      kcal: Number(ingredientForm.kcal) || 0,
      protein: Number(ingredientForm.protein) || 0,
      carbs: Number(ingredientForm.carbs) || 0,
      fat: Number(ingredientForm.fat) || 0,
    };

    if (ingredientEditingId) {
      setIngredients((prev) => prev.map((item) => (item.id === ingredientEditingId ? normalized : item)));
      resetIngredientForm();
      return;
    }

    setIngredients((prev) => [normalized, ...prev]);
    setMealSelection((prev) => {
      if (prev[normalized.category]) return prev;
      return { ...prev, [normalized.category]: normalized.id };
    });
    resetIngredientForm();
  };

  const startEditPlan = (plan: PlanItem) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      basePrice: plan.basePrice,
      members: String(plan.members),
      description: plan.description ?? "",
      isNew: Boolean(plan.isNew),
      imageUrl: plan.imageUrl ?? "",
    });

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const startEditIngredient = (item: IngredientItem) => {
    setIngredientEditingId(item.id);
    setIngredientForm({
      category: item.category,
      item: item.item,
      quantityLabel: item.quantityLabel,
      kcal: String(item.kcal),
      protein: String(item.protein),
      carbs: String(item.carbs),
      fat: String(item.fat),
    });
  };

  const deletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    if (editingId === planId) {
      resetForm();
    }
  };

  const deleteIngredient = (ingredientId: string) => {
    const removed = ingredients.find((item) => item.id === ingredientId);
    setIngredients((prev) => prev.filter((item) => item.id !== ingredientId));

    if (!removed) return;

    setMealSelection((prev) => {
      const next = { ...prev };
      if (next[removed.category] === ingredientId) {
        const replacement = ingredients.find((item) => item.id !== ingredientId && item.category === removed.category);
        next[removed.category] = replacement?.id ?? "";
      }
      return next;
    });

    if (ingredientEditingId === ingredientId) {
      resetIngredientForm();
    }
  };

  const handleAddFlowStep = () => {
    if (!newFlowTitle.trim()) return;

    const appendStep = (previous: FlowItem[]) =>
      toStepItems([
        ...previous,
        {
          step: "",
          title: newFlowTitle.trim(),
        },
      ]);

    if (activeFlowType === "custom") {
      setCustomFlowSteps((prev) => appendStep(prev));
    } else {
      setPresetFlowSteps((prev) => appendStep(prev));
    }

    setNewFlowTitle("");
  };

  const removeFlowStep = (targetStep: string, flowType: "custom" | "preset") => {
    const remove = (items: FlowItem[]) => toStepItems(items.filter((item) => item.step !== targetStep));

    if (flowType === "custom") {
      setCustomFlowSteps((prev) => remove(prev));
      return;
    }

    setPresetFlowSteps((prev) => remove(prev));
  };

  const groupedIngredients = useMemo(() => {
    return ingredientCategories.map((category) => ({
      category,
      items: ingredients.filter((item) => item.category === category),
    }));
  }, [ingredients]);

  const builderTotals = useMemo(() => {
    const selected = ingredientCategories
      .map((category) => ingredients.find((item) => item.id === mealSelection[category]))
      .filter((item): item is IngredientItem => Boolean(item));

    return selected.reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.kcal,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [ingredients, mealSelection]);

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
        <p className="mt-2 text-sm text-zinc-300">Create, image upload, edit, and delete plan cards (frontend-only).</p>
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
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
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
                onClick={() => removeFlowStep(item.step, activeFlowType)}
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
            onClick={handleAddFlowStep}
            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Add Step
          </button>
        </div>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Custom Meal Macro Builder</h3>
        <p className="mt-2 text-sm text-zinc-300">Manage ingredient options by category and verify automatic macro totals for custom-made meals.</p>

        <form onSubmit={handleSubmitIngredient} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={ingredientForm.category}
            onChange={(event) => setIngredientForm((prev) => ({ ...prev, category: event.target.value as IngredientCategory }))}
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
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
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
        </form>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {groupedIngredients.map((group) => (
            <article key={group.category} className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-200">{group.category}</p>
              <div className="mt-3 space-y-2">
                {group.items.length ? (
                  group.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
                      <p className="text-sm font-semibold text-zinc-100">{item.item} - {item.quantityLabel}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {item.kcal} kcal | P {item.protein}g | C {item.carbs}g | F {item.fat}g
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => startEditIngredient(item)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                          Edit
                        </button>
                        <button onClick={() => deleteIngredient(item.id)} className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
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
                  value={mealSelection[category]}
                  onChange={(event) => setMealSelection((prev) => ({ ...prev, [category]: event.target.value }))}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                >
                  <option value="">Not selected</option>
                  {ingredients
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item} ({item.quantityLabel})
                      </option>
                    ))}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="admin-panel rounded-2xl p-5">
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
                onClick={() => deletePlan(plan.id)}
                className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3.5 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
