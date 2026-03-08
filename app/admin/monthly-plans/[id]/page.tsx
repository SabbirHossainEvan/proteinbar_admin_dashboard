"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetMealLibraryAdminQuery,
  useGetMonthlyPlanDetailsQuery,
  useUpsertMonthlyPlanDetailsMutation
} from "@/redux/api/adminApi";
import type { MonthlyPlanDetailsPayload } from "@/redux/monthlyPlans/mockAdapter";
import type { MealType, WeekAssignment } from "@/redux/monthlyPlans/types";

type TabKey = "general" | "rules" | "assignment" | "pricing" | "content";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "general", label: "General" },
  { key: "rules", label: "Set Plan Rules" },
  { key: "assignment", label: "Weekly Meal Assignment" },
  { key: "pricing", label: "Pricing" },
  { key: "content", label: "Content" }
];

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

const createEmptyWeek = (planId: string, weekIndex: number, startDate: string): WeekAssignment => {
  const start = new Date(`${startDate}T00:00:00`);
  const mealsByDate: WeekAssignment["mealsByDate"] = {};
  for (let i = 0; i < 6; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    mealsByDate[date.toISOString().slice(0, 10)] = [];
  }
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + 5);

  return {
    id: `wa-${planId}-${weekIndex}-${Date.now()}`,
    planId,
    weekIndex,
    startDate: startDate,
    endDate: endDate.toISOString().slice(0, 10),
    mealsByDate
  };
};

export default function MonthlyPlanDetailEditorPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [draft, setDraft] = useState<MonthlyPlanDetailsPayload | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newAssignment, setNewAssignment] = useState<{ mealType: MealType; mealId: string; badges: string }>({
    mealType: "Lunch",
    mealId: "",
    badges: ""
  });
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const { data, isLoading, isError } = useGetMonthlyPlanDetailsQuery(planId);
  const { data: mealsData } = useGetMealLibraryAdminQuery();
  const [upsertPlanDetails, { isLoading: isSaving }] = useUpsertMonthlyPlanDetailsMutation();

  useEffect(() => {
    const details = data?.data;
    if (!details) return;
    setDraft(structuredClone(details));
  }, [data]);

  useEffect(() => {
    if (!draft) return;
    if (!draft.weekAssignments.length) return;
    if (!selectedWeekId || !draft.weekAssignments.some((week) => week.id === selectedWeekId)) {
      setSelectedWeekId(draft.weekAssignments[0].id);
    }
  }, [draft, selectedWeekId]);

  useEffect(() => {
    if (!draft || !selectedWeekId) return;
    const week = draft.weekAssignments.find((item) => item.id === selectedWeekId);
    if (!week) return;
    const dates = Object.keys(week.mealsByDate);
    if (!dates.length) return;
    if (!selectedDate || !week.mealsByDate[selectedDate]) {
      setSelectedDate(dates[0]);
    }
  }, [draft, selectedWeekId, selectedDate]);

  const selectedWeek = useMemo(
    () => draft?.weekAssignments.find((week) => week.id === selectedWeekId) ?? null,
    [draft, selectedWeekId]
  );

  const meals = mealsData?.data ?? [];
  const selectableMeals = useMemo(
    () => meals.filter((meal) => meal.status === "active" && meal.mealType === newAssignment.mealType),
    [meals, newAssignment.mealType]
  );

  const selectedMealsOnDate = selectedWeek && selectedDate ? selectedWeek.mealsByDate[selectedDate] ?? [] : [];

  const validate = (payload: MonthlyPlanDetailsPayload) => {
    if (!payload.plan.title.trim()) return "Title is required.";
    if (!payload.plan.description.trim()) return "Description is required.";
    if (payload.plan.planKind === "custom" && payload.rules.planTypeOptions.length === 0) {
      return "Custom plans require at least one planType option.";
    }
    if (payload.rules.allowedMealsPerDay.length === 0 || payload.rules.allowedDays.length === 0) {
      return "Rules must include meals/day and days options.";
    }
    return "";
  };

  const saveAll = async () => {
    if (!draft) return;
    setSaveMessage("");
    const errorText = validate(draft);
    if (errorText) {
      setSaveError(errorText);
      return;
    }
    setSaveError("");
    await upsertPlanDetails(draft).unwrap();
    setSaveMessage("Saved.");
  };

  const handlePlanImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, image: result } } : prev));
    };
    reader.readAsDataURL(file);
  };

  const addWeek = () => {
    if (!draft) return;
    const nextWeekIndex = draft.weekAssignments.length + 1;
    const fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() + nextWeekIndex * 7);
    const startDate = fallbackStart.toISOString().slice(0, 10);
    const week = createEmptyWeek(draft.plan.id, nextWeekIndex, startDate);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: [...prev.weekAssignments, week],
            plan: { ...prev.plan, weekAssignmentIds: [...prev.plan.weekAssignmentIds, week.id] }
          }
        : prev
    );
    setSelectedWeekId(week.id);
  };

  const addMealToDate = () => {
    if (!draft || !selectedWeek || !selectedDate || !newAssignment.mealId) return;
    const selectedMeal = meals.find((meal) => meal.id === newAssignment.mealId);
    if (!selectedMeal) return;

    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekAssignments: prev.weekAssignments.map((week) => {
          if (week.id !== selectedWeek.id) return week;
          const current = week.mealsByDate[selectedDate] ?? [];
          return {
            ...week,
            mealsByDate: {
              ...week.mealsByDate,
              [selectedDate]: [
                ...current,
                {
                  id: `assigned-${Date.now()}`,
                  mealId: selectedMeal.id,
                  mealName: selectedMeal.name,
                  mealType: newAssignment.mealType,
                  date: selectedDate,
                  badges: newAssignment.badges
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                }
              ]
            }
          };
        })
      };
    });
    setNewAssignment((prev) => ({ ...prev, mealId: "", badges: "" }));
  };

  const removeAssignedMeal = (mealId: string) => {
    if (!selectedWeek || !selectedDate) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weekAssignments: prev.weekAssignments.map((week) => {
          if (week.id !== selectedWeek.id) return week;
          return {
            ...week,
            mealsByDate: {
              ...week.mealsByDate,
              [selectedDate]: (week.mealsByDate[selectedDate] ?? []).filter((item) => item.id !== mealId)
            }
          };
        })
      };
    });
  };

  if (isLoading || !draft) return <LoadingState label="Loading monthly plan details..." />;
  if (isError || !data?.data) return <ErrorState label="Failed to load monthly plan detail." />;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Plan Editor</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">{draft.plan.title}</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Edit every dynamic config that powers `/[planKind]/[planId]/set-plan`, `/select-meals`, and `/checkout`.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              activeTab === tab.key ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="admin-panel rounded-2xl p-5">
        {activeTab === "general" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={draft.plan.title}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, title: event.target.value } } : prev))}
              placeholder="Title"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <input
              value={draft.plan.badge ?? ""}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, badge: event.target.value } } : prev))}
              placeholder="Badge"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <select
              value={draft.plan.status}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, plan: { ...prev.plan, status: event.target.value as typeof prev.plan.status } } : prev
                )
              }
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={draft.plan.planKind}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, plan: { ...prev.plan, planKind: event.target.value as typeof prev.plan.planKind } } : prev
                )
              }
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="custom">custom</option>
              <option value="normal">normal</option>
            </select>
            <input
              value={draft.plan.image}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, image: event.target.value } } : prev))}
              placeholder="Image URL"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 md:col-span-2"
            />
            <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-200 md:col-span-2">
              <label htmlFor="plan-image-upload" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
                Upload Plan Image
              </label>
              <input
                id="plan-image-upload"
                type="file"
                accept="image/*"
                onChange={handlePlanImageUpload}
                className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900"
              />
            </div>
            {draft.plan.image ? (
              <div className="overflow-hidden rounded-xl border border-zinc-700 md:col-span-2">
                <img src={draft.plan.image} alt="Plan preview" className="h-40 w-full object-cover" />
              </div>
            ) : null}
            <textarea
              value={draft.plan.description}
              onChange={(event) =>
                setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, description: event.target.value } } : prev))
              }
              placeholder="Description"
              className="min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 md:col-span-2"
            />
          </div>
        ) : null}

        {activeTab === "rules" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Allowed Meals/Day</span>
              <input
                value={draft.rules.allowedMealsPerDay.join(",")}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            allowedMealsPerDay: event.target.value
                              .split(",")
                              .map((v) => Number(v.trim()))
                              .filter((v) => Number.isFinite(v) && v > 0)
                          }
                        }
                      : prev
                  )
                }
                placeholder="1,2,3,4"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Allowed Days</span>
              <input
                value={draft.rules.allowedDays.join(",")}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            allowedDays: event.target.value
                              .split(",")
                              .map((v) => Number(v.trim()))
                              .filter((v) => Number.isFinite(v) && v > 0)
                          }
                        }
                      : prev
                  )
                }
                placeholder="3,4,5,6"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Allowed Snacks</span>
              <input
                value={draft.rules.allowedSnacks.join(",")}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            allowedSnacks: event.target.value
                              .split(",")
                              .map((v) => Number(v.trim()))
                              .filter((v) => Number.isFinite(v) && v >= 0)
                          }
                        }
                      : prev
                  )
                }
                placeholder="0,1,2"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan Type Options (Custom)</span>
              <input
                value={draft.rules.planTypeOptions.join(",")}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            planTypeOptions: event.target.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean)
                          }
                        }
                      : prev
                  )
                }
                placeholder="lose-weight,gain-weight,maintenance"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Meals</span>
              <input
                value={draft.rules.defaults.meals}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, rules: { ...prev.rules, defaults: { ...prev.rules.defaults, meals: Number(event.target.value) } } } : prev
                  )
                }
                type="number"
                min={1}
                placeholder="3"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Days</span>
              <input
                value={draft.rules.defaults.days}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev ? { ...prev, rules: { ...prev.rules, defaults: { ...prev.rules.defaults, days: Number(event.target.value) } } } : prev
                  )
                }
                type="number"
                min={1}
                placeholder="5"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
          </div>
        ) : null}

        {activeTab === "assignment" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {draft.weekAssignments.map((week) => (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => setSelectedWeekId(week.id)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    selectedWeekId === week.id ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 text-zinc-200"
                  }`}
                >
                  Week {week.weekIndex}
                </button>
              ))}
              <button
                type="button"
                onClick={addWeek}
                className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
              >
                + Add Week
              </button>
            </div>

            {selectedWeek ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(selectedWeek.mealsByDate).map((dateIso) => (
                    <button
                      key={dateIso}
                      type="button"
                      onClick={() => setSelectedDate(dateIso)}
                      className={`rounded-xl px-3 py-1.5 text-xs ${
                        selectedDate === dateIso ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 text-zinc-300"
                      }`}
                    >
                      {dateIso}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <select
                    value={newAssignment.mealType}
                    onChange={(event) =>
                      setNewAssignment((prev) => ({ ...prev, mealType: event.target.value as MealType, mealId: "" }))
                    }
                    className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  >
                    {mealTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newAssignment.mealId}
                    onChange={(event) => setNewAssignment((prev) => ({ ...prev, mealId: event.target.value }))}
                    className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  >
                    <option value="">Select meal</option>
                    {selectableMeals.map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newAssignment.badges}
                    onChange={(event) => setNewAssignment((prev) => ({ ...prev, badges: event.target.value }))}
                    placeholder="Badges (comma separated)"
                    className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                  <button
                    type="button"
                    onClick={addMealToDate}
                    className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-900"
                  >
                    Assign Meal
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedMealsOnDate.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-2">
                      <div className="text-sm text-zinc-100">
                        {item.mealName} <span className="text-zinc-400">({item.mealType})</span>
                        <p className="text-xs text-zinc-400">{item.badges.join(", ") || "No badges"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssignedMeal(item.id)}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {!selectedMealsOnDate.length ? <p className="text-sm text-zinc-400">No meals assigned for this date yet.</p> : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400">No week assignments available.</p>
            )}
          </div>
        ) : null}

        {activeTab === "pricing" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Base Fee</span>
              <input
                type="number"
                min={0}
                value={draft.pricing.basePriceFormula.baseFee}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            basePriceFormula: { ...prev.pricing.basePriceFormula, baseFee: Number(event.target.value) }
                          }
                        }
                      : prev
                  )
                }
                placeholder="150"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Price Per Meal</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.pricing.basePriceFormula.pricePerMeal}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          pricing: {
                            ...prev.pricing,
                            basePriceFormula: { ...prev.pricing.basePriceFormula, pricePerMeal: Number(event.target.value) }
                          }
                        }
                      : prev
                  )
                }
                placeholder="6.25"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Snacks Add-on</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.pricing.snacksAddonPrice}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, pricing: { ...prev.pricing, snacksAddonPrice: Number(event.target.value) } } : prev))
                }
                placeholder="2"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">VAT %</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.pricing.vatPercent}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, pricing: { ...prev.pricing, vatPercent: Number(event.target.value) } } : prev))
                }
                placeholder="15"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Safety Bag Fee</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.pricing.safetyBagFee}
                onChange={(event) =>
                  setDraft((prev) => (prev ? { ...prev, pricing: { ...prev.pricing, safetyBagFee: Number(event.target.value) } } : prev))
                }
                placeholder="2"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Gift Code Value</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={draft.pricing.giftCodeRule.value}
                onChange={(event) =>
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          pricing: { ...prev.pricing, giftCodeRule: { ...prev.pricing.giftCodeRule, value: Number(event.target.value) } }
                        }
                      : prev
                  )
                }
                placeholder="15"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
          </div>
        ) : null}

        {activeTab === "content" ? (
          <div className="grid gap-3">
            <input
              value={draft.plan.content.heroTitle}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, plan: { ...prev.plan, content: { ...prev.plan.content, heroTitle: event.target.value } } } : prev
                )
              }
              placeholder="Hero title"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <input
              value={draft.plan.content.heroSubtitle}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, plan: { ...prev.plan, content: { ...prev.plan.content, heroSubtitle: event.target.value } } } : prev
                )
              }
              placeholder="Hero subtitle"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <textarea
              value={draft.plan.content.selectMealsText}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, plan: { ...prev.plan, content: { ...prev.plan.content, selectMealsText: event.target.value } } } : prev
                )
              }
              placeholder="Select-meals page text"
              className="min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <textarea
              value={draft.plan.content.checkoutText}
              onChange={(event) =>
                setDraft((prev) =>
                  prev ? { ...prev, plan: { ...prev.plan, content: { ...prev.plan.content, checkoutText: event.target.value } } } : prev
                )
              }
              placeholder="Checkout page text"
              className="min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </div>
        ) : null}
      </section>

      {saveError ? <ErrorState label={saveError} /> : null}
      {saveMessage ? <p className="text-sm text-emerald-300">{saveMessage}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={isSaving}
          className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save All Tabs"}
        </button>
      </div>
    </section>
  );
}
