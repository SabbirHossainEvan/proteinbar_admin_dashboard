import type {
  LocationRecord,
  MealLibraryItem,
  MonthlyPlan,
  MonthlyPlanEntities,
  MonthlyPlanGlobalSettings,
  MonthlyPlanOverview,
  OrderRecord,
  PlanKind,
  PlanRuleConfig,
  PricingConfig,
  SubscriptionRecord,
  WeekAssignment
} from "./types";

type ListFilters = {
  kind?: PlanKind | "all";
  status?: MonthlyPlan["status"] | "all";
  search?: string;
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
      createdAt: "2026-01-11T09:00:00Z",
      updatedAt: "2026-03-06T10:30:00Z",
      ruleConfigId: "rule-custom-core",
      pricingConfigId: "pricing-custom-core",
      content: {
        heroTitle: "Build your personalized monthly nutrition plan",
        heroSubtitle: "Choose meals, days and snacks based on your goal.",
        selectMealsText: "Pick meals by week/date. Changes apply instantly to your checkout.",
        checkoutText: "Review your selections and confirm your preferred delivery option."
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
      startDate: "2026-03-03",
      endDate: "2026-04-03",
      currentWeek: 1,
      totalWeeks: 4,
      progressDays: "3/5",
      remainingMeals: 17,
      selections: {
        meals: 3,
        days: 5,
        snacks: 1,
        startDate: "2026-03-03",
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
      startDate: "2026-02-17",
      endDate: "2026-03-28",
      currentWeek: 3,
      totalWeeks: 6,
      progressDays: "1/6",
      remainingMeals: 24,
      selections: {
        meals: 3,
        days: 6,
        snacks: 0,
        startDate: "2026-02-17",
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

const dayKeys = ["2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-14", "2026-03-15"];

const customWeekOne: WeekAssignment = {
  id: "wa-custom-week1",
  planId: "plan-custom-core",
  weekIndex: 1,
  startDate: "2026-03-10",
  endDate: "2026-03-15",
  mealsByDate: {
    "2026-03-10": [{ id: "am1", mealId: "meal-l1", mealName: "Chicken Burrito Bowl", mealType: "Lunch", date: "2026-03-10", badges: ["High"] }],
    "2026-03-11": [{ id: "am2", mealId: "meal-d1", mealName: "Salmon Rice Plate", mealType: "Dinner", date: "2026-03-11", badges: ["Low"] }],
    "2026-03-12": [{ id: "am3", mealId: "meal-b1", mealName: "Greek Yogurt Bowl", mealType: "Breakfast", date: "2026-03-12", badges: ["Low"] }],
    "2026-03-13": [{ id: "am4", mealId: "meal-s1", mealName: "Protein Smoothie", mealType: "Snack", date: "2026-03-13", badges: ["Low"] }],
    "2026-03-14": [],
    "2026-03-15": []
  }
};

const customWeekTwo: WeekAssignment = {
  id: "wa-custom-week2",
  planId: "plan-custom-core",
  weekIndex: 2,
  startDate: "2026-03-17",
  endDate: "2026-03-22",
  mealsByDate: dayKeys.reduce<Record<string, WeekAssignment["mealsByDate"][string]>>((acc, _, idx) => {
    const date = new Date("2026-03-17");
    date.setDate(date.getDate() + idx);
    const day = date.toISOString().slice(0, 10);
    acc[day] = [];
    return acc;
  }, {})
};

const normalWeekOne: WeekAssignment = {
  id: "wa-normal-week1",
  planId: "plan-normal-lean",
  weekIndex: 1,
  startDate: "2026-03-10",
  endDate: "2026-03-15",
  mealsByDate: {
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
    "2026-03-14": [],
    "2026-03-15": []
  }
};

const normalWeekTwo: WeekAssignment = {
  id: "wa-normal-week2",
  planId: "plan-normal-lean",
  weekIndex: 2,
  startDate: "2026-03-17",
  endDate: "2026-03-22",
  mealsByDate: {}
};

entities.weekAssignments[customWeekOne.id] = customWeekOne;
entities.weekAssignments[customWeekTwo.id] = customWeekTwo;
entities.weekAssignments[normalWeekOne.id] = normalWeekOne;
entities.weekAssignments[normalWeekTwo.id] = normalWeekTwo;

const asArray = <T>(record: Record<string, T>) => Object.values(record);

const wait = async <T>(value: T, ms = 160) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

export interface MonthlyPlanDetailsPayload {
  plan: MonthlyPlan;
  rules: PlanRuleConfig;
  pricing: PricingConfig;
  weekAssignments: WeekAssignment[];
}

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

    return wait({
      plan,
      rules: entities.rules[plan.ruleConfigId],
      pricing: entities.pricing[plan.pricingConfigId],
      weekAssignments: plan.weekAssignmentIds.map((item) => entities.weekAssignments[item]).filter(Boolean)
    });
  },

  async upsertPlanDetails(payload: MonthlyPlanDetailsPayload): Promise<MonthlyPlanDetailsPayload> {
    const now = new Date().toISOString();
    const plan = { ...payload.plan, updatedAt: now };

    entities.plans[plan.id] = plan;
    entities.rules[payload.rules.id] = payload.rules;
    entities.pricing[payload.pricing.id] = payload.pricing;

    payload.weekAssignments.forEach((assignment) => {
      entities.weekAssignments[assignment.id] = assignment;
    });

    entities.plans[plan.id].weekAssignmentIds = payload.weekAssignments.map((item) => item.id);

    return wait({
      plan: entities.plans[plan.id],
      rules: entities.rules[payload.rules.id],
      pricing: entities.pricing[payload.pricing.id],
      weekAssignments: payload.weekAssignments.map((item) => entities.weekAssignments[item.id])
    });
  },

  async archivePlan(id: string): Promise<{ id: string; status: MonthlyPlan["status"] } | null> {
    const plan = entities.plans[id];
    if (!plan) return wait(null);
    entities.plans[id] = { ...plan, status: "archived", updatedAt: new Date().toISOString() };
    return wait({ id, status: entities.plans[id].status });
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
