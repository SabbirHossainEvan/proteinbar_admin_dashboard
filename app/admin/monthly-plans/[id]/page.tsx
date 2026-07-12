"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetMealLibraryAdminQuery,
  useGetMonthlyPlanDetailsQuery,
  useUpsertMonthlyPlanDetailsMutation,
} from "@/redux/api/adminApi";
import type {
  CustomPlanCategory,
  CustomPlanFoodItem,
  MealLibraryItem,
  MealType,
  MonthlyPlanDetails,
  WeekAssignment,
} from "@/redux/monthlyPlans/types";

type TabKey = "basic" | "rules" | "assignments" | "regularMeals";

type AssignmentFormState = {
  id: string;
  mealId: string;
  mealName: string;
  mealType: MealType;
  mealTypes: MealType[];
  badges: string;
};

const mealTypes: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

const getMealLibraryTypes = (meal: MealLibraryItem): MealType[] =>
  meal.mealTypes?.length ? meal.mealTypes : [meal.mealType];

const getCategoryMealType = (categoryName: string): MealType | null => {
  const normalized = categoryName.trim().toLowerCase();
  return (
    mealTypes.find((type) => type.toLowerCase() === normalized) ?? null
  );
};

const mealSupportsCategory = (meal: MealLibraryItem, categoryName: string) => {
  const categoryMealType = getCategoryMealType(categoryName);
  if (!categoryMealType) return true;
  return getMealLibraryTypes(meal).includes(categoryMealType);
};

const resolveMealTypeForMeal = (
  mealType: MealType,
  meal: MealLibraryItem,
): MealType => {
  const allowedTypes = getMealLibraryTypes(meal);
  return allowedTypes.includes(mealType) ? mealType : allowedTypes[0] ?? "Lunch";
};
const weekDayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;
const longWeekDayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "UTC",
});

const createAssignmentForm = (): AssignmentFormState => ({
  id: "",
  mealId: "",
  mealName: "",
  mealType: "Lunch",
  mealTypes: [],
  badges: "",
});

const parseNumberList = (value: string, minValue = 0) =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item >= minValue);

const sanitizeNumberListInput = (value: string) =>
  value
    .replace(/[^\d,]/g, "")
    .replace(/,+/g, ",")
    .replace(/^,/, "");

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

const formatWeekDayLabel = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return longWeekDayFormatter.format(date);
};

const getWeekDayIndex = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDay();
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
  mealsByDate: Object.fromEntries(
    buildDatesInRange(week.startDate, week.endDate).map((dateIso) => [
      dateIso,
      week.mealsByDate[dateIso] ?? [],
    ]),
  ),
});

const setWeekStartDay = (
  week: WeekAssignment,
  targetWeekDay: number,
): WeekAssignment => {
  const currentWeekDay = getWeekDayIndex(week.startDate);
  const offset = targetWeekDay - currentWeekDay;
  const nextStartDate = addDays(week.startDate, offset);

  return syncWeekDates({
    ...week,
    startDate: nextStartDate,
    endDate: addDays(nextStartDate, 6),
  });
};

const createWeekDraft = (
  planId: string,
  nextWeekIndex: number,
  previousWeek?: WeekAssignment,
): WeekAssignment => {
  const startDate = previousWeek
    ? addDays(previousWeek.endDate, 1)
    : startOfWeekSunday(new Date().toLocaleDateString("en-CA"));
  const endDate = addDays(startDate, 6);
  return syncWeekDates({
    id: `wa-${planId}-${nextWeekIndex}-${Date.now()}`,
    planId,
    weekIndex: nextWeekIndex,
    startDate,
    endDate,
    mealsByDate: {},
  });
};

const copyWeekMealPattern = (
  sourceWeek: WeekAssignment,
  targetWeek: WeekAssignment,
): WeekAssignment => {
  const normalizedSourceWeek = syncWeekDates(sourceWeek);
  const normalizedTargetWeek = syncWeekDates(targetWeek);
  const sourceDates = Object.keys(normalizedSourceWeek.mealsByDate).sort(
    (a, b) => a.localeCompare(b),
  );
  const targetDates = Object.keys(normalizedTargetWeek.mealsByDate).sort(
    (a, b) => a.localeCompare(b),
  );
  const copiedMealsByDate = Object.fromEntries(
    targetDates.map((targetDate, dateIndex) => {
      const sourceDate = sourceDates[dateIndex];
      const sourceMeals = sourceDate
        ? normalizedSourceWeek.mealsByDate[sourceDate] ?? []
        : [];

      return [
        targetDate,
        sourceMeals.map((meal, mealIndex) => ({
          ...meal,
          id: `assigned-${Date.now()}-${targetWeek.weekIndex}-${dateIndex}-${mealIndex}`,
          date: targetDate,
        })),
      ];
    }),
  );

  return {
    ...normalizedTargetWeek,
    mealsByDate: copiedMealsByDate,
  };
};

const normalizeDetails = (details: MonthlyPlanDetails): MonthlyPlanDetails => ({
  ...details,
  plan: {
    ...details.plan,
    frequency: details.plan.frequency ?? "monthly",
    content: {
      heroTitle: details.plan.content?.heroTitle ?? "",
      heroSubtitle: details.plan.content?.heroSubtitle ?? "",
      selectMealsText: details.plan.content?.selectMealsText ?? "",
      checkoutText: details.plan.content?.checkoutText ?? "",
      ...(details.plan.planKind === "custom" ||
      details.plan.content?.regularStepTwo ||
      details.plan.content?.customStepTwo
        ? {
            regularStepTwo: {
              categories: (
                details.plan.content?.regularStepTwo?.categories ??
                details.plan.content?.customStepTwo?.categories ??
                []
              ).map((category) => ({ ...category })),
              foodItems: (
                details.plan.content?.regularStepTwo?.foodItems ??
                details.plan.content?.customStepTwo?.foodItems ??
                []
              ).map((item) => ({
                ...item,
                sizes: item.sizes.map((size) => ({ ...size })),
              })),
            },
          }
        : {}),
    },
    weekAssignmentIds: [...(details.plan.weekAssignmentIds ?? [])],
  },
  rules: {
    ...details.rules,
    allowedMealsPerDay: [...details.rules.allowedMealsPerDay],
    allowedDays: [...details.rules.allowedDays],
    allowedSnacks: [...details.rules.allowedSnacks],
    planTypeOptions: [...details.rules.planTypeOptions],
    deliveryDaysRule: {
      ...details.rules.deliveryDaysRule,
      allowedWeekDays: [...details.rules.deliveryDaysRule.allowedWeekDays],
    },
    defaults: {
      ...details.rules.defaults,
      deliveryDays: [...details.rules.defaults.deliveryDays],
    },
    deliveryOptionConfigs: details.rules.deliveryOptionConfigs.map(
      (config) => ({ ...config }),
    ),
  },
  pricing: {
    ...details.pricing,
    basePriceFormula: { ...details.pricing.basePriceFormula },
    giftCodeRule: { ...details.pricing.giftCodeRule },
  },
  weekAssignments: details.weekAssignments.map((week) => {
    const nextWeek = syncWeekDates({
      ...week,
      mealsByDate: Object.fromEntries(
        Object.entries(week.mealsByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateIso, meals]) => [
            dateIso,
            meals.map((meal) => ({ ...meal, badges: [...meal.badges] })),
          ]),
      ),
    });

    return {
      ...nextWeek,
      mealsByDate: Object.fromEntries(
        Object.entries(nextWeek.mealsByDate).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
    };
  }),
  mealLibrary: (details.mealLibrary ?? []).map((meal) => ({
    ...meal,
    tags: [...meal.tags],
    mealTypes: getMealLibraryTypes(meal),
  })),
});

const reconcileAssignedMeals = (
  details: MonthlyPlanDetails,
  availableMeals: MonthlyPlanDetails["mealLibrary"] = [],
): MonthlyPlanDetails => {
  const mealsById = new Map(availableMeals.map((meal) => [meal.id, meal]));
  const mealsByName = new Map(
    availableMeals.map((meal) => [
      meal.name.trim().toLowerCase().replace(/\s+/g, " "),
      meal,
    ]),
  );

  return {
    ...details,
    weekAssignments: details.weekAssignments.map((week) => ({
      ...week,
      mealsByDate: Object.fromEntries(
        Object.entries(week.mealsByDate).map(([dateIso, meals]) => [
          dateIso,
          meals.map((meal) => {
            const linkedMeal =
              mealsById.get(meal.mealId) ??
              mealsByName.get(
                meal.mealName.trim().toLowerCase().replace(/\s+/g, " "),
              );

            if (!linkedMeal) return meal;

            return {
              ...meal,
              mealId: linkedMeal.id,
              mealName: linkedMeal.name,
              mealType: resolveMealTypeForMeal(meal.mealType, linkedMeal),
            };
          }),
        ]),
      ),
    })),
  };
};

const validateDetails = (
  details: MonthlyPlanDetails,
  availableMeals: MonthlyPlanDetails["mealLibrary"] = [],
) => {
  const errors: string[] = [];
  const deliveryOptionIdsSeen = new Set<string>();
  const normalizeMealValue = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");
  const mealsById = new Map(availableMeals.map((meal) => [meal.id, meal]));
  const mealsByName = new Map(
    availableMeals.map((meal) => [normalizeMealValue(meal.name), meal]),
  );

  if (!details.plan.title.trim()) errors.push("Title is required.");
  if (!details.plan.slug.trim()) errors.push("Slug is required.");
  if (!details.plan.description.trim()) errors.push("Description is required.");
  if (!["custom", "normal"].includes(details.plan.planKind))
    errors.push("Plan kind must be custom or normal.");
  if (
    !["draft", "active", "inactive", "archived"].includes(details.plan.status)
  )
    errors.push("Status is invalid.");
  if (
    [
      details.pricing.basePriceFormula.baseFee,
      details.pricing.basePriceFormula.pricePerMeal,
      details.pricing.basePriceFormula.dayMultiplier,
      details.pricing.snacksAddonPrice,
      details.pricing.vatPercent,
      details.pricing.safetyBagFee,
      details.pricing.giftCodeRule.value,
      details.pricing.giftCodeRule.maxDiscount,
    ].some((value) => value < 0)
  ) {
    errors.push("Pricing values must be non-negative.");
  }
  if (!details.rules.allowedMealsPerDay.includes(details.rules.defaults.meals))
    errors.push("Default meals must exist inside allowed meals/day.");
  if (!details.rules.allowedDays.includes(details.rules.defaults.days))
    errors.push("Default days must exist inside allowed days.");
  if (!details.rules.allowedSnacks.includes(details.rules.defaults.snacks))
    errors.push("Default snacks must exist inside allowed snacks.");
  if (
    details.plan.planKind === "custom" &&
    !details.rules.planTypeOptions.length
  )
    errors.push("Custom plans require at least one plan type option.");
  if (
    details.rules.defaults.planType &&
    !details.rules.planTypeOptions.includes(details.rules.defaults.planType)
  )
    errors.push("Default plan type must exist inside plan type options.");
  if (
    details.rules.deliveryDaysRule.allowedWeekDays.some(
      (day) => day < 0 || day > 6,
    )
  )
    errors.push("Allowed week days must stay within 0-6.");
  if (
    details.rules.defaults.deliveryDays.some(
      (day) => !details.rules.deliveryDaysRule.allowedWeekDays.includes(day),
    )
  )
    errors.push("Default delivery days must exist inside allowed week days.");
  if (details.rules.deliveryDaysRule.min > details.rules.deliveryDaysRule.max)
    errors.push("Delivery day rule min must be less than or equal to max.");

  details.rules.deliveryOptionConfigs.forEach((config) => {
    if (deliveryOptionIdsSeen.has(config.option))
      errors.push("Delivery option configs must not contain duplicates.");
    deliveryOptionIdsSeen.add(config.option);
  });

  availableMeals.forEach((meal) => {
    if (!meal.name.trim())
      errors.push(`Meal ${meal.id || "(new)"} requires a name.`);
    if (
      [meal.calories, meal.protein, meal.carbs, meal.fat].some(
        (value) => value < 0,
      )
    )
      errors.push(
        `Meal ${meal.name || meal.id} cannot contain negative macros.`,
      );
  });

  details.weekAssignments.forEach((week) => {
    if (week.startDate > week.endDate)
      errors.push(`Week ${week.weekIndex} has an invalid date range.`);
    Object.entries(week.mealsByDate).forEach(([dateIso, meals]) => {
      if (dateIso < week.startDate || dateIso > week.endDate)
        errors.push(
          `Week ${week.weekIndex} contains date ${dateIso} outside its range.`,
        );
      meals.forEach((meal) => {
        const linkedMeal =
          mealsById.get(meal.mealId) ??
          mealsByName.get(normalizeMealValue(meal.mealName));

        if (!linkedMeal) {
          errors.push(
            `Assigned meal "${meal.mealName}" on ${dateIso} in week ${week.weekIndex} is no longer in Meal Library. Re-add that meal from Meal Library or remove it from this date.`,
          );
        } else if (!getMealLibraryTypes(linkedMeal).includes(meal.mealType)) {
          errors.push(
            `Assigned meal "${meal.mealName}" on ${dateIso} uses ${meal.mealType}, but this meal is only assigned to ${getMealLibraryTypes(linkedMeal).join(", ")} in Meal Library.`,
          );
        }
      });
    });
  });

  const categoryIds = new Set(
    details.plan.content?.regularStepTwo?.categories.map(
      (category) => category.id,
    ) ?? [],
  );
  details.plan.content?.regularStepTwo?.categories.forEach((category) => {
    if (!category.name.trim()) errors.push("Custom categories require a name.");
    if (
      category.selectionMode === "single" &&
      category.maxSelect !== null &&
      category.maxSelect !== 1
    ) {
      errors.push(
        `Category ${category.name} must use max select 1 for single-select.`,
      );
    }
    if (
      (category.maxSelect ?? null) !== null &&
      category.minSelect > (category.maxSelect ?? 0)
    ) {
      errors.push(`Category ${category.name} has invalid min/max selection.`);
    }
  });

  details.plan.content?.regularStepTwo?.foodItems.forEach((item) => {
    if (!item.name.trim()) errors.push("Custom food items require a name.");
    if (!categoryIds.has(item.categoryId))
      errors.push(`Food item ${item.name} references a missing category.`);
    if (!item.imageUrl.trim())
      errors.push(`Food item ${item.name} requires an image URL.`);
    if (!item.sizes.length)
      errors.push(`Food item ${item.name} requires at least one size.`);
  });

  const assignedMealKeys = new Set<string>();
  details.plan.content?.regularStepTwo?.foodItems.forEach((item) => {
    const mealKey = item.sourceMealId?.trim() || normalizeMealValue(item.name);
    const categoryMealKey = `${item.categoryId}::${mealKey}`;
    if (assignedMealKeys.has(categoryMealKey)) {
      errors.push(`Category contains duplicate assigned meal: ${item.name}.`);
      return;
    }
    assignedMealKeys.add(categoryMealKey);
  });

  return [...new Set(errors)];
};

export default function MonthlyPlanDetailEditorPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [draft, setDraft] = useState<MonthlyPlanDetails | null>(null);
  const [allowedMealsInput, setAllowedMealsInput] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>(
    createAssignmentForm(),
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [pickerCategoryId, setPickerCategoryId] = useState<string | null>(null);
  const [pickerMealId, setPickerMealId] = useState("");
  const [isCopyMealsModalOpen, setIsCopyMealsModalOpen] = useState(false);
  const [copyTargetWeekIds, setCopyTargetWeekIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useGetMonthlyPlanDetailsQuery(planId);
  const { data: mealLibraryData, isLoading: isLoadingMealLibrary } =
    useGetMealLibraryAdminQuery();
  const [upsertPlanDetails, { isLoading: isSaving }] =
    useUpsertMonthlyPlanDetailsMutation();

  useEffect(() => {
    if (!data?.data) return;
    const normalized = reconcileAssignedMeals(
      normalizeDetails(data.data),
      mealLibraryData?.data ?? data.data.mealLibrary ?? [],
    );
    setDraft(normalized);
    setAllowedMealsInput(normalized.rules.allowedMealsPerDay.join(","));
    setAssignmentForm(createAssignmentForm());
  }, [data, mealLibraryData]);

  useEffect(() => {
    if (!draft?.weekAssignments.length) return;
    if (
      !selectedWeekId ||
      !draft.weekAssignments.some((week) => week.id === selectedWeekId)
    ) {
      setSelectedWeekId(draft.weekAssignments[0].id);
    }
  }, [draft, selectedWeekId]);

  const selectedWeek = useMemo(
    () =>
      draft?.weekAssignments.find((week) => week.id === selectedWeekId) ?? null,
    [draft, selectedWeekId],
  );
  const selectedWeekDates = useMemo(
    () =>
      selectedWeek
        ? Object.keys(selectedWeek.mealsByDate).sort((a, b) =>
            a.localeCompare(b),
          )
        : [],
    [selectedWeek],
  );

  useEffect(() => {
    if (!selectedWeekDates.length) return;
    if (!selectedDate || !selectedWeekDates.includes(selectedDate)) {
      setSelectedDate(selectedWeekDates[0]);
    }
  }, [selectedDate, selectedWeekDates]);

  const meals = useMemo(
    () => mealLibraryData?.data ?? draft?.mealLibrary ?? [],
    [draft?.mealLibrary, mealLibraryData],
  );
  const selectedAssignmentMeal = useMemo(
    () => meals.find((meal) => meal.id === assignmentForm.mealId),
    [assignmentForm.mealId, meals],
  );
  const assignmentMealTypes = selectedAssignmentMeal
    ? getMealLibraryTypes(selectedAssignmentMeal)
    : [];
  const selectedMealsOnDate =
    selectedWeek && selectedDate
      ? (selectedWeek.mealsByDate[selectedDate] ?? [])
      : [];
  const selectedWeekMealCount = useMemo(
    () =>
      selectedWeek
        ? Object.values(selectedWeek.mealsByDate).reduce(
            (total, meals) => total + meals.length,
            0,
          )
        : 0,
    [selectedWeek],
  );
  const isCustomPlan = draft?.plan.planKind === "custom";
  const customCategories = useMemo(
    () => draft?.plan.content?.regularStepTwo?.categories ?? [],
    [draft?.plan.content?.regularStepTwo?.categories],
  );
  const customFoodItems = useMemo(
    () => draft?.plan.content?.regularStepTwo?.foodItems ?? [],
    [draft?.plan.content?.regularStepTwo?.foodItems],
  );
  const setPlanField = <K extends keyof MonthlyPlanDetails["plan"]>(
    field: K,
    value: MonthlyPlanDetails["plan"][K],
  ) => {
    setDraft((prev) =>
      prev ? { ...prev, plan: { ...prev.plan, [field]: value } } : prev,
    );
  };

  const setRulesField = <K extends keyof MonthlyPlanDetails["rules"]>(
    field: K,
    value: MonthlyPlanDetails["rules"][K],
  ) => {
    setDraft((prev) =>
      prev ? { ...prev, rules: { ...prev.rules, [field]: value } } : prev,
    );
  };

  const updateWeek = (
    weekId: string,
    updater: (week: WeekAssignment) => WeekAssignment,
  ) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: prev.weekAssignments.map((week) =>
              week.id === weekId ? updater(week) : week,
            ),
          }
        : prev,
    );
  };

  const createNextWeek = (source: MonthlyPlanDetails) => {
    const lastWeek = [...source.weekAssignments]
      .sort((a, b) => a.weekIndex - b.weekIndex)
      .at(-1);
    return createWeekDraft(
      source.plan.id,
      source.weekAssignments.length + 1,
      lastWeek,
    );
  };

  const addWeek = () => {
    if (!draft) return;
    const newWeek = createNextWeek(draft);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: [...prev.weekAssignments, newWeek],
            plan: {
              ...prev.plan,
              weekAssignmentIds: [...prev.plan.weekAssignmentIds, newWeek.id],
            },
          }
        : prev,
    );
    setSelectedWeekId(newWeek.id);
  };

  const addCopyTargetWeek = () => {
    if (!draft) return;
    const newWeek = createNextWeek(draft);
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: [...prev.weekAssignments, newWeek],
            plan: {
              ...prev.plan,
              weekAssignmentIds: [...prev.plan.weekAssignmentIds, newWeek.id],
            },
          }
        : prev,
    );
    setCopyTargetWeekIds((prev) => [...prev, newWeek.id]);
    setSaveErrors([]);
  };

  const openCopyMealsModal = () => {
    if (!draft || !selectedWeek) return;
    if (selectedWeekMealCount === 0) {
      setSaveErrors(["This week has no meals to copy."]);
      setSaveMessage("");
      return;
    }
    const defaultTargets = draft.weekAssignments
      .filter((week) => week.id !== selectedWeek.id)
      .map((week) => week.id);
    setCopyTargetWeekIds(defaultTargets);
    setIsCopyMealsModalOpen(true);
    setSaveErrors([]);
    setSaveMessage("");
  };

  const closeCopyMealsModal = () => {
    setIsCopyMealsModalOpen(false);
    setCopyTargetWeekIds([]);
  };

  const toggleCopyTargetWeek = (weekId: string) => {
    setCopyTargetWeekIds((prev) =>
      prev.includes(weekId)
        ? prev.filter((id) => id !== weekId)
        : [...prev, weekId],
    );
  };

  const toggleAssignmentMealType = (mealType: MealType) => {
    setAssignmentForm((prev) => {
      const nextMealTypes = prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter((type) => type !== mealType)
        : [...prev.mealTypes, mealType];

      return {
        ...prev,
        mealType: nextMealTypes[0] ?? mealType,
        mealTypes: nextMealTypes,
      };
    });
  };

  const copySelectedWeekToTargets = () => {
    if (!draft || !selectedWeek) return;
    if (copyTargetWeekIds.length === 0) {
      setSaveErrors(["Select at least one target week."]);
      setSaveMessage("");
      return;
    }
    const targetIds = new Set(copyTargetWeekIds);
    const targetWeekCount = copyTargetWeekIds.length;

    setDraft((prev) =>
      prev
        ? {
            ...prev,
            weekAssignments: prev.weekAssignments.map((week) =>
              targetIds.has(week.id)
                ? copyWeekMealPattern(selectedWeek, week)
                : week,
            ),
          }
        : prev,
    );
    setSaveErrors([]);
    setSaveMessage(
      `Copied Week ${selectedWeek.weekIndex} meals to ${targetWeekCount} selected week${targetWeekCount === 1 ? "" : "s"}. Save changes to publish.`,
    );
    closeCopyMealsModal();
  };

  const removeWeek = (weekId: string) => {
    setDraft((prev) => {
      if (!prev || prev.weekAssignments.length === 1) return prev;
      const nextWeeks = prev.weekAssignments
        .filter((week) => week.id !== weekId)
        .map((week, index) => ({ ...week, weekIndex: index + 1 }));
      return {
        ...prev,
        weekAssignments: nextWeeks,
        plan: {
          ...prev.plan,
          weekAssignmentIds: nextWeeks.map((week) => week.id),
        },
      };
    });
  };

  const saveAssignment = () => {
    if (!selectedWeek || !selectedDate || !assignmentForm.mealId) return;
    const selectedMeal = meals.find(
      (meal) => meal.id === assignmentForm.mealId,
    );
    const selectedMealTypes = selectedMeal ? getMealLibraryTypes(selectedMeal) : [];
    if (!selectedMeal || selectedMealTypes.length === 0) {
      setSaveErrors([
        "Selected meal is not available in Meal Library. Please select another meal.",
      ]);
      return;
    }
    const requestedMealTypes = (
      assignmentForm.mealTypes.length
        ? assignmentForm.mealTypes
        : [assignmentForm.mealType]
    ).filter((type, index, source) => source.indexOf(type) === index);
    const mealTypesToAssign = requestedMealTypes.filter((type) =>
      selectedMealTypes.includes(type),
    );
    if (mealTypesToAssign.length === 0) {
      setSaveErrors(["Select at least one valid meal type for this meal."]);
      return;
    }
    const mealName = assignmentForm.mealName.trim() || selectedMeal?.name || "";
    if (!mealName) {
      setSaveErrors(["Assigned meal name is required."]);
      return;
    }
    const badges = parseStringList(assignmentForm.badges);
    const assignmentTimestamp = Date.now();
    const nextAssignments = mealTypesToAssign.map((mealType, index) => ({
      id:
        index === 0 && assignmentForm.id
          ? assignmentForm.id
          : `assigned-${assignmentTimestamp}-${mealType.toLowerCase()}-${index}`,
      mealId: assignmentForm.mealId,
      mealName,
      mealType,
      date: selectedDate,
      badges,
    }));

    updateWeek(selectedWeek.id, (week) => ({
      ...week,
      mealsByDate: {
        ...week.mealsByDate,
        [selectedDate]: [
          ...(week.mealsByDate[selectedDate] ?? []).filter(
            (item) => item.id !== assignmentForm.id,
          ),
          ...nextAssignments,
        ],
      },
    }));
    setAssignmentForm(createAssignmentForm());
    setSaveErrors([]);
  };

  const addRegularMealCategory = () => {
    if (!draft) return;
    const newCategory: CustomPlanCategory = {
      id: `cat-${Date.now()}`,
      planId,
      name: "New Category",
      slug: `cat-${Date.now()}`,
      displayOrder: customCategories.length,
      selectionMode: "single",
      isActive: true,
      isRequired: false,
      minSelect: 1,
      maxSelect: 1,
    };
    setDraft((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            plan: {
              ...prev.plan,
              content: {
                ...prev.plan.content,
                regularStepTwo: {
                  categories: [
                    ...(prev.plan.content?.regularStepTwo?.categories || []),
                    newCategory,
                  ],
                  foodItems: prev.plan.content?.regularStepTwo?.foodItems || [],
                },
              },
            },
          },
    );
  };

  const updateRegularMealCategory = (categoryId: string, name: string) => {
    setDraft((prev) => {
      if (!prev || !prev.plan.content?.regularStepTwo) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          content: {
            ...prev.plan.content,
            regularStepTwo: {
              ...prev.plan.content.regularStepTwo,
              categories: prev.plan.content.regularStepTwo.categories.map(
                (c) => (c.id === categoryId ? { ...c, name } : c),
              ),
            },
          },
        },
      };
    });
  };

  const removeRegularMealCategory = (categoryId: string) => {
    setDraft((prev) => {
      if (!prev || !prev.plan.content?.regularStepTwo) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          content: {
            ...prev.plan.content,
            regularStepTwo: {
              categories: prev.plan.content.regularStepTwo.categories.filter(
                (c) => c.id !== categoryId,
              ),
              foodItems: prev.plan.content.regularStepTwo.foodItems.filter(
                (f) => f.categoryId !== categoryId,
              ),
            },
          },
        },
      };
    });
  };

  const openMealPicker = (categoryId: string) => {
    setPickerCategoryId(categoryId);
    setPickerMealId("");
  };

  const confirmAddMealFromLibrary = () => {
    if (!draft || !pickerCategoryId || !pickerMealId) return;
    const libraryMeal = meals.find((m) => m.id === pickerMealId);
    if (!libraryMeal) return;
    const alreadyAssigned = customFoodItems.some(
      (item) =>
        item.categoryId === pickerCategoryId &&
        (item.sourceMealId === libraryMeal.id ||
          item.name.trim().toLowerCase() ===
            libraryMeal.name.trim().toLowerCase()),
    );
    if (alreadyAssigned) {
      setSaveErrors([
        `Meal "${libraryMeal.name}" is already assigned to this category.`,
      ]);
      setSaveMessage("");
      return;
    }
    const foodId = `food-${Date.now()}`;
    const newItem: CustomPlanFoodItem = {
      id: foodId,
      planId,
      categoryId: pickerCategoryId,
      sourceMealId: libraryMeal.id,
      name: libraryMeal.name,
      imageUrl: libraryMeal.image || "https://placehold.co/400x300",
      displayOrder: customFoodItems.filter(
        (f) => f.categoryId === pickerCategoryId,
      ).length,
      isActive: true,
      sizes: [
        {
          id: `ps-${Date.now()}`,
          foodItemId: foodId,
          label: "Regular",
          price: 0,
          calories: libraryMeal.calories,
          protein: libraryMeal.protein,
          carbs: libraryMeal.carbs,
          fat: libraryMeal.fat,
          displayOrder: 0,
          isActive: true,
        },
      ],
    };
    setDraft((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            plan: {
              ...prev.plan,
              content: {
                ...prev.plan.content,
                regularStepTwo: {
                  categories:
                    prev.plan.content?.regularStepTwo?.categories || [],
                  foodItems: [
                    ...(prev.plan.content?.regularStepTwo?.foodItems || []),
                    newItem,
                  ],
                },
              },
            },
          },
    );
    setSaveErrors([]);
    setPickerCategoryId(null);
    setPickerMealId("");
  };

  const removeRegularFoodItem = (foodId: string) => {
    setDraft((prev) => {
      if (!prev || !prev.plan.content?.regularStepTwo) return prev;
      return {
        ...prev,
        plan: {
          ...prev.plan,
          content: {
            ...prev.plan.content,
            regularStepTwo: {
              ...prev.plan.content.regularStepTwo,
              foodItems: prev.plan.content.regularStepTwo.foodItems.filter(
                (f) => f.id !== foodId,
              ),
            },
          },
        },
      };
    });
  };

  const saveAll = async () => {
    if (!draft) return;
    const payload = reconcileAssignedMeals(
      normalizeDetails({
        ...draft,
        rules:
          draft.plan.planKind === "normal"
            ? {
                ...draft.rules,
                allowedMealsPerDay: [draft.rules.defaults.meals],
              }
            : draft.rules,
      }),
      meals,
    );
    const errors = validateDetails(payload, meals);
    if (errors.length) {
      setSaveErrors(errors);
      setSaveMessage("");
      return;
    }
    try {
      const response = await upsertPlanDetails(payload).unwrap();
      const normalized = reconcileAssignedMeals(
        normalizeDetails(response.data),
        meals,
      );
      setDraft(normalized);
      setAllowedMealsInput(normalized.rules.allowedMealsPerDay.join(","));
      setSaveErrors([]);
      setSaveMessage("Meal plan saved.");
    } catch (error) {
      setSaveErrors([
        error instanceof Error ? error.message : "Failed to save meal plan.",
      ]);
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

  if (isLoading || isLoadingMealLibrary)
    return <LoadingState label="Loading meal plan details..." />;
  if (isError || !data?.data)
    return <ErrorState label="Failed to load meal plan detail." />;
  if (!draft) return <LoadingState label="Preparing editor..." />;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "basic", label: "Basic Info" },
    { key: "rules", label: "Rules" },
    {
      key: "assignments",
      label: isCustomPlan ? "Make Your Meal" : "Meal Assignments",
    },
    ...(isCustomPlan
      ? [{ key: "regularMeals" as TabKey, label: "Regular Meal Categories" }]
      : []),
  ];

  return (
    <section className="space-y-7">
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">
              Plan Editor
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {draft.plan.title}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Plan Kind
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {draft.plan.planKind}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Status
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {draft.plan.status}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                Weeks
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {draft.weekAssignments.length}
              </p>
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
              <p className="mt-1 text-sm text-zinc-400">
                Update the plan identity, frequency, visibility, and cover image
                used across the meal-plan flow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Title
                </span>
                <input
                  value={draft.plan.title}
                  onChange={(event) =>
                    setPlanField("title", event.target.value)
                  }
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Slug
                </span>
                <input
                  value={draft.plan.slug}
                  onChange={(event) => setPlanField("slug", event.target.value)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Badge
                </span>
                <input
                  value={draft.plan.badge ?? ""}
                  onChange={(event) =>
                    setPlanField("badge", event.target.value)
                  }
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Status
                </span>
                <select
                  value={draft.plan.status}
                  onChange={(event) =>
                    setPlanField(
                      "status",
                      event.target
                        .value as MonthlyPlanDetails["plan"]["status"],
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Plan Kind
                </span>
                <select
                  value={draft.plan.planKind}
                  onChange={(event) =>
                    setPlanField(
                      "planKind",
                      event.target
                        .value as MonthlyPlanDetails["plan"]["planKind"],
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                >
                  <option value="custom">custom</option>
                  <option value="normal">normal</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Frequency
                </span>
                <select
                  value={draft.plan.frequency}
                  onChange={(event) =>
                    setPlanField(
                      "frequency",
                      event.target
                        .value as MonthlyPlanDetails["plan"]["frequency"],
                    )
                  }
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                >
                  <option value="daily">daily</option>
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                </select>
              </label>
              <div className="space-y-1.5">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Plan Image Upload
                </span>
                <label className="group flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-zinc-600 bg-[linear-gradient(180deg,rgba(24,24,27,0.88),rgba(15,15,17,0.92))] px-5 py-6 text-center transition hover:border-amber-300 hover:bg-zinc-900/90">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePlanImageUpload}
                    className="hidden"
                  />
                  <span className="rounded-full border border-zinc-600 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition group-hover:border-amber-300/60 group-hover:text-amber-200">
                    Image
                  </span>
                  <span className="text-sm font-medium text-zinc-100">
                    Upload plan cover
                  </span>
                  <span className="text-xs text-zinc-500">
                    JPG, PNG, or WebP. Click to choose a file.
                  </span>
                </label>
              </div>
              <div className="rounded-[24px] border border-zinc-800 bg-zinc-950/40 p-3">
                {draft.plan.image ? (
                  <div className="overflow-hidden rounded-[20px] border border-zinc-700 bg-zinc-900/50">
                    <Image
                      src={draft.plan.image}
                      alt="Plan preview"
                      width={1200}
                      height={320}
                      className="h-40 w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-[20px] border border-zinc-800 bg-zinc-900/40 px-4 text-sm text-zinc-500">
                    No image uploaded yet
                  </div>
                )}
                <p className="px-1 pt-3 text-xs text-zinc-500">
                  This preview helps you confirm the cover before saving the
                  plan.
                </p>
              </div>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Description
                </span>
                <textarea
                  value={draft.plan.description}
                  onChange={(event) =>
                    setPlanField("description", event.target.value)
                  }
                  className="min-h-32 w-full rounded-[24px] border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-300 focus:bg-zinc-900"
                />
              </label>
            </div>
          </div>
        ) : null}

        {activeTab === "rules" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
              <p className="text-sm font-semibold text-white">
                Website Meal-plan Rules
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                These values control the public plan builder. Pre-made plans
                keep a fixed meal count; custom plans can expose multiple
                meal-count options.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  Number Of Meals Dropdown
                </span>
                <input
                  value={allowedMealsInput}
                  onChange={(event) => {
                    const sanitizedValue = sanitizeNumberListInput(
                      event.target.value,
                    );
                    setAllowedMealsInput(sanitizedValue);
                    setRulesField(
                      "allowedMealsPerDay",
                      parseNumberList(sanitizedValue, 1),
                    );
                  }}
                  placeholder={
                    draft.plan.planKind === "normal"
                      ? String(draft.rules.defaults.meals)
                      : "1,2,3"
                  }
                  disabled={draft.plan.planKind === "normal"}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {draft.plan.planKind === "normal" ? (
                  <p className="text-xs text-zinc-500">
                    Pre-made plans use a fixed meal count. Change the default
                    meals value only if the fixed plan changes.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  {draft.rules.allowedMealsPerDay.map((value) => (
                    <span
                      key={`meals-${value}`}
                      className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-200"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  {draft.plan.frequency === "monthly"
                    ? "Monthly Length Options"
                    : draft.plan.frequency === "weekly"
                      ? "Weekly Length Options"
                      : "Daily Length Options"}
                </span>
                <input
                  value={draft.rules.allowedDays.join(",")}
                  onChange={(event) =>
                    setRulesField(
                      "allowedDays",
                      parseNumberList(event.target.value, 1),
                    )
                  }
                  placeholder="3,4,5,6"
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {draft.rules.allowedDays.map((value) => (
                    <span
                      key={`days-${value}`}
                      className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-200"
                    >
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
                  <p className="text-sm font-semibold text-white">
                    Custom Plan Builder Overview
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    `Make Your Plan` stays fixed on the website. The modal
                    categories, food cards, size options, and selection rules
                    are now managed from dedicated admin modules.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900"
                    >
                      Make Your Plan
                    </button>
                    {customCategories
                      .filter((category) => category.isActive)
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className="rounded-xl border border-zinc-600 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-200"
                        >
                          {category.name}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Category Configuration
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Create, rename, sort, enable, and control single or
                          multi-select rules for each modal category.
                        </p>
                      </div>
                      <Link
                        href="/admin/custom-plan-categories"
                        className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900"
                      >
                        Manage Categories
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {customCategories.map((category) => (
                        <article
                          key={category.id}
                          className="rounded-2xl border border-zinc-700/70 bg-zinc-950/50 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {category.name}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">
                                code: {category.code || "-"} | mode:{" "}
                                {category.selectionMode} | rule:{" "}
                                {category.minSelect} to{" "}
                                {category.maxSelect ?? "unlimited"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">
                                order: {category.displayOrder}
                              </span>
                              <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">
                                status:{" "}
                                {category.isActive ? "active" : "inactive"}
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                      {!customCategories.length ? (
                        <p className="text-sm text-zinc-400">
                          No custom categories configured yet.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Food Card Configuration
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">
                          Manage modal food cards, images, sizes, pricing, and
                          nutrition under each category.
                        </p>
                      </div>
                      <Link
                        href="/admin/custom-plan-food-items"
                        className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900"
                      >
                        Manage Food Items
                      </Link>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                          Active Categories
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {
                            customCategories.filter(
                              (category) => category.isActive,
                            ).length
                          }
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/45 p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                          Active Food Cards
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {
                            customFoodItems.filter((item) => item.isActive)
                              .length
                          }
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {customCategories.map((category) => {
                        const categoryItems = customFoodItems.filter(
                          (item) => item.categoryId === category.id,
                        );
                        return (
                          <article
                            key={`${category.id}-foods`}
                            className="rounded-2xl border border-zinc-700/70 bg-zinc-950/50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {category.name}
                                </p>
                                <p className="mt-1 text-xs text-zinc-400">
                                  {categoryItems.length} food item(s) assigned
                                </p>
                              </div>
                              <span className="rounded-full border border-zinc-600 px-2 py-1 text-xs text-zinc-200">
                                {category.selectionMode}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {categoryItems.slice(0, 4).map((item) => (
                                <span
                                  key={item.id}
                                  className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
                                >
                                  {item.name}
                                </span>
                              ))}
                              {!categoryItems.length ? (
                                <span className="text-xs text-zinc-500">
                                  No food items yet
                                </span>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
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
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                          Week Index
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={selectedWeek.weekIndex}
                          onChange={(event) =>
                            updateWeek(selectedWeek.id, (week) => ({
                              ...week,
                              weekIndex:
                                Number(event.target.value) || week.weekIndex,
                            }))
                          }
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                          Start Day
                        </span>
                        <select
                          value={getWeekDayIndex(selectedWeek.startDate)}
                          onChange={(event) =>
                            updateWeek(selectedWeek.id, (week) =>
                              setWeekStartDay(week, Number(event.target.value)),
                            )
                          }
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        >
                          {weekDayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                          End Day
                        </span>
                        <input
                          value={formatWeekDayLabel(selectedWeek.endDate)}
                          readOnly
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 outline-none"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateWeek(selectedWeek.id, (week) =>
                            syncWeekDates(week),
                          )
                        }
                        className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100"
                      >
                        Sync Days To Range
                      </button>
                      <button
                        type="button"
                        onClick={openCopyMealsModal}
                        disabled={selectedWeekMealCount === 0}
                        className="rounded-xl border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-900/40 disabled:text-zinc-500"
                      >
                        Copy meals to other weeks
                      </button>
                      {draft.weekAssignments.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeWeek(selectedWeek.id)}
                          className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
                        >
                          Remove Week
                        </button>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/40 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                        Assignment Day Picker
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
                        Choose a weekday below instead of using raw calendar
                        dates.
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Use “Copy meals to other weeks” after building one week
                        to repeat the same meal pattern across the plan.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedWeekDates.map((dateIso) => (
                        <button
                          key={dateIso}
                          type="button"
                          onClick={() => setSelectedDate(dateIso)}
                          title={`${formatWeekDayLabel(dateIso)} ${dateIso}`}
                          className={`inline-flex min-w-28 flex-col items-start rounded-xl px-3 py-2 text-left text-xs ${selectedDate === dateIso ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 text-zinc-300"}`}
                        >
                          <span className="font-semibold uppercase">
                            {formatWeekDayLabel(dateIso)}
                          </span>
                          <span className="mt-0.5 text-[11px] opacity-80">
                            {dateIso}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                      <div className="space-y-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                              Meal Library Item
                            </span>
                            <select
                              value={assignmentForm.mealId}
                              onChange={(event) => {
                                const selectedMeal = meals.find(
                                  (meal) => meal.id === event.target.value,
                                );
                                const selectedMealTypes = selectedMeal
                                  ? getMealLibraryTypes(selectedMeal)
                                  : [];
                                setAssignmentForm((prev) => ({
                                  ...prev,
                                  mealId: event.target.value,
                                  mealName:
                                    prev.mealName || selectedMeal?.name || "",
                                  mealType:
                                    selectedMealTypes[0] ?? prev.mealType,
                                  mealTypes: selectedMealTypes.length
                                    ? [selectedMealTypes[0]]
                                    : [],
                                }));
                              }}
                              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                            >
                              <option value="">Select meal</option>
                              {meals.map((meal) => (
                                <option key={meal.id} value={meal.id}>
                                  {meal.name} ({getMealLibraryTypes(meal).join(", ")})
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                              Assign As Meal Types
                            </span>
                            <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-2">
                              {assignmentMealTypes.length ? (
                                assignmentMealTypes.map((type) => {
                                  const isSelected =
                                    assignmentForm.mealTypes.includes(type);
                                  return (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() =>
                                        toggleAssignmentMealType(type)
                                      }
                                      className={`min-h-8 flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:flex-none ${
                                        isSelected
                                          ? "border-amber-300 bg-amber-300 text-zinc-950"
                                          : "border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:border-amber-300/60"
                                      }`}
                                    >
                                      {type}
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="px-2 text-xs text-zinc-500">
                                  Select a meal first to see its allowed types.
                                </span>
                              )}
                            </div>
                            {selectedAssignmentMeal &&
                            assignmentMealTypes.length > 1 ? (
                              <p className="text-xs text-zinc-500">
                                Select one or more slots. Saving will add this
                                meal once for each selected type.
                              </p>
                            ) : null}
                          </div>
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                              Meal Name Override
                            </span>
                            <input
                              value={assignmentForm.mealName}
                              onChange={(event) =>
                                setAssignmentForm((prev) => ({
                                  ...prev,
                                  mealName: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                            />
                          </label>
                          <label className="space-y-1 md:col-span-2">
                            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                              Badges
                            </span>
                            <input
                              value={assignmentForm.badges}
                              onChange={(event) =>
                                setAssignmentForm((prev) => ({
                                  ...prev,
                                  badges: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                            />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveAssignment}
                            disabled={
                              !assignmentForm.mealId ||
                              !selectedAssignmentMeal ||
                              assignmentForm.mealTypes.length === 0
                            }
                            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900"
                          >
                            {assignmentForm.id
                              ? "Update Assigned Meal"
                              : "Add Meal To Date"}
                          </button>
                          {assignmentForm.id ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAssignmentForm(createAssignmentForm())
                              }
                              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100"
                            >
                              Cancel Edit
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-4">
                        <p className="text-sm font-semibold text-white">
                          Meals For {selectedDate || "Selected Date"}
                        </p>
                        {selectedMealsOnDate.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {item.mealName}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {item.mealType} |{" "}
                                  {item.badges.join(", ") || "No badges"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAssignmentForm({
                                      id: item.id,
                                      mealId: item.mealId,
                                      mealName: item.mealName,
                                      mealType: item.mealType,
                                      mealTypes: [item.mealType],
                                      badges: item.badges.join(", "),
                                    })
                                  }
                                  className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateWeek(selectedWeek.id, (week) => ({
                                      ...week,
                                      mealsByDate: {
                                        ...week.mealsByDate,
                                        [selectedDate]: (
                                          week.mealsByDate[selectedDate] ?? []
                                        ).filter((meal) => meal.id !== item.id),
                                      },
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
                        {!selectedMealsOnDate.length ? (
                          <p className="text-sm text-zinc-400">
                            No meals assigned to this date yet.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400">
                    No meal assignments available.
                  </p>
                )}
              </>
            )}
          </div>
        ) : null}

        {activeTab === "regularMeals" && isCustomPlan ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <p className="text-lg font-semibold text-white">
                  Regular Meal Categories
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Manage meal categories (e.g. Lunch, Breakfast, Dinner) shown
                  on the website. Add or remove meals inside each category.
                </p>
              </div>
              <button
                type="button"
                onClick={addRegularMealCategory}
                className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
              >
                + Add Category
              </button>
            </div>

            {/* Category preview pills */}
            {customCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customCategories
                  .filter((c) => c.isActive)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((c) => (
                    <span
                      key={c.id}
                      className="rounded-xl border border-zinc-600 bg-zinc-950/40 px-4 py-2 text-sm text-zinc-200"
                    >
                      {c.name}
                    </span>
                  ))}
              </div>
            ) : null}

            {/* Category blocks */}
            <div className="space-y-6">
              {customCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 py-14 text-center">
                  <p className="text-sm font-medium text-zinc-300">
                    No categories yet
                  </p>
                  <p className="text-xs text-zinc-500">
                    Click &ldquo;+ Add Category&rdquo; to create your first
                    category like Lunch or Breakfast.
                  </p>
                </div>
              ) : (
                customCategories
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((category) => {
                    const categoryItems = customFoodItems
                      .filter((item) => item.categoryId === category.id)
                      .sort((a, b) => a.displayOrder - b.displayOrder);
                    const availableCategoryMeals = meals
                      .filter((meal) => meal.status === "active")
                      .filter((meal) =>
                        mealSupportsCategory(meal, category.name),
                      )
                      .filter(
                        (meal) =>
                          !categoryItems.some(
                            (item) =>
                              item.sourceMealId === meal.id ||
                              item.name.trim().toLowerCase() ===
                                meal.name.trim().toLowerCase(),
                          ),
                      );
                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 overflow-hidden"
                      >
                        {/* Category header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/80 px-5 py-4">
                          <div className="flex flex-1 items-center gap-3">
                            <span className="rounded-full border border-zinc-600 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                              Category
                            </span>
                            <input
                              value={category.name}
                              onChange={(e) =>
                                updateRegularMealCategory(
                                  category.id,
                                  e.target.value,
                                )
                              }
                              className="flex-1 max-w-xs rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-amber-300 transition"
                              placeholder="e.g. LUNCH, BREAKFAST"
                            />
                            <span className="hidden text-xs text-zinc-500 sm:block">
                              {categoryItems.length} meal
                              {categoryItems.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                pickerCategoryId === category.id
                                  ? setPickerCategoryId(null)
                                  : openMealPicker(category.id)
                              }
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                pickerCategoryId === category.id
                                  ? "border-amber-300 bg-amber-300/20 text-amber-200"
                                  : "border-amber-300/40 bg-amber-300/10 text-amber-200 hover:bg-amber-300/20"
                              }`}
                            >
                              + Add Meal
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeRegularMealCategory(category.id)
                              }
                              className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20"
                            >
                              Remove Category
                            </button>
                          </div>
                        </div>

                        {/* Meal cards grid */}
                        <div className="p-5 space-y-4">
                          {/* Inline Meal Library picker */}
                          {pickerCategoryId === category.id ? (
                            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-300/5 px-4 py-3">
                              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">
                                Pick from Meal Library
                              </span>
                              <select
                                value={pickerMealId}
                                onChange={(e) =>
                                  setPickerMealId(e.target.value)
                                }
                                className="flex-1 min-w-[180px] rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                              >
                                <option value="">— Select a meal —</option>
                                {availableCategoryMeals.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({getMealLibraryTypes(m).join(", ")})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={confirmAddMealFromLibrary}
                                disabled={
                                  !pickerMealId ||
                                  availableCategoryMeals.length === 0
                                }
                                className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-40"
                              >
                                Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setPickerCategoryId(null)}
                                className="text-xs text-zinc-500 hover:text-zinc-300"
                              >
                                Cancel
                              </button>
                              {availableCategoryMeals.length === 0 ? (
                                <span className="text-xs text-zinc-500">
                                  All active meals are already assigned.
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          {categoryItems.length === 0 &&
                          pickerCategoryId !== category.id ? (
                            <p className="text-center text-sm text-zinc-500 py-6">
                              No meals yet — click &ldquo;+ Add Meal&rdquo; to
                              pick from the Meal Library.
                            </p>
                          ) : categoryItems.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {categoryItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex flex-col gap-3 rounded-2xl border border-zinc-700/70 bg-zinc-950/60 overflow-hidden"
                                >
                                  {/* Image preview */}
                                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-800">
                                    {item.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "https://placehold.co/400x300?text=No+Image";
                                        }}
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                                        No Image
                                      </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
                                      <p className="truncate text-xs font-semibold text-white">
                                        {item.name}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Fields */}
                                  <div className="space-y-2 px-3 pb-3">
                                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 px-3 py-2">
                                      <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                                        Meal Name
                                      </span>
                                      <p className="mt-1 text-sm font-medium text-white">
                                        {item.name}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 px-3 py-2">
                                      <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                                        Image Source
                                      </span>
                                      <p className="mt-1 truncate text-xs text-zinc-300">
                                        {item.imageUrl || "No image"}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeRegularFoodItem(item.id)
                                      }
                                      className="mt-1 w-full rounded-lg border border-rose-400/30 bg-rose-500/10 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20"
                                    >
                                      Remove Meal
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
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
      {saveMessage ? (
        <p className="text-sm text-emerald-300">{saveMessage}</p>
      ) : null}

      {isCopyMealsModalOpen && selectedWeek && draft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl shadow-black/50 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                  Copy meal pattern
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Copy Week {selectedWeek.weekIndex} meals
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Select the weeks where you want to paste this week’s meals.
                  Target weeks will be replaced with the copied day-by-day
                  pattern.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCopyMealsModal}
                className="self-start rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300 transition hover:border-zinc-500"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Target weeks
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {copyTargetWeekIds.length} selected
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCopyTargetWeekIds(
                        draft.weekAssignments
                          .filter((week) => week.id !== selectedWeek.id)
                          .map((week) => week.id),
                      )
                    }
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-amber-300/60"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setCopyTargetWeekIds([])}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-zinc-500"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={addCopyTargetWeek}
                    className="rounded-lg border border-amber-300/50 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20"
                  >
                    + Add new week
                  </button>
                </div>
              </div>

              <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {draft.weekAssignments
                  .filter((week) => week.id !== selectedWeek.id)
                  .sort((a, b) => a.weekIndex - b.weekIndex)
                  .map((week) => {
                    const isSelected = copyTargetWeekIds.includes(week.id);
                    return (
                      <label
                        key={week.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                          isSelected
                            ? "border-amber-300 bg-amber-300/10"
                            : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCopyTargetWeek(week.id)}
                          className="mt-1 h-4 w-4 accent-amber-300"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-white">
                            Week {week.weekIndex}
                          </span>
                          <span className="mt-1 block text-xs text-zinc-500">
                            {week.startDate} to {week.endDate}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                {draft.weekAssignments.length <= 1 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400 sm:col-span-2">
                    No target weeks yet. Click “Add new week” to create one.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCopyMealsModal}
                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={copySelectedWeekToTargets}
                disabled={copyTargetWeekIds.length === 0}
                className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy to selected weeks
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/75 px-4 py-3 backdrop-blur">
        <p className="hidden text-sm text-zinc-400 md:block">
          Save changes after updating the meal plan configuration.
        </p>
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={isSaving}
          className="rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Meal Plan"}
        </button>
      </div>
    </section>
  );
}
