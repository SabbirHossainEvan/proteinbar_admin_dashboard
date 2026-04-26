export type PlanKind = "custom" | "normal";
export type PlanStatus = "draft" | "active" | "inactive" | "archived";
export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";
export type DeliveryOption = "daily-delivery" | "daily-pickup" | "weekly-delivery" | "weekly-pickup";
export type SelectionMode = "single" | "multi";
export type PlanFrequency = "daily" | "weekly" | "monthly";

export interface DeliveryOptionConfig {
  option: DeliveryOption;
  enabled: boolean;
  label: string;
  serviceFee: number;
  minDays: number;
  maxDays: number;
}

export interface PlanRuleConfig {
  id: string;
  planId: string;
  allowedMealsPerDay: number[];
  allowedDays: number[];
  allowedSnacks: number[];
  planTypeOptions: string[];
  deliveryDaysRule: {
    min: number;
    max: number;
    allowedWeekDays: number[];
  };
  defaults: {
    meals: number;
    days: number;
    snacks: number;
    planType?: string;
    deliveryDays: number[];
  };
  deliveryOptionConfigs: DeliveryOptionConfig[];
}

export interface PricingConfig {
  id: string;
  planId: string;
  basePriceFormula: {
    baseFee: number;
    pricePerMeal: number;
    dayMultiplier: number;
  };
  snacksAddonPrice: number;
  vatPercent: number;
  safetyBagFee: number;
  giftCodeRule: {
    type: "percent" | "fixed";
    value: number;
    maxDiscount: number;
    enabled: boolean;
  };
}

export interface AssignedMeal {
  id: string;
  mealId: string;
  mealName: string;
  mealType: MealType;
  date: string;
  badges: string[];
}

export interface WeekAssignment {
  id: string;
  planId: string;
  weekIndex: number;
  startDate: string;
  endDate: string;
  mealsByDate: Record<string, AssignedMeal[]>;
}

export interface MonthlyPlanContent {
  heroTitle?: string;
  heroSubtitle?: string;
  selectMealsText?: string;
  checkoutText?: string;
  regularStepTwo?: {
    categories: CustomPlanCategory[];
    foodItems: CustomPlanFoodItem[];
  };
  customStepTwo?: {
    categories: CustomPlanCategory[];
    foodItems: CustomPlanFoodItem[];
  };
}

export interface MonthlyPlan {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  status: PlanStatus;
  planKind: PlanKind;
  frequency: PlanFrequency;
  createdAt: string;
  updatedAt: string;
  ruleConfigId: string;
  pricingConfigId: string;
  content?: MonthlyPlanContent;
  weekAssignmentIds: string[];
}

export interface MonthlyPlanDetails {
  plan: MonthlyPlan;
  rules: PlanRuleConfig;
  pricing: PricingConfig;
  weekAssignments: WeekAssignment[];
  mealLibrary?: MealLibraryItem[];
}

export interface MealLibraryItem {
  id: string;
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  status: "active" | "inactive";
  image?: string;
}

export interface CustomPlanCategory {
  id: string;
  planId: string;
  name: string;
  slug: string;
  code?: string;
  displayOrder: number;
  selectionMode: SelectionMode;
  isActive: boolean;
  isRequired: boolean;
  minSelect: number;
  maxSelect?: number | null;
}

export interface CustomPlanFoodSize {
  id: string;
  foodItemId: string;
  label: string;
  unit?: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  displayOrder: number;
  isActive: boolean;
}

export interface CustomPlanFoodItem {
  id: string;
  planId: string;
  categoryId: string;
  name: string;
  imageUrl: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  sizes: CustomPlanFoodSize[];
}

export interface SubscriptionRecord {
  id: string;
  subscriptionId: string;
  customerName: string;
  customerPhone: string;
  planId: string;
  planTitle: string;
  planKind: PlanKind;
  status: "active" | "paused" | "cancelled" | "completed";
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  progressDays: string;
  remainingMeals: number;
  selections: {
    meals: number;
    days: number;
    snacks: number;
    startDate: string;
    deliveryDays: number[];
    planType?: string;
    deliveryOption: DeliveryOption;
  };
}

export interface OrderRecord {
  id: string;
  orderId: string;
  subscriptionId: string;
  customerName: string;
  planId: string;
  planTitle: string;
  planKind: PlanKind;
  status: "pending" | "confirmed" | "preparing" | "out-for-delivery" | "completed";
  paymentStatus: "paid" | "unpaid" | "cod";
  amount: number;
  orderDate: string;
  deliveryOption: DeliveryOption;
  locationId: string;
  locationName: string;
  items: Array<{ mealId: string; mealName: string; qty: number; mealType: MealType }>;
}

export interface LocationRecord {
  id: string;
  name: string;
  type: "pickup" | "delivery" | "both";
  address: string;
  image?: string;
  phone?: string;
  googleMapsUrl?: string;
  ratingText?: string;
  isActive: boolean;
  deliveryFee: number;
  cutoffTime: string;
  supportedOptions: DeliveryOption[];
}

export interface MonthlyPlanGlobalSettings {
  id: string;
  weeklyCycleCount: number;
  maxActivePlansPerKind: number;
  currencyCode: string;
  defaultVatPercent: number;
  defaultSafetyBagFee: number;
  enforceActivePlanVisibility: boolean;
  allowMixedDeliveryModes: boolean;
}

export interface MonthlyPlanOverview {
  activePlans: number;
  customPlans: number;
  normalPlans: number;
  activeSubscriptions: number;
  pendingOrders: number;
  activeMeals: number;
}

export interface MonthlyPlanEntities {
  plans: Record<string, MonthlyPlan>;
  rules: Record<string, PlanRuleConfig>;
  pricing: Record<string, PricingConfig>;
  weekAssignments: Record<string, WeekAssignment>;
  mealLibrary: Record<string, MealLibraryItem>;
  customPlanCategories: Record<string, CustomPlanCategory>;
  customPlanFoodItems: Record<string, CustomPlanFoodItem>;
  subscriptions: Record<string, SubscriptionRecord>;
  orders: Record<string, OrderRecord>;
  locations: Record<string, LocationRecord>;
  settings: MonthlyPlanGlobalSettings;
}
