"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyPlanDetailsQuery, useUpsertMonthlyPlanDetailsMutation } from "@/redux/api/adminApi";
import type { DeliveryOptionConfig, MealType, MonthlyPlanDetails, WeekAssignment } from "@/redux/monthlyPlans/types";

type TabKey = "basic" | "rules" | "assignments";

type AssignmentFormState = {
  id: string;
  mealId: string;
  mealName: string;
  mealType: MealType;
  badges: string;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "Basic Info" },
  { key: "rules", label: "Rules" },
  { key: "assignments", label: "Week Assignments" }
];

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
const weekDayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
];
const deliveryOptionIds: DeliveryOptionConfig["option"][] = [
  "daily-delivery",
  "daily-pickup",
  "weekly-delivery",
  "weekly-pickup"
];
const weekDayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

const createAssignmentForm = (): AssignmentFormState => ({
  id: "",
  mealId: "",
  mealName: "",
  mealType: "Lunch",
  badges: ""
});

const normalizeDetails = (details: MonthlyPlanDetails): MonthlyPlanDetails => ({
  ...details,
  plan: {
    ...details.plan,
    content: {
      heroTitle: details.plan.content?.heroTitle ?? "",
      heroSubtitle: details.plan.content?.heroSubtitle ?? "",
      selectMealsText: details.plan.content?.selectMealsText ?? "",
      checkoutText: details.plan.content?.checkoutText ?? "",
      ...(details.plan.content?.customStepTwo
        ? {
            customStepTwo: {
              categories: details.plan.content.customStepTwo.categories.map((category) => ({
                name: category.name,
                mealIds: [...category.mealIds]
              }))
            }
          }
        : {})
    },
    weekAssignmentIds: [...(details.plan.weekAssignmentIds ?? [])]
  },
  rules: {
    ...details.rules,
    allowedMealsPerDay: [...details.rules.allowedMealsPerDay],
    allowedDays: [...details.rules.allowedDays],
    allowedSnacks: [...details.rules.allowedSnacks],
    planTypeOptions: [...details.rules.planTypeOptions],
    deliveryDaysRule: {
      ...details.rules.deliveryDaysRule,
      allowedWeekDays: [...details.rules.deliveryDaysRule.allowedWeekDays]
    },
    defaults: {
      ...details.rules.defaults,
      deliveryDays: [...details.rules.defaults.deliveryDays]
    },
    deliveryOptionConfigs: details.rules.deliveryOptionConfigs.map((config) => ({ ...config }))
  },
  pricing: {
    ...details.pricing,
    basePriceFormula: { ...details.pricing.basePriceFormula },
    giftCodeRule: { ...details.pricing.giftCodeRule }
  },
  weekAssignments: details.weekAssignments.map((week) => ({
    ...week,
    mealsByDate: Object.fromEntries(
      Object.entries(week.mealsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateIso, meals]) => [dateIso, meals.map((meal) => ({ ...meal, badges: [...meal.badges] }))])
    )
  })),
  mealLibrary: (details.mealLibrary ?? []).map((meal) => ({ ...meal, tags: [...meal.tags] }))
});

const parseNumberList = (value: string, minValue = 0) =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item >= minValue);

const parseStringList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const addDays = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const startOfWeekSunday = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return addDays(isoDate, -date.getUTCDay());
};

const formatDatePillLabel = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${weekDayFormatter.format(date)} ${isoDate}`;
};

const buildDatesInRange = (startDate: string, endDate: string) => {
  if (!startDate || !endDate || startDate > endDate) return [];
  const dates: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
};

const syncWeekDates = (week: WeekAssignment): WeekAssignment => ({
  ...week,
  mealsByDate: Object.fromEntries(buildDatesInRange(week.startDate, week.endDate).map((dateIso) => [dateIso, week.mealsByDate[dateIso] ?? []]))
});

const createWeekDraft = (planId: string, nextWeekIndex: number, previousWeek?: WeekAssignment): WeekAssignment => {
  const startDate = previousWeek ? addDays(previousWeek.endDate, 1) : startOfWeekSunday(new Date().toLocaleDateString("en-CA"));
  const endDate = addDays(startDate, 6);
  return syncWeekDates({
    id: `wa-${planId}-${nextWeekIndex}-${Date.now()}`,
    planId,
    weekIndex: nextWeekIndex,
    startDate,
    endDate,
    mealsByDate: {}
  });
};

const validateDetails = (details: MonthlyPlanDetails) => {
  const errors: string[] = [];
  const mealIds = new Set((details.mealLibrary ?? []).map((meal) => meal.id));
  const deliveryOptionIdsSeen = new Set<string>();

  if (!details.plan.title.trim()) errors.push("Title is required.");
  if (!details.plan.slug.trim()) errors.push("Slug is required.");
  if (!details.plan.description.trim()) errors.push("Description is required.");
  if (!["custom", "normal"].includes(details.plan.planKind)) errors.push("Plan kind must be custom or normal.");
  if (!["draft", "active", "inactive", "archived"].includes(details.plan.status)) errors.push("Status is invalid.");
  if (
    [
      details.pricing.basePriceFormula.baseFee,
      details.pricing.basePriceFormula.pricePerMeal,
      details.pricing.basePriceFormula.dayMultiplier,
      details.pricing.snacksAddonPrice,
      details.pricing.vatPercent,
      details.pricing.safetyBagFee,
      details.pricing.giftCodeRule.value,
      details.pricing.giftCodeRule.maxDiscount
    ].some((value) => value < 0)
  ) {
    errors.push("Pricing values must be non-negative.");
  }
  if (!details.rules.allowedMealsPerDay.includes(details.rules.defaults.meals)) errors.push("Default meals must exist inside allowed meals/day.");
  if (!details.rules.allowedDays.includes(details.rules.defaults.days)) errors.push("Default days must exist inside allowed days.");
  if (!details.rules.allowedSnacks.includes(details.rules.defaults.snacks)) errors.push("Default snacks must exist inside allowed snacks.");
  if (details.plan.planKind === "custom" && !details.rules.planTypeOptions.length) errors.push("Custom plans require at least one plan type option.");
  if (details.rules.defaults.planType && !details.rules.planTypeOptions.includes(details.rules.defaults.planType)) errors.push("Default plan type must exist inside plan type options.");
  if (details.rules.deliveryDaysRule.allowedWeekDays.some((day) => day < 0 || day > 6)) errors.push("Allowed week days must stay within 0-6.");
  if (details.rules.defaults.deliveryDays.some((day) => !details.rules.deliveryDaysRule.allowedWeekDays.includes(day))) errors.push("Default delivery days must exist inside allowed week days.");
  if (details.rules.deliveryDaysRule.min > details.rules.deliveryDaysRule.max) errors.push("Delivery day rule min must be less than or equal to max.");

  details.rules.deliveryOptionConfigs.forEach((config) => {
    if (deliveryOptionIdsSeen.has(config.option)) errors.push("Delivery option configs must not contain duplicates.");
    deliveryOptionIdsSeen.add(config.option);
  });

  (details.mealLibrary ?? []).forEach((meal) => {
    if (!meal.name.trim()) errors.push(`Meal ${meal.id || "(new)"} requires a name.`);
    if ([meal.calories, meal.protein, meal.carbs, meal.fat].some((value) => value < 0)) errors.push(`Meal ${meal.name || meal.id} cannot contain negative macros.`);
  });

  details.weekAssignments.forEach((week) => {
    if (week.startDate > week.endDate) errors.push(`Week ${week.weekIndex} has an invalid date range.`);
    Object.entries(week.mealsByDate).forEach(([dateIso, meals]) => {
      if (dateIso < week.startDate || dateIso > week.endDate) errors.push(`Week ${week.weekIndex} contains date ${dateIso} outside its range.`);
      meals.forEach((meal) => {
        if (!mealIds.has(meal.mealId)) errors.push(`Assigned meal ${meal.mealName} references a missing meal library item.`);
      });
    });
  });

  details.plan.content?.customStepTwo?.categories.forEach((category) => {
    if (!category.name.trim()) errors.push("Custom categories require a name.");
    category.mealIds.forEach((mealId) => {
      if (!mealIds.has(mealId)) errors.push(`Category ${category.name} references a missing meal.`);
    });
  });

  return [...new Set(errors)];
};

export default function MonthlyPlanDetailEditorPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [draft, setDraft] = useState<MonthlyPlanDetails | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>(createAssignmentForm());
  const [saveMessage, setSaveMessage] = useState("");
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  const { data, isLoading, isError } = useGetMonthlyPlanDetailsQuery(planId);
  const [upsertPlanDetails, { isLoading: isSaving }] = useUpsertMonthlyPlanDetailsMutation();

  useEffect(() => {
    if (!data?.data) return;
    setDraft(normalizeDetails(data.data));
    setAssignmentForm(createAssignmentForm());
  }, [data]);

  useEffect(() => {
    if (!draft?.weekAssignments.length) return;
    if (!selectedWeekId || !draft.weekAssignments.some((week) => week.id === selectedWeekId)) {
      setSelectedWeekId(draft.weekAssignments[0].id);
    }
  }, [draft, selectedWeekId]);

  const selectedWeek = useMemo(() => draft?.weekAssignments.find((week) => week.id === selectedWeekId) ?? null, [draft, selectedWeekId]);
  const selectedWeekDates = useMemo(() => (selectedWeek ? Object.keys(selectedWeek.mealsByDate).sort((a, b) => a.localeCompare(b)) : []), [selectedWeek]);

  useEffect(() => {
    if (!selectedWeekDates.length) return;
    if (!selectedDate || !selectedWeekDates.includes(selectedDate)) {
      setSelectedDate(selectedWeekDates[0]);
    }
  }, [selectedDate, selectedWeekDates]);

  const meals = draft?.mealLibrary ?? [];
  const activeMeals = meals.filter((meal) => meal.status === "active");
  const selectedMealsOnDate = selectedWeek && selectedDate ? selectedWeek.mealsByDate[selectedDate] ?? [] : [];
  const isCustomPlan = draft?.plan.planKind === "custom";
  const setPlanField = <K extends keyof MonthlyPlanDetails["plan"]>(field: K, value: MonthlyPlanDetails["plan"][K]) => {
    setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, [field]: value } } : prev));
  };

  const setRulesField = <K extends keyof MonthlyPlanDetails["rules"]>(field: K, value: MonthlyPlanDetails["rules"][K]) => {
    setDraft((prev) => (prev ? { ...prev, rules: { ...prev.rules, [field]: value } } : prev));
  };

  const updateWeek = (weekId: string, updater: (week: WeekAssignment) => WeekAssignment) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: prev.weekAssignments.map((week) => (week.id === weekId ? updater(week) : week))
          }
        : prev
    );
  };

  const addWeek = () => {
    if (!draft) return;
    const lastWeek = [...draft.weekAssignments].sort((a, b) => a.weekIndex - b.weekIndex).at(-1);
    const newWeek = createWeekDraft(draft.plan.id, draft.weekAssignments.length + 1, lastWeek);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: [...prev.weekAssignments, newWeek],
            plan: { ...prev.plan, weekAssignmentIds: [...prev.plan.weekAssignmentIds, newWeek.id] }
          }
        : prev
    );
    setSelectedWeekId(newWeek.id);
  };

  const removeWeek = (weekId: string) => {
    setDraft((prev) => {
      if (!prev || prev.weekAssignments.length === 1) return prev;
      const nextWeeks = prev.weekAssignments.filter((week) => week.id !== weekId).map((week, index) => ({ ...week, weekIndex: index + 1 }));
      return {
        ...prev,
        weekAssignments: nextWeeks,
        plan: { ...prev.plan, weekAssignmentIds: nextWeeks.map((week) => week.id) }
      };
    });
  };

  const saveAssignment = () => {
    if (!selectedWeek || !selectedDate || !assignmentForm.mealId) return;
    const selectedMeal = meals.find((meal) => meal.id === assignmentForm.mealId);
    const mealType = assignmentForm.mealType || selectedMeal?.mealType || "Lunch";
    const mealName = assignmentForm.mealName.trim() || selectedMeal?.name || "";
    if (!mealName) {
      setSaveErrors(["Assigned meal name is required."]);
      return;
    }
    updateWeek(selectedWeek.id, (week) => ({
      ...week,
      mealsByDate: {
        ...week.mealsByDate,
        [selectedDate]: [
          ...(week.mealsByDate[selectedDate] ?? []).filter((item) => item.id !== assignmentForm.id),
          {
            id: assignmentForm.id || `assigned-${Date.now()}`,
            mealId: assignmentForm.mealId,
            mealName,
            mealType,
            date: selectedDate,
            badges: parseStringList(assignmentForm.badges)
          }
        ]
      }
    }));
    setAssignmentForm(createAssignmentForm());
    setSaveErrors([]);
  };

  const saveAll = async () => {
    if (!draft) return;
    const payload = normalizeDetails(draft);
    const errors = validateDetails(payload);
    if (errors.length) {
      setSaveErrors(errors);
      setSaveMessage("");
      return;
    }
    try {
      const response = await upsertPlanDetails(payload).unwrap();
      setDraft(normalizeDetails(response.data));
      setSaveErrors([]);
      setSaveMessage("Monthly plan saved.");
    } catch (error) {
      setSaveErrors([error instanceof Error ? error.message : "Failed to save monthly plan."]);
      setSaveMessage("");
    }
  };

  const handlePlanImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPlanField("image", result);
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) return <LoadingState label="Loading monthly plan details..." />;
  if (isError || !data?.data) return <ErrorState label="Failed to load monthly plan detail." />;
  if (!draft) return <LoadingState label="Preparing editor..." />;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Plan Editor</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">{draft.plan.title}</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Manage the data used by `/{draft.plan.planKind}/{draft.plan.id}/set-plan`, `/select-meals`, and `/checkout`.
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
        {activeTab === "basic" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Title</span>
              <input
                value={draft.plan.title}
                onChange={(event) => setPlanField("title", event.target.value)}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Slug</span>
              <input
                value={draft.plan.slug}
                onChange={(event) => setPlanField("slug", event.target.value)}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Badge</span>
              <input
                value={draft.plan.badge ?? ""}
                onChange={(event) => setPlanField("badge", event.target.value)}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Status</span>
              <select
                value={draft.plan.status}
                onChange={(event) => setPlanField("status", event.target.value as MonthlyPlanDetails["plan"]["status"])}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan Kind</span>
              <select
                value={draft.plan.planKind}
                onChange={(event) => setPlanField("planKind", event.target.value as MonthlyPlanDetails["plan"]["planKind"])}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              >
                <option value="custom">custom</option>
                <option value="normal">normal</option>
              </select>
            </label>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan Image Upload</span>
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-600 bg-zinc-900/70 px-4 py-4 text-sm text-zinc-200 transition hover:border-amber-300 hover:text-white">
                <input type="file" accept="image/*" onChange={handlePlanImageUpload} className="hidden" />
                Upload image
              </label>
            </div>
            {draft.plan.image ? (
              <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/50">
                <Image src={draft.plan.image} alt="Plan preview" width={1200} height={320} className="h-32 w-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/40 px-4 py-4 text-sm text-zinc-500">
                No image uploaded
              </div>
            )}
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Description</span>
              <textarea
                value={draft.plan.description}
                onChange={(event) => setPlanField("description", event.target.value)}
                className="min-h-28 w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
              />
            </label>
          </div>
        ) : null}

        {activeTab === "rules" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
              <p className="text-sm font-semibold text-white">Website Set-plan Dropdown Options</p>
              <p className="mt-1 text-xs text-zinc-400">
                These values control the `Number Of Meals *` and `Number Of Days *` dropdown options shown on the public website.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Number Of Meals Dropdown</span>
                <input
                  value={draft.rules.allowedMealsPerDay.join(",")}
                  onChange={(event) => setRulesField("allowedMealsPerDay", parseNumberList(event.target.value, 1))}
                  placeholder="1,2,3"
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {draft.rules.allowedMealsPerDay.map((value) => (
                    <span key={`meals-${value}`} className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-200">
                      {value}
                    </span>
                  ))}
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Number Of Days Dropdown</span>
                <input
                  value={draft.rules.allowedDays.join(",")}
                  onChange={(event) => setRulesField("allowedDays", parseNumberList(event.target.value, 1))}
                  placeholder="3,4,5,6"
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {draft.rules.allowedDays.map((value) => (
                    <span key={`days-${value}`} className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-200">
                      {value}
                    </span>
                  ))}
                </div>
              </label>
            </div>

            {draft.plan.planKind === "custom" ? (
              <>
                <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                  <p className="text-sm font-semibold text-white">Allowed Week Days</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {weekDayOptions.map((day) => {
                      const checked = draft.rules.deliveryDaysRule.allowedWeekDays.includes(day.value);
                      return (
                        <label key={day.value} className="flex items-center gap-2 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-2 text-sm text-zinc-100">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const next = event.target.checked
                                ? [...draft.rules.deliveryDaysRule.allowedWeekDays, day.value]
                                : draft.rules.deliveryDaysRule.allowedWeekDays.filter((value) => value !== day.value);
                              setRulesField("deliveryDaysRule", {
                                ...draft.rules.deliveryDaysRule,
                                allowedWeekDays: [...new Set(next)].sort((a, b) => a - b)
                              });
                            }}
                          />
                          <span>{day.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                  <p className="text-sm font-semibold text-white">Default Selection</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Meals</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.rules.defaults.meals}
                        onChange={(event) => setRulesField("defaults", { ...draft.rules.defaults, meals: Number(event.target.value) })}
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Days</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.rules.defaults.days}
                        onChange={(event) => setRulesField("defaults", { ...draft.rules.defaults, days: Number(event.target.value) })}
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Snacks</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.rules.defaults.snacks}
                        onChange={(event) => setRulesField("defaults", { ...draft.rules.defaults, snacks: Number(event.target.value) })}
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Plan Type</span>
                      <input
                        value={draft.rules.defaults.planType ?? ""}
                        onChange={(event) => setRulesField("defaults", { ...draft.rules.defaults, planType: event.target.value || undefined })}
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Delivery Days</span>
                      <input
                        value={draft.rules.defaults.deliveryDays.join(",")}
                        onChange={(event) => setRulesField("defaults", { ...draft.rules.defaults, deliveryDays: parseNumberList(event.target.value, 0) })}
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                  <p className="text-sm font-semibold text-white">Delivery Options</p>
                  <div className="mt-3 space-y-3">
                    {draft.rules.deliveryOptionConfigs.map((config, index) => (
                      <div key={`${config.option}-${index}`} className="grid gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-3 md:grid-cols-2 xl:grid-cols-6">
                        <select
                          value={config.option}
                          onChange={(event) => {
                            const next = draft.rules.deliveryOptionConfigs.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, option: event.target.value as DeliveryOptionConfig["option"] } : item
                            );
                            setRulesField("deliveryOptionConfigs", next);
                          }}
                          className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        >
                          {deliveryOptionIds.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          value={config.label}
                          onChange={(event) => {
                            const next = draft.rules.deliveryOptionConfigs.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, label: event.target.value } : item
                            );
                            setRulesField("deliveryOptionConfigs", next);
                          }}
                          className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                        <label className="flex items-center gap-2 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-2 text-sm text-zinc-100">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(event) => {
                              const next = draft.rules.deliveryOptionConfigs.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, enabled: event.target.checked } : item
                              );
                              setRulesField("deliveryOptionConfigs", next);
                            }}
                          />
                          Enabled
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={config.serviceFee}
                          onChange={(event) => {
                            const next = draft.rules.deliveryOptionConfigs.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, serviceFee: Number(event.target.value) } : item
                            );
                            setRulesField("deliveryOptionConfigs", next);
                          }}
                          className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                        <input
                          type="number"
                          min={0}
                          value={config.minDays}
                          onChange={(event) => {
                            const next = draft.rules.deliveryOptionConfigs.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, minDays: Number(event.target.value) } : item
                            );
                            setRulesField("deliveryOptionConfigs", next);
                          }}
                          className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                        <input
                          type="number"
                          min={0}
                          value={config.maxDays}
                          onChange={(event) => {
                            const next = draft.rules.deliveryOptionConfigs.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, maxDays: Number(event.target.value) } : item
                            );
                            setRulesField("deliveryOptionConfigs", next);
                          }}
                          className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {activeTab === "assignments" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {draft.weekAssignments.map((week) => (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => setSelectedWeekId(week.id)}
                  className={`rounded-xl px-3 py-2 text-sm ${selectedWeekId === week.id ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 text-zinc-200"}`}
                >
                  Week {week.weekIndex}
                </button>
              ))}
              <button type="button" onClick={addWeek} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100">
                + Add Week
              </button>
            </div>

            {selectedWeek ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Week Index</span>
                    <input type="number" min={1} value={selectedWeek.weekIndex} onChange={(event) => updateWeek(selectedWeek.id, (week) => ({ ...week, weekIndex: Number(event.target.value) || week.weekIndex }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Start Date</span>
                    <input type="date" value={selectedWeek.startDate} onChange={(event) => updateWeek(selectedWeek.id, (week) => syncWeekDates({ ...week, startDate: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">End Date</span>
                    <input type="date" value={selectedWeek.endDate} onChange={(event) => updateWeek(selectedWeek.id, (week) => syncWeekDates({ ...week, endDate: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                  </label>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => updateWeek(selectedWeek.id, (week) => syncWeekDates(week))} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100">
                    Sync Dates To Range
                  </button>
                  {draft.weekAssignments.length > 1 ? (
                    <button type="button" onClick={() => removeWeek(selectedWeek.id)} className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                      Remove Week
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedWeekDates.map((dateIso) => (
                    <button key={dateIso} type="button" onClick={() => setSelectedDate(dateIso)} className={`rounded-xl px-3 py-1.5 text-xs ${selectedDate === dateIso ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 text-zinc-300"}`}>
                      {formatDatePillLabel(dateIso)}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                  <div className="space-y-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Library Item</span>
                        <select
                          value={assignmentForm.mealId}
                          onChange={(event) => {
                            const selectedMeal = meals.find((meal) => meal.id === event.target.value);
                            setAssignmentForm((prev) => ({ ...prev, mealId: event.target.value, mealName: prev.mealName || selectedMeal?.name || "", mealType: selectedMeal?.mealType ?? prev.mealType }));
                          }}
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        >
                          <option value="">Select meal</option>
                          {meals.map((meal) => (
                            <option key={meal.id} value={meal.id}>
                              {meal.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Type</span>
                        <select value={assignmentForm.mealType} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, mealType: event.target.value as MealType }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300">
                          {mealTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Meal Name Override</span>
                        <input value={assignmentForm.mealName} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, mealName: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Badges</span>
                        <input value={assignmentForm.badges} onChange={(event) => setAssignmentForm((prev) => ({ ...prev, badges: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveAssignment} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900">
                        {assignmentForm.id ? "Update Assigned Meal" : "Add Meal To Date"}
                      </button>
                      {assignmentForm.id ? (
                        <button type="button" onClick={() => setAssignmentForm(createAssignmentForm())} className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100">
                          Cancel Edit
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                    <p className="text-sm font-semibold text-white">Meals For {selectedDate || "Selected Date"}</p>
                    {selectedMealsOnDate.map((item) => (
                      <div key={item.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.mealName}</p>
                            <p className="text-xs text-zinc-400">{item.mealType} | {item.badges.join(", ") || "No badges"}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAssignmentForm({ id: item.id, mealId: item.mealId, mealName: item.mealName, mealType: item.mealType, badges: item.badges.join(", ") })}
                              className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateWeek(selectedWeek.id, (week) => ({
                                  ...week,
                                  mealsByDate: { ...week.mealsByDate, [selectedDate]: (week.mealsByDate[selectedDate] ?? []).filter((meal) => meal.id !== item.id) }
                                }))
                              }
                              className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!selectedMealsOnDate.length ? <p className="text-sm text-zinc-400">No meals assigned to this date yet.</p> : null}
                  </div>
                </div>

                {isCustomPlan ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {activeMeals.map((meal) => (
                      <article key={meal.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-base font-semibold text-white">{meal.name}</h4>
                            <p className="text-xs text-zinc-400">{meal.mealType}</p>
                          </div>
                          <button type="button" onClick={() => setAssignmentForm({ id: "", mealId: meal.id, mealName: meal.name, mealType: meal.mealType, badges: meal.tags.join(", ") })} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900">
                            Use
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-zinc-300">Tags: {meal.tags.join(", ") || "-"}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-zinc-400">No week assignments available.</p>
            )}
          </div>
        ) : null}

      </section>

      {saveErrors.length ? (
        <div className="space-y-2">
          {saveErrors.map((error) => (
            <ErrorState key={error} label={error} />
          ))}
        </div>
      ) : null}
      {saveMessage ? <p className="text-sm text-emerald-300">{saveMessage}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={isSaving}
          className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Monthly Plan"}
        </button>
      </div>
    </section>
  );
}
