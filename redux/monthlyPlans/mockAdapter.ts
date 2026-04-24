import type {
  CustomPlanCategory,
  CustomPlanFoodItem,
  CustomPlanFoodSize,
  LocationRecord,
  MealLibraryItem,
  MonthlyPlanDetails,
  MonthlyPlan,
  MonthlyPlanEntities,
  MonthlyPlanGlobalSettings,
  MonthlyPlanOverview,
  OrderRecord,
  PlanKind,
  SubscriptionRecord,
  WeekAssignment
} from "./types";

type ListFilters = {
  kind?: PlanKind | "all";
  status?: MonthlyPlan["status"] | "all";
  search?: string;
};

type CustomPlanCategoryPayload = Omit<CustomPlanCategory, "id" | "slug" | "displayOrder"> & { id?: string; slug?: string; displayOrder?: number };
type CustomPlanFoodItemPayload = Omit<CustomPlanFoodItem, "id" | "displayOrder" | "sizes"> & {
  id?: string;
  displayOrder?: number;
  sizes: Array<Omit<CustomPlanFoodSize, "id" | "foodItemId" | "displayOrder"> & { id?: string; displayOrder?: number }>;
};

const today = "2026-03-08";

const entities: MonthlyPlanEntities = {
  plans: {
    "plan-custom-core": {
      id: "plan-custom-core",
      slug: "custom-core",
      title: "Custom Plan",
      description: "Flexible monthly setup with configurable meals, days, snacks, and delivery rules.",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200",
      badge: "Best Seller",
      status: "active",
      planKind: "custom",
      frequency: "weekly",
      createdAt: "2026-01-11T09:00:00Z",
      updatedAt: "2026-03-06T10:30:00Z",
      ruleConfigId: "rule-custom-core",
      pricingConfigId: "pricing-custom-core",
      content: {
        heroTitle: "Build your personalized monthly nutrition plan",
        heroSubtitle: "Choose meals, days and snacks based on your goal.",
        selectMealsText: "Pick meals by week/date. Changes apply instantly to your checkout.",
        checkoutText: "Review your selections and confirm your preferred delivery option.",
        customStepTwo: {
          categories: [],
          foodItems: []
        }
      },
      weekAssignmentIds: ["wa-custom-week1", "wa-custom-week2"]
    },
    "plan-normal-lean": {
      id: "plan-normal-lean",
      slug: "lean-balance",
      title: "Lean Balance Plan",
      description: "Pre-made balanced plan with weekly meal assignment for predictable operations.",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200",
      badge: "Pre-made",
      status: "active",
      planKind: "normal",
      frequency: "monthly",
      createdAt: "2025-12-22T06:00:00Z",
      updatedAt: "2026-03-05T14:20:00Z",
      ruleConfigId: "rule-normal-lean",
      pricingConfigId: "pricing-normal-lean",
      content: {
        heroTitle: "Structured monthly meal plan",
        heroSubtitle: "No decisions needed. Curated weekly menus are ready.",
        selectMealsText: "Pick from assigned meals for each date and meal type.",
        checkoutText: "Confirm your pickup/delivery mode and complete the subscription."
      },
      weekAssignmentIds: ["wa-normal-week1", "wa-normal-week2"]
    }
  },
  rules: {
    "rule-custom-core": {
      id: "rule-custom-core",
      planId: "plan-custom-core",
      allowedMealsPerDay: [1, 2, 3, 4],
      allowedDays: [3, 4, 5, 6],
      allowedSnacks: [0, 1, 2],
      planTypeOptions: ["lose-weight", "gain-weight", "maintenance"],
      deliveryDaysRule: {
        min: 2,
        max: 6,
        allowedWeekDays: [0, 1, 2, 3, 4, 5, 6]
      },
      defaults: {
        meals: 3,
        days: 5,
        snacks: 1,
        planType: "maintenance",
        deliveryDays: [1, 3, 5]
      },
      deliveryOptionConfigs: [
        { option: "daily-delivery", enabled: true, label: "Daily Delivery", serviceFee: 20, minDays: 3, maxDays: 7 },
        { option: "daily-pickup", enabled: true, label: "Daily Pickup", serviceFee: 0, minDays: 3, maxDays: 7 },
        { option: "weekly-delivery", enabled: true, label: "Weekly Delivery", serviceFee: 10, minDays: 3, maxDays: 7 },
        { option: "weekly-pickup", enabled: true, label: "Weekly Pickup", serviceFee: 0, minDays: 3, maxDays: 7 }
      ]
    },
    "rule-normal-lean": {
      id: "rule-normal-lean",
      planId: "plan-normal-lean",
      allowedMealsPerDay: [2, 3],
      allowedDays: [5, 6],
      allowedSnacks: [0, 1],
      planTypeOptions: [],
      deliveryDaysRule: {
        min: 2,
        max: 6,
        allowedWeekDays: [0, 1, 2, 3, 4, 5, 6]
      },
      defaults: {
        meals: 3,
        days: 6,
        snacks: 0,
        deliveryDays: [0, 1, 2, 3, 4, 5]
      },
      deliveryOptionConfigs: [
        { option: "daily-delivery", enabled: true, label: "Daily Delivery", serviceFee: 15, minDays: 4, maxDays: 7 },
        { option: "daily-pickup", enabled: false, label: "Daily Pickup", serviceFee: 0, minDays: 4, maxDays: 7 },
        { option: "weekly-delivery", enabled: true, label: "Weekly Delivery", serviceFee: 8, minDays: 4, maxDays: 7 },
        { option: "weekly-pickup", enabled: true, label: "Weekly Pickup", serviceFee: 0, minDays: 4, maxDays: 7 }
      ]
    }
  },
  pricing: {
    "pricing-custom-core": {
      id: "pricing-custom-core",
      planId: "plan-custom-core",
      basePriceFormula: {
        baseFee: 120,
        pricePerMeal: 5.5,
        dayMultiplier: 1.15
      },
      snacksAddonPrice: 2.5,
      vatPercent: 15,
      safetyBagFee: 2,
      giftCodeRule: {
        type: "percent",
        value: 10,
        maxDiscount: 30,
        enabled: true
      }
    },
    "pricing-normal-lean": {
      id: "pricing-normal-lean",
      planId: "plan-normal-lean",
      basePriceFormula: {
        baseFee: 150,
        pricePerMeal: 6.25,
        dayMultiplier: 1.1
      },
      snacksAddonPrice: 2,
      vatPercent: 15,
      safetyBagFee: 2,
      giftCodeRule: {
        type: "fixed",
        value: 15,
        maxDiscount: 15,
        enabled: true
      }
    }
  },
  weekAssignments: {},
  mealLibrary: {
    "meal-b1": {
      id: "meal-b1",
      name: "Greek Yogurt Bowl",
      mealType: "Breakfast",
      calories: 390,
      protein: 31,
      carbs: 32,
      fat: 14,
      tags: ["Low", "Protein"],
      status: "active"
    },
    "meal-l1": {
      id: "meal-l1",
      name: "Chicken Burrito Bowl",
      mealType: "Lunch",
      calories: 520,
      protein: 38,
      carbs: 46,
      fat: 18,
      tags: ["High", "Balanced"],
      status: "active"
    },
    "meal-d1": {
      id: "meal-d1",
      name: "Salmon Rice Plate",
      mealType: "Dinner",
      calories: 560,
      protein: 35,
      carbs: 48,
      fat: 22,
      tags: ["Omega-3"],
      status: "active"
    },
    "meal-s1": {
      id: "meal-s1",
      name: "Protein Smoothie",
      mealType: "Snack",
      calories: 240,
      protein: 24,
      carbs: 18,
      fat: 6,
      tags: ["Low Sugar"],
      status: "active"
    }
  },
  customPlanCategories: {},
  customPlanFoodItems: {},
  subscriptions: {
    "sub-1001": {
      id: "sub-1001",
      subscriptionId: "SUB-1001",
      customerName: "John Carter",
      customerPhone: "+1 202 555 0158",
      planId: "plan-custom-core",
      planTitle: "Custom Plan",
      planKind: "custom",
      status: "active",
      startDate: "2026-04-14",
      endDate: "2026-05-14",
      currentWeek: 2,
      totalWeeks: 4,
      progressDays: "2/5",
      remainingMeals: 22,
      selections: {
        meals: 3,
        days: 5,
        snacks: 1,
        startDate: "2026-04-14",
        deliveryDays: [1, 3, 5],
        planType: "lose-weight",
        deliveryOption: "daily-delivery"
      }
    },
    "sub-1002": {
      id: "sub-1002",
      subscriptionId: "SUB-1002",
      customerName: "Lina Smith",
      customerPhone: "+1 202 555 0122",
      planId: "plan-normal-lean",
      planTitle: "Lean Balance Plan",
      planKind: "normal",
      status: "paused",
      startDate: "2026-04-01",
      endDate: "2026-05-20",
      currentWeek: 3,
      totalWeeks: 6,
      progressDays: "3/6",
      remainingMeals: 27,
      selections: {
        meals: 3,
        days: 6,
        snacks: 0,
        startDate: "2026-04-01",
        deliveryDays: [0, 1, 2, 3, 4, 5],
        deliveryOption: "weekly-pickup"
      }
    }
  },
  orders: {
    "ord-501": {
      id: "ord-501",
      orderId: "ORD-501",
      subscriptionId: "SUB-1001",
      customerName: "John Carter",
      planId: "plan-custom-core",
      planTitle: "Custom Plan",
      planKind: "custom",
      status: "pending",
      paymentStatus: "paid",
      amount: 28.5,
      orderDate: today,
      deliveryOption: "daily-delivery",
      locationId: "loc-1",
      locationName: "Downtown Hub",
      items: [
        { mealId: "meal-b1", mealName: "Greek Yogurt Bowl", qty: 1, mealType: "Breakfast" },
        { mealId: "meal-l1", mealName: "Chicken Burrito Bowl", qty: 1, mealType: "Lunch" }
      ]
    },
    "ord-502": {
      id: "ord-502",
      orderId: "ORD-502",
      subscriptionId: "SUB-1002",
      customerName: "Lina Smith",
      planId: "plan-normal-lean",
      planTitle: "Lean Balance Plan",
      planKind: "normal",
      status: "confirmed",
      paymentStatus: "cod",
      amount: 34,
      orderDate: "2026-03-07",
      deliveryOption: "weekly-pickup",
      locationId: "loc-2",
      locationName: "Uptown Pickup Point",
      items: [
        { mealId: "meal-l1", mealName: "Chicken Burrito Bowl", qty: 1, mealType: "Lunch" },
        { mealId: "meal-d1", mealName: "Salmon Rice Plate", qty: 1, mealType: "Dinner" }
      ]
    }
  },
  locations: {
    "loc-1": {
      id: "loc-1",
      name: "Downtown Hub",
      type: "both",
      address: "122 Market St, NY",
      phone: "+1 202 555 0199",
      googleMapsUrl: "https://maps.google.com/?q=122+Market+St+NY",
      ratingText: "Rated 4.5/5 based on 318 reviews",
      isActive: true,
      deliveryFee: 4,
      cutoffTime: "10:00",
      supportedOptions: ["daily-delivery", "weekly-delivery", "daily-pickup", "weekly-pickup"]
    },
    "loc-2": {
      id: "loc-2",
      name: "Uptown Pickup Point",
      type: "pickup",
      address: "77 W 56th St, NY",
      phone: "+1 202 555 0142",
      googleMapsUrl: "https://maps.google.com/?q=77+W+56th+St+NY",
      ratingText: "Rated 4.7/5 based on 146 reviews",
      isActive: true,
      deliveryFee: 0,
      cutoffTime: "16:00",
      supportedOptions: ["daily-pickup", "weekly-pickup"]
    }
  },
  settings: {
    id: "monthly-plan-settings",
    weeklyCycleCount: 4,
    maxActivePlansPerKind: 6,
    currencyCode: "USD",
    defaultVatPercent: 15,
    defaultSafetyBagFee: 2,
    enforceActivePlanVisibility: true,
    allowMixedDeliveryModes: false
  }
};

const addDays = (isoDate: string, days: number) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const buildWeekKeys = (startDate: string) => Array.from({ length: 7 }, (_, index) => addDays(startDate, index));

const weekTwoKeys = buildWeekKeys("2026-03-15");

const customWeekOne: WeekAssignment = {
  id: "wa-custom-week1",
  planId: "plan-custom-core",
  weekIndex: 1,
  startDate: "2026-03-08",
  endDate: "2026-03-14",
  mealsByDate: {
    "2026-03-08": [],
    "2026-03-09": [],
    "2026-03-10": [{ id: "am1", mealId: "meal-l1", mealName: "Chicken Burrito Bowl", mealType: "Lunch", date: "2026-03-10", badges: ["High"] }],
    "2026-03-11": [{ id: "am2", mealId: "meal-d1", mealName: "Salmon Rice Plate", mealType: "Dinner", date: "2026-03-11", badges: ["Low"] }],
    "2026-03-12": [{ id: "am3", mealId: "meal-b1", mealName: "Greek Yogurt Bowl", mealType: "Breakfast", date: "2026-03-12", badges: ["Low"] }],
    "2026-03-13": [{ id: "am4", mealId: "meal-s1", mealName: "Protein Smoothie", mealType: "Snack", date: "2026-03-13", badges: ["Low"] }],
    "2026-03-14": []
  }
};

const customWeekTwo: WeekAssignment = {
  id: "wa-custom-week2",
  planId: "plan-custom-core",
  weekIndex: 2,
  startDate: "2026-03-15",
  endDate: "2026-03-21",
  mealsByDate: weekTwoKeys.reduce<Record<string, WeekAssignment["mealsByDate"][string]>>((acc, day) => {
    acc[day] = [];
    return acc;
  }, {})
};

const normalWeekOne: WeekAssignment = {
  id: "wa-normal-week1",
  planId: "plan-normal-lean",
  weekIndex: 1,
  startDate: "2026-03-08",
  endDate: "2026-03-14",
  mealsByDate: {
    "2026-03-08": [],
    "2026-03-09": [],
    "2026-03-10": [
      { id: "am5", mealId: "meal-b1", mealName: "Greek Yogurt Bowl", mealType: "Breakfast", date: "2026-03-10", badges: ["Low"] },
      { id: "am6", mealId: "meal-l1", mealName: "Chicken Burrito Bowl", mealType: "Lunch", date: "2026-03-10", badges: ["High"] }
    ],
    "2026-03-11": [
      { id: "am7", mealId: "meal-l1", mealName: "Chicken Burrito Bowl", mealType: "Lunch", date: "2026-03-11", badges: ["High"] },
      { id: "am8", mealId: "meal-d1", mealName: "Salmon Rice Plate", mealType: "Dinner", date: "2026-03-11", badges: ["Omega-3"] }
    ],
    "2026-03-12": [],
    "2026-03-13": [],
    "2026-03-14": []
  }
};

const normalWeekTwo: WeekAssignment = {
  id: "wa-normal-week2",
  planId: "plan-normal-lean",
  weekIndex: 2,
  startDate: "2026-03-15",
  endDate: "2026-03-21",
  mealsByDate: weekTwoKeys.reduce<Record<string, WeekAssignment["mealsByDate"][string]>>((acc, day) => {
    acc[day] = [];
    return acc;
  }, {})
};

entities.weekAssignments[customWeekOne.id] = customWeekOne;
entities.weekAssignments[customWeekTwo.id] = customWeekTwo;
entities.weekAssignments[normalWeekOne.id] = normalWeekOne;
entities.weekAssignments[normalWeekTwo.id] = normalWeekTwo;

const seededCustomPlanCategories: CustomPlanCategory[] = [
  {
    id: "cat-protein",
    planId: "plan-custom-core",
    name: "Proteins",
    slug: "proteins",
    code: "protein",
    displayOrder: 1,
    selectionMode: "single",
    isActive: true,
    isRequired: true,
    minSelect: 1,
    maxSelect: 1
  },
  {
    id: "cat-carbs",
    planId: "plan-custom-core",
    name: "Carbs",
    slug: "carbs",
    code: "carbs",
    displayOrder: 2,
    selectionMode: "single",
    isActive: true,
    isRequired: true,
    minSelect: 1,
    maxSelect: 1
  },
  {
    id: "cat-fat",
    planId: "plan-custom-core",
    name: "Fat",
    slug: "fat",
    code: "fat",
    displayOrder: 3,
    selectionMode: "multi",
    isActive: true,
    isRequired: false,
    minSelect: 0,
    maxSelect: 2
  },
  {
    id: "cat-sauces",
    planId: "plan-custom-core",
    name: "Sauces",
    slug: "sauces",
    code: "sauce",
    displayOrder: 4,
    selectionMode: "multi",
    isActive: true,
    isRequired: false,
    minSelect: 0,
    maxSelect: 2
  }
];

const seededCustomPlanFoodItems: CustomPlanFoodItem[] = [
  {
    id: "food-chicken",
    planId: "plan-custom-core",
    categoryId: "cat-protein",
    name: "Chicken Breast",
    imageUrl: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600",
    description: "Lean grilled chicken breast.",
    displayOrder: 1,
    isActive: true,
    sizes: [
      { id: "size-chicken-100", foodItemId: "food-chicken", label: "100g", unit: "g", price: 35, calories: 165, protein: 31, carbs: 0, fat: 3.6, displayOrder: 1, isActive: true },
      { id: "size-chicken-150", foodItemId: "food-chicken", label: "150g", unit: "g", price: 48, calories: 248, protein: 46.5, carbs: 0, fat: 5.4, displayOrder: 2, isActive: true }
    ]
  },
  {
    id: "food-rice",
    planId: "plan-custom-core",
    categoryId: "cat-carbs",
    name: "Rice",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
    description: "Steamed basmati rice.",
    displayOrder: 1,
    isActive: true,
    sizes: [
      { id: "size-rice-100", foodItemId: "food-rice", label: "100g", unit: "g", price: 12, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, displayOrder: 1, isActive: true },
      { id: "size-rice-150", foodItemId: "food-rice", label: "150g", unit: "g", price: 16, calories: 195, protein: 4, carbs: 42, fat: 0.5, displayOrder: 2, isActive: true }
    ]
  },
  {
    id: "food-avocado",
    planId: "plan-custom-core",
    categoryId: "cat-fat",
    name: "Avocado",
    imageUrl: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=600",
    description: "Fresh sliced avocado.",
    displayOrder: 1,
    isActive: true,
    sizes: [
      { id: "size-avocado-50", foodItemId: "food-avocado", label: "50g", unit: "g", price: 18, calories: 80, protein: 1, carbs: 4, fat: 7.4, displayOrder: 1, isActive: true }
    ]
  },
  {
    id: "food-bbq",
    planId: "plan-custom-core",
    categoryId: "cat-sauces",
    name: "BBQ Sauce",
    imageUrl: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600",
    description: "Smoky house BBQ sauce.",
    displayOrder: 1,
    isActive: true,
    sizes: [
      { id: "size-bbq-30", foodItemId: "food-bbq", label: "30ml", unit: "ml", price: 4, calories: 35, protein: 0, carbs: 8, fat: 0, displayOrder: 1, isActive: true }
    ]
  }
];

seededCustomPlanCategories.forEach((category) => {
  entities.customPlanCategories[category.id] = category;
});

seededCustomPlanFoodItems.forEach((item) => {
  entities.customPlanFoodItems[item.id] = item;
});

const asArray = <T>(record: Record<string, T>) => Object.values(record);

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `item-${Date.now()}`;

const wait = async <T>(value: T, ms = 160) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

export type MonthlyPlanDetailsPayload = MonthlyPlanDetails;

const normalizeContent = (content?: MonthlyPlan["content"]): NonNullable<MonthlyPlan["content"]> => ({
  heroTitle: content?.heroTitle ?? "",
  heroSubtitle: content?.heroSubtitle ?? "",
  selectMealsText: content?.selectMealsText ?? "",
  checkoutText: content?.checkoutText ?? "",
  ...(content?.customStepTwo
    ? {
        customStepTwo: {
          categories: content.customStepTwo.categories.map((category) => ({
            ...category,
            maxSelect: category.maxSelect ?? null
          })),
          foodItems: content.customStepTwo.foodItems.map((item) => ({
            ...item,
            sizes: item.sizes.map((size) => ({ ...size }))
          }))
        }
      }
    : {})
});

const cloneCustomPlanCategory = (category: CustomPlanCategory): CustomPlanCategory => ({
  ...category,
  maxSelect: category.maxSelect ?? null
});

const cloneCustomPlanFoodItem = (item: CustomPlanFoodItem): CustomPlanFoodItem => ({
  ...item,
  sizes: item.sizes.map((size) => ({ ...size }))
});

const cloneMeal = (meal: MealLibraryItem): MealLibraryItem => ({
  ...meal,
  tags: [...meal.tags]
});

const cloneWeekAssignment = (assignment: WeekAssignment): WeekAssignment => ({
  ...assignment,
  mealsByDate: Object.fromEntries(
    Object.entries(assignment.mealsByDate).map(([dateIso, meals]) => [
      dateIso,
      meals.map((meal) => ({ ...meal, badges: [...meal.badges] }))
    ])
  )
});

const getCustomPlanCategoriesForPlan = (planId: string) =>
  asArray(entities.customPlanCategories)
    .filter((category) => category.planId === planId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(cloneCustomPlanCategory);

const getCustomPlanFoodItemsForPlan = (planId: string) =>
  asArray(entities.customPlanFoodItems)
    .filter((item) => item.planId === planId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(cloneCustomPlanFoodItem);

const normalizePlan = (plan: MonthlyPlan): MonthlyPlan => ({
  ...plan,
  content: {
    ...normalizeContent(plan.content),
    ...(plan.planKind === "custom"
      ? {
          customStepTwo: {
            categories: getCustomPlanCategoriesForPlan(plan.id),
            foodItems: getCustomPlanFoodItemsForPlan(plan.id)
          }
        }
      : {})
  },
  weekAssignmentIds: [...plan.weekAssignmentIds]
});

const cloneDetails = (payload: MonthlyPlanDetailsPayload): MonthlyPlanDetailsPayload => ({
  plan: normalizePlan(payload.plan),
  rules: {
    ...payload.rules,
    allowedMealsPerDay: [...payload.rules.allowedMealsPerDay],
    allowedDays: [...payload.rules.allowedDays],
    allowedSnacks: [...payload.rules.allowedSnacks],
    planTypeOptions: [...payload.rules.planTypeOptions],
    deliveryDaysRule: {
      ...payload.rules.deliveryDaysRule,
      allowedWeekDays: [...payload.rules.deliveryDaysRule.allowedWeekDays]
    },
    defaults: {
      ...payload.rules.defaults,
      deliveryDays: [...payload.rules.defaults.deliveryDays]
    },
    deliveryOptionConfigs: payload.rules.deliveryOptionConfigs.map((config) => ({ ...config }))
  },
  pricing: {
    ...payload.pricing,
    basePriceFormula: { ...payload.pricing.basePriceFormula },
    giftCodeRule: { ...payload.pricing.giftCodeRule }
  },
  weekAssignments: payload.weekAssignments.map(cloneWeekAssignment),
  mealLibrary: (payload.mealLibrary ?? asArray(entities.mealLibrary)).map(cloneMeal)
});

const ensureValidDetailPayload = (payload: MonthlyPlanDetailsPayload) => {
  const mealIds = new Set((payload.mealLibrary ?? []).map((meal) => meal.id));
  const deliveryOptionSet = new Set<string>();

  if (!payload.plan.title.trim()) throw new Error("Title is required.");
  if (!payload.plan.slug.trim()) throw new Error("Slug is required.");
  if (!payload.plan.planKind) throw new Error("Plan kind is required.");

  if (payload.rules.defaults.meals && !payload.rules.allowedMealsPerDay.includes(payload.rules.defaults.meals)) {
    throw new Error("Default meals must exist in allowed meals/day.");
  }
  if (payload.rules.defaults.days && !payload.rules.allowedDays.includes(payload.rules.defaults.days)) {
    throw new Error("Default days must exist in allowed days.");
  }
  if (!payload.rules.allowedSnacks.includes(payload.rules.defaults.snacks)) {
    throw new Error("Default snacks must exist in allowed snacks.");
  }
  if (payload.rules.defaults.planType && !payload.rules.planTypeOptions.includes(payload.rules.defaults.planType)) {
    throw new Error("Default plan type must exist in plan type options.");
  }
  if (payload.rules.deliveryDaysRule.allowedWeekDays.some((day) => day < 0 || day > 6)) {
    throw new Error("Allowed week days must stay within 0-6.");
  }
  if (payload.rules.defaults.deliveryDays.some((day) => !payload.rules.deliveryDaysRule.allowedWeekDays.includes(day))) {
    throw new Error("Default delivery days must exist in allowed week days.");
  }

  payload.rules.deliveryOptionConfigs.forEach((config) => {
    if (deliveryOptionSet.has(config.option)) {
      throw new Error("Delivery option configs must not contain duplicates.");
    }
    deliveryOptionSet.add(config.option);
  });

  payload.weekAssignments.forEach((week) => {
    if (week.startDate > week.endDate) {
      throw new Error(`Week ${week.weekIndex} start date must be before end date.`);
    }
    Object.entries(week.mealsByDate).forEach(([dateIso, meals]) => {
      if (dateIso < week.startDate || dateIso > week.endDate) {
        throw new Error(`Assigned date ${dateIso} must stay inside week ${week.weekIndex}.`);
      }
      meals.forEach((meal) => {
        if (!mealIds.has(meal.mealId)) {
          throw new Error(`Assigned meal ${meal.mealName} references a missing meal library item.`);
        }
      });
    });
  });

  payload.plan.content?.customStepTwo?.categories.forEach((category) => {
    if (!category.name.trim()) throw new Error("Custom plan category name is required.");
    if (category.selectionMode === "single" && category.maxSelect !== null && category.maxSelect !== undefined && category.maxSelect !== 1) {
      throw new Error(`Category ${category.name} must have max select 1 when single-select.`);
    }
    if ((category.maxSelect ?? null) !== null && category.minSelect > (category.maxSelect ?? 0)) {
      throw new Error(`Category ${category.name} has invalid min/max selection rules.`);
    }
  });

  payload.plan.content?.customStepTwo?.foodItems.forEach((item) => {
    if (!item.name.trim()) throw new Error("Custom plan food item name is required.");
    if (!payload.plan.content?.customStepTwo?.categories.some((category) => category.id === item.categoryId)) {
      throw new Error(`Food item ${item.name} references a missing category.`);
    }
    if (!item.imageUrl.trim()) throw new Error(`Food item ${item.name} requires an image URL.`);
    if (!item.sizes.length) throw new Error(`Food item ${item.name} requires at least one size.`);
    item.sizes.forEach((size) => {
      if (!size.label.trim()) throw new Error(`Food item ${item.name} has a size without label.`);
      if ([size.price, size.calories, size.protein, size.carbs, size.fat].some((value) => value < 0)) {
        throw new Error(`Food item ${item.name} has invalid negative size values.`);
      }
    });
  });
};

export const monthlyPlanMockAdapter = {
  async getOverview(): Promise<MonthlyPlanOverview> {
    const plans = asArray(entities.plans);
    const subscriptions = asArray(entities.subscriptions);
    const orders = asArray(entities.orders);
    const meals = asArray(entities.mealLibrary);

    return wait({
      activePlans: plans.filter((plan) => plan.status === "active").length,
      customPlans: plans.filter((plan) => plan.planKind === "custom").length,
      normalPlans: plans.filter((plan) => plan.planKind === "normal").length,
      activeSubscriptions: subscriptions.filter((subscription) => subscription.status === "active").length,
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      activeMeals: meals.filter((meal) => meal.status === "active").length
    });
  },

  async listPlans(filters: ListFilters): Promise<MonthlyPlan[]> {
    const search = (filters.search ?? "").trim().toLowerCase();
    const list = asArray(entities.plans).filter((plan) => {
      const matchKind = !filters.kind || filters.kind === "all" || plan.planKind === filters.kind;
      const matchStatus = !filters.status || filters.status === "all" || plan.status === filters.status;
      const matchSearch = !search || `${plan.title} ${plan.description}`.toLowerCase().includes(search);
      return matchKind && matchStatus && matchSearch;
    });

    return wait(list.sort((a, b) => a.title.localeCompare(b.title)));
  },

  async getPlanById(id: string): Promise<MonthlyPlanDetailsPayload | null> {
    const plan = entities.plans[id];
    if (!plan) return wait(null);

    return wait(cloneDetails({
      plan: normalizePlan(plan),
      rules: entities.rules[plan.ruleConfigId],
      pricing: entities.pricing[plan.pricingConfigId],
      weekAssignments: plan.weekAssignmentIds.map((item) => entities.weekAssignments[item]).filter(Boolean),
      mealLibrary: asArray(entities.mealLibrary).sort((a, b) => a.name.localeCompare(b.name))
    }));
  },

  async upsertPlanDetails(payload: MonthlyPlanDetailsPayload): Promise<MonthlyPlanDetailsPayload> {
    const normalizedPayload = cloneDetails(payload);
    ensureValidDetailPayload(normalizedPayload);
    const now = new Date().toISOString();
    const plan = normalizePlan({ ...normalizedPayload.plan, updatedAt: now });

    entities.plans[plan.id] = plan;
    entities.rules[normalizedPayload.rules.id] = normalizedPayload.rules;
    entities.pricing[normalizedPayload.pricing.id] = normalizedPayload.pricing;

    (normalizedPayload.mealLibrary ?? []).forEach((meal) => {
      entities.mealLibrary[meal.id] = cloneMeal(meal);
    });

    normalizedPayload.weekAssignments.forEach((assignment) => {
      entities.weekAssignments[assignment.id] = cloneWeekAssignment(assignment);
    });

    if (normalizedPayload.plan.planKind === "custom") {
      asArray(entities.customPlanCategories)
        .filter((category) => category.planId === plan.id)
        .forEach((category) => {
          delete entities.customPlanCategories[category.id];
        });

      asArray(entities.customPlanFoodItems)
        .filter((item) => item.planId === plan.id)
        .forEach((item) => {
          delete entities.customPlanFoodItems[item.id];
        });

      normalizedPayload.plan.content?.customStepTwo?.categories.forEach((category, index) => {
        entities.customPlanCategories[category.id] = cloneCustomPlanCategory({
          ...category,
          planId: plan.id,
          displayOrder: category.displayOrder ?? index + 1,
          slug: category.slug || slugify(category.name)
        });
      });

      normalizedPayload.plan.content?.customStepTwo?.foodItems.forEach((item, index) => {
        entities.customPlanFoodItems[item.id] = cloneCustomPlanFoodItem({
          ...item,
          planId: plan.id,
          displayOrder: item.displayOrder ?? index + 1,
          sizes: item.sizes.map((size, sizeIndex) => ({
            ...size,
            foodItemId: item.id,
            displayOrder: size.displayOrder ?? sizeIndex + 1
          }))
        });
      });
    }

    entities.plans[plan.id].weekAssignmentIds = normalizedPayload.weekAssignments.map((item) => item.id);

    return wait(
      cloneDetails({
        plan: entities.plans[plan.id],
        rules: entities.rules[normalizedPayload.rules.id],
        pricing: entities.pricing[normalizedPayload.pricing.id],
        weekAssignments: normalizedPayload.weekAssignments.map((item) => entities.weekAssignments[item.id]),
        mealLibrary: asArray(entities.mealLibrary).sort((a, b) => a.name.localeCompare(b.name))
      })
    );
  },

  async archivePlan(id: string): Promise<{ id: string; status: MonthlyPlan["status"] } | null> {
    const plan = entities.plans[id];
    if (!plan) return wait(null);
    entities.plans[id] = { ...plan, status: "archived", updatedAt: new Date().toISOString() };
    return wait({ id, status: entities.plans[id].status });
  },

  async deletePlan(id: string): Promise<{ id: string } | null> {
    const plan = entities.plans[id];
    if (!plan) return wait(null);

    delete entities.rules[plan.ruleConfigId];
    delete entities.pricing[plan.pricingConfigId];
    plan.weekAssignmentIds.forEach((assignmentId) => {
      delete entities.weekAssignments[assignmentId];
    });
    delete entities.plans[id];

    return wait({ id });
  },

  async listMealLibrary(): Promise<MealLibraryItem[]> {
    return wait(asArray(entities.mealLibrary).sort((a, b) => a.name.localeCompare(b.name)));
  },

  async upsertMealLibraryItem(item: MealLibraryItem): Promise<MealLibraryItem> {
    entities.mealLibrary[item.id] = item;
    return wait(entities.mealLibrary[item.id]);
  },

  async deleteMealLibraryItem(id: string): Promise<{ id: string }> {
    delete entities.mealLibrary[id];
    return wait({ id });
  },

  async listCustomPlanCategories(planId: string): Promise<CustomPlanCategory[]> {
    return wait(getCustomPlanCategoriesForPlan(planId));
  },

  async upsertCustomPlanCategory(payload: CustomPlanCategoryPayload): Promise<CustomPlanCategory> {
    const existing = payload.id ? entities.customPlanCategories[payload.id] : null;
    if (!payload.name.trim()) throw new Error("Category name is required.");
    if (!payload.planId.trim()) throw new Error("Plan is required for category.");

    const siblingCategories = asArray(entities.customPlanCategories).filter(
      (category) => category.planId === payload.planId && category.id !== payload.id
    );

    const nextCategory: CustomPlanCategory = {
      id: payload.id || `custom-category-${Date.now()}`,
      planId: payload.planId,
      name: payload.name.trim(),
      slug: payload.slug?.trim() || slugify(payload.name),
      code: payload.code?.trim() || undefined,
      displayOrder: payload.displayOrder ?? existing?.displayOrder ?? siblingCategories.length + 1,
      selectionMode: payload.selectionMode,
      isActive: payload.isActive,
      isRequired: payload.isRequired,
      minSelect: payload.minSelect,
      maxSelect: payload.maxSelect ?? null
    };

    if (nextCategory.selectionMode === "single") nextCategory.maxSelect = 1;
    if (nextCategory.minSelect < 0) throw new Error("Min select cannot be negative.");
    if ((nextCategory.maxSelect ?? null) !== null && nextCategory.minSelect > (nextCategory.maxSelect ?? 0)) {
      throw new Error("Min select must be less than or equal to max select.");
    }

    entities.customPlanCategories[nextCategory.id] = cloneCustomPlanCategory(nextCategory);
    return wait(cloneCustomPlanCategory(entities.customPlanCategories[nextCategory.id]));
  },

  async deleteCustomPlanCategory(id: string): Promise<{ id: string }> {
    delete entities.customPlanCategories[id];
    asArray(entities.customPlanFoodItems)
      .filter((item) => item.categoryId === id)
      .forEach((item) => {
        delete entities.customPlanFoodItems[item.id];
      });
    return wait({ id });
  },

  async reorderCustomPlanCategories(planId: string, categoryIds: string[]): Promise<CustomPlanCategory[]> {
    categoryIds.forEach((id, index) => {
      if (entities.customPlanCategories[id] && entities.customPlanCategories[id].planId === planId) {
        entities.customPlanCategories[id] = {
          ...entities.customPlanCategories[id],
          displayOrder: index + 1
        };
      }
    });
    return wait(getCustomPlanCategoriesForPlan(planId));
  },

  async listCustomPlanFoodItems(planId: string, categoryId?: string): Promise<CustomPlanFoodItem[]> {
    const items = getCustomPlanFoodItemsForPlan(planId).filter((item) => !categoryId || item.categoryId === categoryId);
    return wait(items);
  },

  async upsertCustomPlanFoodItem(payload: CustomPlanFoodItemPayload): Promise<CustomPlanFoodItem> {
    const existing = payload.id ? entities.customPlanFoodItems[payload.id] : null;
    if (!payload.name.trim()) throw new Error("Food item name is required.");
    if (!payload.planId.trim()) throw new Error("Plan is required for food item.");
    if (!payload.categoryId.trim()) throw new Error("Category is required for food item.");
    if (!payload.imageUrl.trim()) throw new Error("Image is required for food item.");
    if (!payload.sizes.length) throw new Error("At least one size is required.");
    if (!entities.customPlanCategories[payload.categoryId]) throw new Error("Selected category does not exist.");

    payload.sizes.forEach((size) => {
      if (!size.label.trim()) throw new Error("Size label is required.");
      if ([size.price, size.calories, size.protein, size.carbs, size.fat].some((value) => value < 0)) {
        throw new Error("Size values cannot be negative.");
      }
    });

    const siblingItems = asArray(entities.customPlanFoodItems).filter(
      (item) => item.planId === payload.planId && item.categoryId === payload.categoryId && item.id !== payload.id
    );

    const nextItem: CustomPlanFoodItem = {
      id: payload.id || `custom-food-${Date.now()}`,
      planId: payload.planId,
      categoryId: payload.categoryId,
      name: payload.name.trim(),
      imageUrl: payload.imageUrl.trim(),
      description: payload.description?.trim() || "",
      displayOrder: payload.displayOrder ?? existing?.displayOrder ?? siblingItems.length + 1,
      isActive: payload.isActive,
      sizes: payload.sizes.map((size, index) => ({
        ...size,
        id: size.id || `custom-size-${Date.now()}-${index}`,
        foodItemId: payload.id || existing?.id || `custom-food-${Date.now()}`,
        displayOrder: size.displayOrder ?? index + 1
      }))
    };

    entities.customPlanFoodItems[nextItem.id] = cloneCustomPlanFoodItem({
      ...nextItem,
      sizes: nextItem.sizes.map((size) => ({ ...size, foodItemId: nextItem.id }))
    });

    return wait(cloneCustomPlanFoodItem(entities.customPlanFoodItems[nextItem.id]));
  },

  async deleteCustomPlanFoodItem(id: string): Promise<{ id: string }> {
    delete entities.customPlanFoodItems[id];
    return wait({ id });
  },

  async reorderCustomPlanFoodItems(planId: string, categoryId: string, itemIds: string[]): Promise<CustomPlanFoodItem[]> {
    itemIds.forEach((id, index) => {
      if (entities.customPlanFoodItems[id] && entities.customPlanFoodItems[id].planId === planId) {
        entities.customPlanFoodItems[id] = {
          ...entities.customPlanFoodItems[id],
          categoryId,
          displayOrder: index + 1
        };
      }
    });
    return wait(getCustomPlanFoodItemsForPlan(planId).filter((item) => item.categoryId === categoryId));
  },

  async listSubscriptions(): Promise<SubscriptionRecord[]> {
    return wait(asArray(entities.subscriptions));
  },

  async updateSubscription(id: string, patch: Partial<SubscriptionRecord>): Promise<SubscriptionRecord | null> {
    if (!entities.subscriptions[id]) return wait(null);
    entities.subscriptions[id] = { ...entities.subscriptions[id], ...patch };
    return wait(entities.subscriptions[id]);
  },

  async listOrders(): Promise<OrderRecord[]> {
    return wait(asArray(entities.orders));
  },

  async updateOrder(id: string, patch: Partial<OrderRecord>): Promise<OrderRecord | null> {
    if (!entities.orders[id]) return wait(null);
    entities.orders[id] = { ...entities.orders[id], ...patch };
    return wait(entities.orders[id]);
  },

  async listLocations(): Promise<LocationRecord[]> {
    return wait(asArray(entities.locations).sort((a, b) => a.name.localeCompare(b.name)));
  },

  async upsertLocation(item: LocationRecord): Promise<LocationRecord> {
    entities.locations[item.id] = item;
    return wait(entities.locations[item.id]);
  },

  async deleteLocation(id: string): Promise<{ id: string }> {
    delete entities.locations[id];
    return wait({ id });
  },

  async getSettings(): Promise<MonthlyPlanGlobalSettings> {
    return wait(entities.settings);
  },

  async updateSettings(patch: Partial<MonthlyPlanGlobalSettings>): Promise<MonthlyPlanGlobalSettings> {
    entities.settings = { ...entities.settings, ...patch };
    return wait(entities.settings);
  }
};
