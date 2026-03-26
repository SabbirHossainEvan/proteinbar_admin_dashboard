"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyPlanDetailsQuery, useUpsertMonthlyPlanDetailsMutation } from "@/redux/api/adminApi";
import type { MealType, MonthlyPlanDetails, WeekAssignment } from "@/redux/monthlyPlans/types";

type TabKey = "basic" | "rules" | "assignments";

type AssignmentFormState = {
  id: string;
  mealId: string;
  mealName: string;
  mealType: MealType;
  badges: string;
};

type CustomCategoryDraft = {
  name: string;
  mealIds: string[];
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "Basic Info" },
  { key: "rules", label: "Rules" },
  { key: "assignments", label: "Week Assignments" }
];

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];
const weekDayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

const createAssignmentForm = (): AssignmentFormState => ({
  id: "",
  mealId: "",
  mealName: "",
  mealType: "Lunch",
  badges: ""
});

const createCustomCategoryDraft = (index: number): CustomCategoryDraft => ({
  name: `Category ${index + 1}`,
  mealIds: []
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
      ...((details.plan.planKind === "custom" || details.plan.content?.customStepTwo)
        ? {
            customStepTwo: {
              categories: (details.plan.content?.customStepTwo?.categories ?? []).map((category) => ({
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

const uniqueValues = <T,>(items: T[]) => [...new Set(items)];

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
    uniqueValues(category.mealIds).forEach((mealId) => {
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
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedCategoryMealId, setSelectedCategoryMealId] = useState("");
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

  const meals = useMemo(() => draft?.mealLibrary ?? [], [draft?.mealLibrary]);
  const activeMeals = meals.filter((meal) => meal.status === "active");
  const selectedMealsOnDate = selectedWeek && selectedDate ? selectedWeek.mealsByDate[selectedDate] ?? [] : [];
  const isCustomPlan = draft?.plan.planKind === "custom";
  const customCategories = useMemo(() => draft?.plan.content?.customStepTwo?.categories ?? [], [draft?.plan.content?.customStepTwo?.categories]);
  const selectedCategory = customCategories[selectedCategoryIndex] ?? null;
  const selectedCategoryMeals = selectedCategory
    ? selectedCategory.mealIds.flatMap((mealId) => {
        const meal = meals.find((item) => item.id === mealId);
        return meal ? [meal] : [];
      })
    : [];
  const setPlanField = <K extends keyof MonthlyPlanDetails["plan"]>(field: K, value: MonthlyPlanDetails["plan"][K]) => {
    setDraft((prev) => (prev ? { ...prev, plan: { ...prev.plan, [field]: value } } : prev));
  };

  const setRulesField = <K extends keyof MonthlyPlanDetails["rules"]>(field: K, value: MonthlyPlanDetails["rules"][K]) => {
    setDraft((prev) => (prev ? { ...prev, rules: { ...prev.rules, [field]: value } } : prev));
  };

  const updateCustomCategories = (updater: (categories: CustomCategoryDraft[]) => CustomCategoryDraft[]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const currentCategories = prev.plan.content?.customStepTwo?.categories ?? [];
      return {
        ...prev,
        plan: {
          ...prev.plan,
          content: {
            ...prev.plan.content,
            customStepTwo: {
              categories: updater(currentCategories)
            }
          }
        }
      };
    });
  };

  useEffect(() => {
    if (!customCategories.length) {
      setSelectedCategoryIndex(0);
      setSelectedCategoryMealId("");
      return;
    }

    if (selectedCategoryIndex >= customCategories.length) {
      setSelectedCategoryIndex(customCategories.length - 1);
    }
  }, [customCategories, selectedCategoryIndex]);

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

  const addCustomCategory = () => {
    updateCustomCategories((categories) => {
      const nextCategories = [...categories, createCustomCategoryDraft(categories.length)];
      setSelectedCategoryIndex(nextCategories.length - 1);
      return nextCategories;
    });
  };

  const updateCustomCategory = (index: number, updater: (category: CustomCategoryDraft) => CustomCategoryDraft) => {
    updateCustomCategories((categories) => categories.map((category, categoryIndex) => (categoryIndex === index ? updater(category) : category)));
  };

  const removeCustomCategory = (index: number) => {
    updateCustomCategories((categories) => categories.filter((_, categoryIndex) => categoryIndex !== index));
  };

  const addMealToCustomCategory = () => {
    if (!selectedCategory || !selectedCategoryMealId) return;
    updateCustomCategory(selectedCategoryIndex, (category) => ({
      ...category,
      mealIds: uniqueValues([...category.mealIds, selectedCategoryMealId])
    }));
    setSelectedCategoryMealId("");
  };

  const removeMealFromCustomCategory = (mealId: string) => {
    updateCustomCategory(selectedCategoryIndex, (category) => ({
      ...category,
      mealIds: category.mealIds.filter((item) => item !== mealId)
    }));
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
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">Plan Editor</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">{draft.plan.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Manage the data used by `/{draft.plan.planKind}/{draft.plan.id}/set-plan`, `/select-meals`, and `/checkout`.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Plan Kind</p>
              <p className="mt-1 text-sm font-semibold text-white">{draft.plan.planKind}</p>
            </div>
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Status</p>
              <p className="mt-1 text-sm font-semibold text-white">{draft.plan.status}</p>
            </div>
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">Weeks</p>
              <p className="mt-1 text-sm font-semibold text-white">{draft.weekAssignments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-amber-300 text-zinc-900 shadow-[0_12px_30px_rgba(251,191,36,0.22)]"
                : "border border-zinc-700 bg-zinc-900/55 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="admin-panel rounded-[28px] border border-zinc-800/80 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
        {activeTab === "basic" ? (
          <div className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <p className="text-lg font-semibold text-white">Basic Info</p>
              <p className="mt-1 text-sm text-zinc-400">Update the plan identity, visibility, and cover image used across the monthly plan flow.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Title</span>
              <input
                value={draft.plan.title}
                onChange={(event) => setPlanField("title", event.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Slug</span>
              <input
                value={draft.plan.slug}
                onChange={(event) => setPlanField("slug", event.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Badge</span>
              <input
                value={draft.plan.badge ?? ""}
                onChange={(event) => setPlanField("badge", event.target.value)}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Status</span>
              <select
                value={draft.plan.status}
                onChange={(event) => setPlanField("status", event.target.value as MonthlyPlanDetails["plan"]["status"])}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan Kind</span>
              <select
                value={draft.plan.planKind}
                onChange={(event) => setPlanField("planKind", event.target.value as MonthlyPlanDetails["plan"]["planKind"])}
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
              >
                <option value="custom">custom</option>
                <option value="normal">normal</option>
              </select>
            </label>
            <div className="space-y-1.5">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan Image Upload</span>
              <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-zinc-600 bg-[linear-gradient(180deg,rgba(24,24,27,0.88),rgba(15,15,17,0.92))] px-5 py-6 text-center transition hover:border-amber-300 hover:bg-zinc-900/90">
                <input type="file" accept="image/*" onChange={handlePlanImageUpload} className="hidden" />
                <span className="rounded-full border border-zinc-600 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition group-hover:border-amber-300/60 group-hover:text-amber-200">
                  Image
                </span>
                <span className="text-sm font-medium text-zinc-100">Upload plan cover</span>
                <span className="text-xs text-zinc-500">JPG, PNG, or WebP. Click to choose a file.</span>
              </label>
            </div>
            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/40 p-3">
              {draft.plan.image ? (
                <div className="overflow-hidden rounded-[20px] border border-zinc-700 bg-zinc-900/50">
                  <Image src={draft.plan.image} alt="Plan preview" width={1200} height={320} className="h-40 w-full object-cover" unoptimized />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-[20px] border border-zinc-800 bg-zinc-900/40 px-4 text-sm text-zinc-500">
                  No image uploaded yet
                </div>
              )}
              <p className="px-1 pt-3 text-xs text-zinc-500">This preview helps you confirm the cover before saving the plan.</p>
            </div>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Description</span>
              <textarea
                value={draft.plan.description}
                onChange={(event) => setPlanField("description", event.target.value)}
                className="min-h-32 w-full rounded-[24px] border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
              />
            </label>
            </div>
          </div>
        ) : null}

        {activeTab === "rules" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
              <p className="text-sm font-semibold text-white">Website Set-plan Dropdown Options</p>
              <p className="mt-1 text-xs text-zinc-400">
                These values control the `Number Of Meals *` and `{draft.plan.planKind === "custom" ? "Number Of Weeks *" : "Number Of Days *"}` dropdown options shown on the public website.
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
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  {draft.plan.planKind === "custom" ? "Number Of Weeks Dropdown" : "Number Of Days Dropdown"}
                </span>
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

          </div>
        ) : null}

        {activeTab === "assignments" ? (
          <div className="space-y-4">
            {isCustomPlan ? (
              <>
                <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                  <p className="text-sm font-semibold text-white">Custom Plan Tab Navigation</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    `Make Your Plan` always stays fixed. Add, rename, or delete the other tabs here and assign meals for each tab.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900">
                      Make Your Plan
                    </button>
                    {customCategories.map((category, index) => (
                      <button
                        key={`custom-category-tab-${index}`}
                        type="button"
                        onClick={() => setSelectedCategoryIndex(index)}
                        className={`rounded-xl px-4 py-2 text-sm transition ${
                          selectedCategoryIndex === index
                            ? "bg-white text-zinc-950"
                            : "border border-zinc-600 bg-zinc-950/40 text-zinc-200"
                        }`}
                      >
                        {category.name || `Category ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                  <div className="space-y-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Manage Tabs</p>
                        <p className="mt-1 text-xs text-zinc-400">These tabs appear beside `Make Your Plan` on the website.</p>
                      </div>
                      <button type="button" onClick={addCustomCategory} className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900">
                        + Add Tab
                      </button>
                    </div>

                    <div className="space-y-3">
                      {customCategories.map((category, index) => (
                        <div key={`custom-category-editor-${index}`} className="rounded-2xl border border-zinc-700/70 bg-zinc-950/50 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <label className="flex-1 space-y-1">
                              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Tab Name</span>
                              <input
                                value={category.name}
                                onChange={(event) => updateCustomCategory(index, (item) => ({ ...item, name: event.target.value }))}
                                placeholder={`Category ${index + 1}`}
                                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                              />
                            </label>
                            <div className="flex gap-2 pt-5 md:pt-0">
                              <button
                                type="button"
                                onClick={() => setSelectedCategoryIndex(index)}
                                className={`rounded-xl px-3 py-2 text-sm ${
                                  selectedCategoryIndex === index ? "bg-amber-300 font-semibold text-zinc-900" : "border border-zinc-600 bg-zinc-900/60 text-zinc-100"
                                }`}
                              >
                                Assign Meals
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCustomCategory(index)}
                                className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-zinc-400">{category.mealIds.length} meal(s) assigned to this tab.</p>
                        </div>
                      ))}
                      {!customCategories.length ? <p className="text-sm text-zinc-400">No dynamic tabs added yet. Create one to start assigning meals.</p> : null}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedCategory ? `Assign Meals For ${selectedCategory.name || "Selected Tab"}` : "Assign Meals"}</p>
                      <p className="mt-1 text-xs text-zinc-400">Choose active meal library items and attach them to the selected custom tab.</p>
                    </div>

                    {selectedCategory ? (
                      <>
                        <div className="flex gap-2">
                          <select
                            value={selectedCategoryMealId}
                            onChange={(event) => setSelectedCategoryMealId(event.target.value)}
                            className="flex-1 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                          >
                            <option value="">Select meal to assign</option>
                            {activeMeals.map((meal) => (
                              <option key={meal.id} value={meal.id}>
                                {meal.name} | {meal.mealType}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={addMealToCustomCategory} className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900">
                            Add Meal
                          </button>
                        </div>

                        <div className="space-y-3">
                          {selectedCategoryMeals.map((meal) => (
                            <article key={meal.id} className="rounded-xl border border-zinc-700/70 bg-zinc-950/50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-white">{meal.name}</h4>
                                  <p className="mt-1 text-xs text-zinc-400">
                                    {meal.mealType} | {meal.calories} kcal | Protein {meal.protein}g
                                  </p>
                                  <p className="mt-2 text-xs text-zinc-500">Tags: {meal.tags.join(", ") || "-"}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMealFromCustomCategory(meal.id)}
                                  className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                                >
                                  Remove
                                </button>
                              </div>
                            </article>
                          ))}
                          {!selectedCategoryMeals.length ? <p className="text-sm text-zinc-400">No meals assigned to this tab yet.</p> : null}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-400">Select or create a tab first, then assign meals here.</p>
                    )}
                  </div>
                </div>

              </>
            ) : (
              <>
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
                  </>
                ) : (
                  <p className="text-sm text-zinc-400">No week assignments available.</p>
                )}
              </>
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

      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/75 px-4 py-3 backdrop-blur">
        <p className="hidden text-sm text-zinc-400 md:block">Save changes after updating the monthly plan configuration.</p>
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={isSaving}
          className="rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Monthly Plan"}
        </button>
      </div>
    </section>
  );
}
