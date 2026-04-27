/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { backofficeMockAdapter } from "@/redux/backoffice/mockAdapter";
import type {
  AdminAuthRecord,
  AdminRoleRecord,
  AdminUserRecord,
  PromoCodeRecord,
  WebsiteMenuCategoryRecord,
  WebsitePageRecord,
  WebsiteSettingsRecord
} from "@/redux/backoffice/types";
import { monthlyPlanMockAdapter, type MonthlyPlanDetailsPayload } from "@/redux/monthlyPlans/mockAdapter";
import type {
  CustomPlanCategory,
  CustomPlanFoodItem,
  LocationRecord,
  MealLibraryItem,
  MonthlyPlanDetails,
  MonthlyPlan,
  MonthlyPlanGlobalSettings,
  MonthlyPlanOverview,
  OrderRecord,
  PlanKind,
  SubscriptionRecord
} from "@/redux/monthlyPlans/types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type PlanListFilters = {
  kind?: PlanKind | "all";
  status?: MonthlyPlan["status"] | "all";
  search?: string;
};

type CustomPlanFoodListFilters = {
  planId: string;
  categoryId?: string;
};

const normalizeSubscriptionRecord = (item: Partial<SubscriptionRecord> & Record<string, unknown>): SubscriptionRecord => ({
  id: String(item.id ?? ""),
  subscriptionId: String(item.subscriptionId ?? ""),
  customerName: String(item.customerName ?? ""),
  customerPhone: String(item.customerPhone ?? ""),
  planId: String(item.planId ?? ""),
  planTitle: String(item.planTitle ?? ""),
  planKind: item.planKind === "custom" ? "custom" : "normal",
  status:
    item.status === "paused" || item.status === "cancelled" || item.status === "completed"
      ? item.status
      : "active",
  startDate: String(item.startDate ?? ""),
  endDate: String(item.endDate ?? ""),
  currentWeek: Number(item.currentWeek ?? 0),
  totalWeeks: Number(item.totalWeeks ?? 0),
  progressDays: String(item.progressDays ?? "0/0"),
  remainingMeals: Number(item.remainingMeals ?? 0),
  selections: {
    meals: Number((item.selections as SubscriptionRecord["selections"] | undefined)?.meals ?? 0),
    days: Number((item.selections as SubscriptionRecord["selections"] | undefined)?.days ?? 0),
    snacks: Number((item.selections as SubscriptionRecord["selections"] | undefined)?.snacks ?? 0),
    startDate: String((item.selections as SubscriptionRecord["selections"] | undefined)?.startDate ?? ""),
    deliveryDays: Array.isArray((item.selections as SubscriptionRecord["selections"] | undefined)?.deliveryDays)
      ? (((item.selections as SubscriptionRecord["selections"] | undefined)?.deliveryDays ?? []) as Array<number | string>)
          .map((value) => (typeof value === "number" ? value : Number(value)))
          .filter((value) => Number.isFinite(value))
      : [],
    planType: (item.selections as SubscriptionRecord["selections"] | undefined)?.planType,
    deliveryOption: (((item.selections as SubscriptionRecord["selections"] | undefined)?.deliveryOption ??
      "daily-delivery") as SubscriptionRecord["selections"]["deliveryOption"])
  }
});

const normalizeOrderRecord = (item: Partial<OrderRecord> & Record<string, unknown>): OrderRecord => ({
  id: String(item.id ?? ""),
  orderId: String(item.orderId ?? ""),
  subscriptionId: String(item.subscriptionId ?? ""),
  customerName: String(item.customerName ?? ""),
  customerEmail: item.customerEmail ? String(item.customerEmail) : undefined,
  customerPhone: item.customerPhone ? String(item.customerPhone) : undefined,
  customerEmirate: item.customerEmirate ? String(item.customerEmirate) : undefined,
  customerArea: item.customerArea ? String(item.customerArea) : undefined,
  planId: String(item.planId ?? ""),
  planTitle: String(item.planTitle ?? ""),
  planKind: item.planKind === "custom" ? "custom" : "normal",
  status:
    item.status === "confirmed" ||
    item.status === "preparing" ||
    item.status === "out-for-delivery" ||
    item.status === "completed"
      ? item.status
      : "pending",
  paymentStatus:
    item.paymentStatus === "cod" || item.paymentStatus === "unpaid" ? item.paymentStatus : "paid",
  amount: Number(item.amount ?? 0),
  orderDate: String(item.orderDate ?? ""),
  deliveryOption: ((item.deliveryOption ?? "daily-delivery") as OrderRecord["deliveryOption"]),
  deliveryAddress: item.deliveryAddress ? String(item.deliveryAddress) : undefined,
  locationId: String(item.locationId ?? ""),
  locationName: String(item.locationName ?? ""),
  selections: item.selections ? {
    meals: Number((item.selections as Record<string, unknown>).meals ?? 0),
    days: Number((item.selections as Record<string, unknown>).days ?? 0),
    weeks: Number((item.selections as Record<string, unknown>).weeks ?? 0),
    snacks: Number((item.selections as Record<string, unknown>).snacks ?? 0),
    startDate: String((item.selections as Record<string, unknown>).startDate ?? ""),
    deliveryDays: String((item.selections as Record<string, unknown>).deliveryDays ?? ""),
    planType: String((item.selections as Record<string, unknown>).planType ?? ""),
  } : undefined,
  totals: item.totals ? {
    subtotal: Number((item.totals as Record<string, unknown>).subtotal ?? 0),
    giftDiscount: Number((item.totals as Record<string, unknown>).giftDiscount ?? 0),
    vat: Number((item.totals as Record<string, unknown>).vat ?? 0),
    safetyBag: Number((item.totals as Record<string, unknown>).safetyBag ?? 0),
    grandTotal: Number((item.totals as Record<string, unknown>).grandTotal ?? 0),
  } : undefined,
  promoCode: item.promoCode ? {
    code: String((item.promoCode as Record<string, unknown>).code ?? ""),
    discountAmount: Number((item.promoCode as Record<string, unknown>).discountAmount ?? 0),
  } : undefined,
  items: Array.isArray(item.items)
    ? item.items.map((line) => ({
        instanceId: String((line as Record<string, unknown>).instanceId ?? ""),
        mealId: String((line as Record<string, unknown>).mealId ?? (line as Record<string, unknown>).id ?? ""),
        mealName: String((line as Record<string, unknown>).mealName ?? (line as Record<string, unknown>).title ?? ""),
        date: String((line as Record<string, unknown>).date ?? ""),
        extrasSummary: String((line as Record<string, unknown>).extrasSummary ?? ""),
        calories: Number((line as Record<string, unknown>).calories ?? 0),
        protein: Number((line as Record<string, unknown>).protein ?? 0),
        carb: Number((line as Record<string, unknown>).carb ?? 0),
        fat: Number((line as Record<string, unknown>).fat ?? 0),
        basePrice: Number((line as Record<string, unknown>).basePrice ?? 0),
        totalPrice: Number((line as Record<string, unknown>).totalPrice ?? 0),
        qty: Number((line as Record<string, unknown>).qty ?? 0),
        mealType: (((line as Record<string, unknown>).mealType ?? "Lunch") as OrderRecord["items"][number]["mealType"])
      }))
    : []
});

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        try {
          const raw = window.sessionStorage.getItem("proteinbar_admin_auth");
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<AdminAuthRecord>;
            const token = parsed.token || parsed.session?.token;
            if (token) {
              headers.set("Authorization", `Bearer ${token}`);
            }
          }
        } catch {
          // ignore malformed client storage
        }
      }

      return headers;
    }
  }),
  tagTypes: [
    "Dashboard",
    "Products",
    "MenuItems",
    "Restaurants",
    "Locations",
    "MonthlyPlans",
    "PlanFlows",
    "Ingredients",
    "Orders",
    "Subscriptions",
    "Notifications",
    "OrdersOfDay",
    "Printable",
    "MonthlyPlanAdmin",
    "MonthlyPlanDetails",
    "MealLibraryAdmin",
    "CustomPlanCategoryAdmin",
    "CustomPlanFoodAdmin",
    "LocationAdmin",
    "MonthlySubscriptionAdmin",
    "MonthlyOrderAdmin",
    "MonthlySettingsAdmin",
    "WebsitePagesAdmin",
    "WebsiteMenuCategoriesAdmin",
    "WebsiteSettingsAdmin",
    "AdminRoles",
    "AdminUsers",
    "AdminAuth",
    "PromoCodesAdmin"
  ],
  endpoints: (builder) => ({
    getDashboard: builder.query<ApiResponse<any>, void>({
      query: () => "/dashboard",
      providesTags: ["Dashboard"]
    }),

    getProducts: builder.query<ApiResponse<any[]>, void>({
      query: () => "/products",
      providesTags: ["Products"]
    }),
    createProduct: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products", "Dashboard"]
    }),
    updateProduct: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Products", "Dashboard"]
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products", "Dashboard"]
    }),

    getMenuItems: builder.query<ApiResponse<any[]>, void>({
      query: () => "/menu-items",
      providesTags: ["MenuItems"]
    }),
    createMenuItem: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/menu-items", method: "POST", body }),
      invalidatesTags: ["MenuItems", "Dashboard"]
    }),
    updateMenuItem: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/menu-items/${id}`, method: "PATCH", body }),
      invalidatesTags: ["MenuItems", "Dashboard"]
    }),
    deleteMenuItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/menu-items/${id}`, method: "DELETE" }),
      invalidatesTags: ["MenuItems", "Dashboard"]
    }),

    getRestaurants: builder.query<ApiResponse<any[]>, void>({
      query: () => "/restaurants",
      providesTags: ["Restaurants"]
    }),
    createRestaurant: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/restaurants", method: "POST", body }),
      invalidatesTags: ["Restaurants", "MenuItems", "Dashboard"]
    }),
    updateRestaurant: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/restaurants/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Restaurants", "MenuItems", "Dashboard"]
    }),
    deleteRestaurant: builder.mutation<void, string>({
      query: (id) => ({ url: `/restaurants/${id}`, method: "DELETE" }),
      invalidatesTags: ["Restaurants", "MenuItems", "Dashboard"]
    }),

    getLocations: builder.query<ApiResponse<any[]>, void>({
      query: () => "/locations",
      providesTags: ["Locations"]
    }),
    createLocation: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/locations", method: "POST", body }),
      invalidatesTags: ["Locations"]
    }),
    updateLocation: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/locations/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Locations"]
    }),
    deleteLocation: builder.mutation<void, string>({
      query: (id) => ({ url: `/locations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Locations"]
    }),

    getMonthlyPlans: builder.query<ApiResponse<any[]>, void>({
      query: () => "/monthly-plans",
      providesTags: ["MonthlyPlans"]
    }),
    createMonthlyPlan: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/monthly-plans", method: "POST", body }),
      invalidatesTags: ["MonthlyPlans", "Dashboard"]
    }),
    updateMonthlyPlan: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/monthly-plans/${id}`, method: "PATCH", body }),
      invalidatesTags: ["MonthlyPlans", "Dashboard"]
    }),
    deleteMonthlyPlan: builder.mutation<void, string>({
      query: (id) => ({ url: `/monthly-plans/${id}`, method: "DELETE" }),
      invalidatesTags: ["MonthlyPlans", "Dashboard"]
    }),

    getPlanFlows: builder.query<ApiResponse<any[]>, void>({
      query: () => "/plan-flows",
      providesTags: ["PlanFlows"]
    }),
    updatePlanFlow: builder.mutation<ApiResponse<any>, { flowType: "custom" | "preset"; body: { steps: Array<{ step: string; title: string }> } }>({
      query: ({ flowType, body }) => ({ url: `/plan-flows/${flowType}`, method: "PUT", body }),
      invalidatesTags: ["PlanFlows"]
    }),

    getIngredients: builder.query<ApiResponse<any[]>, void>({
      query: () => "/ingredients",
      providesTags: ["Ingredients"]
    }),
    createIngredient: builder.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/ingredients", method: "POST", body }),
      invalidatesTags: ["Ingredients"]
    }),
    updateIngredient: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/ingredients/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Ingredients"]
    }),
    deleteIngredient: builder.mutation<void, string>({
      query: (id) => ({ url: `/ingredients/${id}`, method: "DELETE" }),
      invalidatesTags: ["Ingredients"]
    }),

    getOrders: builder.query<ApiResponse<any[]>, Record<string, string | undefined> | void>({
      query: (params) => ({ url: "/orders", params: params ?? {} }),
      providesTags: ["Orders"]
    }),
    updateOrder: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/orders/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Orders", "Dashboard", "OrdersOfDay", "Printable"]
    }),

    getSubscriptions: builder.query<ApiResponse<any[]>, void>({
      query: () => "/subscriptions",
      providesTags: ["Subscriptions"]
    }),
    updateSubscription: builder.mutation<ApiResponse<any>, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/subscriptions/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Subscriptions", "Dashboard"]
    }),

    getNotifications: builder.query<ApiResponse<any[]>, void>({
      query: () => "/notifications",
      providesTags: ["Notifications"]
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notifications"]
    }),

    getPromoCodesAdmin: builder.query<ApiResponse<PromoCodeRecord[]>, void>({
      query: () => "/promo-codes",
      providesTags: ["PromoCodesAdmin"]
    }),
    createPromoCodeAdmin: builder.mutation<ApiResponse<PromoCodeRecord>, Omit<PromoCodeRecord, "updatedAt">>({
      query: (body) => ({ url: "/promo-codes", method: "POST", body }),
      invalidatesTags: ["PromoCodesAdmin"]
    }),
    updatePromoCodeAdmin: builder.mutation<ApiResponse<PromoCodeRecord>, { id: string; body: Omit<PromoCodeRecord, "id" | "updatedAt"> }>({
      query: ({ id, body }) => ({ url: `/promo-codes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["PromoCodesAdmin"]
    }),
    deletePromoCodeAdmin: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/promo-codes/${id}`, method: "DELETE" }),
      invalidatesTags: ["PromoCodesAdmin"]
    }),

    getOrdersOfDay: builder.query<ApiResponse<any[]>, void>({
      query: () => "/orders-of-day",
      providesTags: ["OrdersOfDay"]
    }),
    getPrintableOrders: builder.query<ApiResponse<any[]>, void>({
      query: () => "/printing",
      providesTags: ["Printable"]
    }),

    adminLogin: builder.mutation<ApiResponse<AdminAuthRecord>, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/admin-login", method: "POST", body })
    }),
    getAdminMe: builder.query<ApiResponse<AdminAuthRecord>, void>({
      query: () => "/auth/admin-me",
      providesTags: ["AdminAuth"]
    }),
    adminLogout: builder.mutation<ApiResponse<{ loggedOut: boolean }>, void>({
      query: () => ({ url: "/auth/admin-logout", method: "POST" }),
      invalidatesTags: ["AdminAuth"]
    }),
    sendCode: builder.mutation<ApiResponse<any>, { email: string }>({
      query: (body) => ({ url: "/auth/send-code", method: "POST", body })
    }),
    verifyCode: builder.mutation<ApiResponse<any>, { email: string; code: string }>({
      query: (body) => ({ url: "/auth/verify-code", method: "POST", body })
    }),
    resetPassword: builder.mutation<ApiResponse<any>, { email: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body })
    }),

    getMonthlyPlanOverview: builder.query<ApiResponse<MonthlyPlanOverview>, void>({
      query: () => "/admin/monthly-plan/overview",
      providesTags: ["MonthlyPlanAdmin"]
    }),
    getMonthlyPlanAdminList: builder.query<ApiResponse<MonthlyPlan[]>, PlanListFilters | void>({
      query: (filters) => ({
        url: "/admin/monthly-plan/plans",
        params: filters ?? {}
      }),
      providesTags: ["MonthlyPlanAdmin"]
    }),
    getMonthlyPlanDetails: builder.query<ApiResponse<MonthlyPlanDetails | null>, string>({
      query: (id) => `/admin/monthly-plan/plans/${id}`,
      providesTags: (_result, _error, id) => [{ type: "MonthlyPlanDetails", id }]
    }),
    upsertMonthlyPlanDetails: builder.mutation<ApiResponse<MonthlyPlanDetailsPayload>, MonthlyPlanDetailsPayload>({
      query: (payload) => ({
        url: `/admin/monthly-plan/plans/${payload.plan.id}`,
        method: "PUT",
        body: payload
      }),
      invalidatesTags: (_result, _error, payload) => [
        "MonthlyPlanAdmin",
        { type: "MonthlyPlanDetails", id: payload.plan.id }
      ]
    }),
    archiveMonthlyPlan: builder.mutation<ApiResponse<{ id: string; status: MonthlyPlan["status"] } | null>, string>({
      query: (id) => ({
        url: `/admin/monthly-plan/plans/${id}/archive`,
        method: "PATCH"
      }),
      invalidatesTags: ["MonthlyPlanAdmin"]
    }),
    deleteMonthlyPlanAdmin: builder.mutation<ApiResponse<{ id: string } | null>, string>({
      query: (id) => ({
        url: `/admin/monthly-plan/plans/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["MonthlyPlanAdmin"]
    }),
    getMealLibraryAdmin: builder.query<ApiResponse<MealLibraryItem[]>, void>({
      query: () => "/admin/monthly-plan/meals",
      providesTags: ["MealLibraryAdmin"]
    }),
    upsertMealLibraryAdmin: builder.mutation<ApiResponse<MealLibraryItem>, MealLibraryItem>({
      query: (payload) => ({
        url: `/admin/monthly-plan/meals/${payload.id}`,
        method: "PUT",
        body: payload
      }),
      invalidatesTags: ["MealLibraryAdmin", "MonthlyPlanAdmin", "MonthlyPlanDetails"]
    }),
    deleteMealLibraryAdmin: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/admin/monthly-plan/meals/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["MealLibraryAdmin", "MonthlyPlanAdmin", "MonthlyPlanDetails"]
    }),
    getCustomPlanCategoriesAdmin: builder.query<ApiResponse<CustomPlanCategory[]>, string>({
      query: (planId) => ({
        url: "/admin/monthly-plan/custom-categories",
        params: { planId }
      }),
      providesTags: (_result, _error, planId) => [{ type: "CustomPlanCategoryAdmin", id: planId }]
    }),
    upsertCustomPlanCategoryAdmin: builder.mutation<ApiResponse<CustomPlanCategory>, {
      id?: string;
      planId: string;
      name: string;
      slug?: string;
      code?: string;
      displayOrder?: number;
      selectionMode: CustomPlanCategory["selectionMode"];
      isActive: boolean;
      isRequired: boolean;
      minSelect: number;
      maxSelect?: number | null;
    }>({
      query: ({ id, ...body }) =>
        id
          ? { url: `/admin/monthly-plan/custom-categories/${id}`, method: "PATCH", body }
          : { url: "/admin/monthly-plan/custom-categories", method: "POST", body },
      invalidatesTags: (_result, _error, payload) => [
        "MonthlyPlanAdmin",
        { type: "MonthlyPlanDetails", id: payload.planId },
        { type: "CustomPlanCategoryAdmin", id: payload.planId },
        { type: "CustomPlanFoodAdmin", id: payload.planId }
      ]
    }),
    deleteCustomPlanCategoryAdmin: builder.mutation<ApiResponse<{ id: string }>, { id: string; planId: string }>({
      query: ({ id }) => ({
        url: `/admin/monthly-plan/custom-categories/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, payload) => [
        "MonthlyPlanAdmin",
        { type: "MonthlyPlanDetails", id: payload.planId },
        { type: "CustomPlanCategoryAdmin", id: payload.planId },
        { type: "CustomPlanFoodAdmin", id: payload.planId }
      ]
    }),
    reorderCustomPlanCategoriesAdmin: builder.mutation<ApiResponse<CustomPlanCategory[]>, { planId: string; categoryIds: string[] }>({
      query: (body) => ({
        url: "/admin/monthly-plan/custom-categories/reorder",
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, payload) => [
        { type: "MonthlyPlanDetails", id: payload.planId },
        { type: "CustomPlanCategoryAdmin", id: payload.planId }
      ]
    }),
    getCustomPlanFoodItemsAdmin: builder.query<ApiResponse<CustomPlanFoodItem[]>, CustomPlanFoodListFilters>({
      query: ({ planId, categoryId }) => ({
        url: "/admin/monthly-plan/custom-food-items",
        params: {
          planId,
          ...(categoryId ? { categoryId } : {})
        }
      }),
      providesTags: (_result, _error, payload) => [{ type: "CustomPlanFoodAdmin", id: payload.planId }]
    }),
    upsertCustomPlanFoodItemAdmin: builder.mutation<ApiResponse<CustomPlanFoodItem>, {
      id?: string;
      planId: string;
      categoryId: string;
      name: string;
      imageUrl: string;
      description?: string;
      displayOrder?: number;
      isActive: boolean;
      sizes: Array<{
        id?: string;
        label: string;
        unit?: string;
        price: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        displayOrder?: number;
        isActive: boolean;
      }>;
    }>({
      query: ({ id, ...body }) =>
        id
          ? { url: `/admin/monthly-plan/custom-food-items/${id}`, method: "PATCH", body }
          : { url: "/admin/monthly-plan/custom-food-items", method: "POST", body },
      invalidatesTags: (_result, _error, payload) => [
        "MonthlyPlanAdmin",
        { type: "MonthlyPlanDetails", id: payload.planId },
        { type: "CustomPlanFoodAdmin", id: payload.planId }
      ]
    }),
    deleteCustomPlanFoodItemAdmin: builder.mutation<ApiResponse<{ id: string }>, { id: string; planId: string }>({
      query: ({ id }) => ({
        url: `/admin/monthly-plan/custom-food-items/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, payload) => [
        "MonthlyPlanAdmin",
        { type: "MonthlyPlanDetails", id: payload.planId },
        { type: "CustomPlanFoodAdmin", id: payload.planId }
      ]
    }),
    reorderCustomPlanFoodItemsAdmin: builder.mutation<ApiResponse<CustomPlanFoodItem[]>, { planId: string; categoryId: string; itemIds: string[] }>({
      query: (body) => ({
        url: "/admin/monthly-plan/custom-food-items/reorder",
        method: "POST",
        body
      }),
      invalidatesTags: (_result, _error, payload) => [
        { type: "MonthlyPlanDetails", id: payload.planId },
        { type: "CustomPlanFoodAdmin", id: payload.planId }
      ]
    }),
    getMonthlySubscriptionsAdmin: builder.query<ApiResponse<SubscriptionRecord[]>, void>({
      query: () => "/admin/monthly-plan/subscriptions",
      transformResponse: (response: ApiResponse<Array<Record<string, unknown>>>) => ({
        ...response,
        data: (response.data ?? []).map(normalizeSubscriptionRecord)
      }),
      providesTags: ["MonthlySubscriptionAdmin"]
    }),
    updateMonthlySubscriptionAdmin: builder.mutation<ApiResponse<SubscriptionRecord | null>, { id: string; patch: Partial<SubscriptionRecord> }>({
      query: ({ id, patch }) => ({
        url: `/admin/monthly-plan/subscriptions/${id}`,
        method: "PATCH",
        body: patch
      }),
      transformResponse: (response: ApiResponse<Record<string, unknown> | null>) => ({
        ...response,
        data: response.data ? normalizeSubscriptionRecord(response.data) : null
      }),
      invalidatesTags: ["MonthlySubscriptionAdmin", "MonthlyPlanAdmin"]
    }),
    getMonthlyOrdersAdmin: builder.query<ApiResponse<OrderRecord[]>, void>({
      query: () => "/admin/monthly-plan/orders",
      transformResponse: (response: ApiResponse<Array<Record<string, unknown>>>) => ({
        ...response,
        data: (response.data ?? []).map(normalizeOrderRecord)
      }),
      providesTags: ["MonthlyOrderAdmin"]
    }),
    updateMonthlyOrderAdmin: builder.mutation<ApiResponse<OrderRecord | null>, { id: string; patch: Partial<OrderRecord> }>({
      query: ({ id, patch }) => ({
        url: `/admin/monthly-plan/orders/${id}`,
        method: "PATCH",
        body: patch
      }),
      transformResponse: (response: ApiResponse<Record<string, unknown> | null>) => ({
        ...response,
        data: response.data ? normalizeOrderRecord(response.data) : null
      }),
      invalidatesTags: ["MonthlyOrderAdmin", "MonthlyPlanAdmin"]
    }),
    getMonthlyLocationsAdmin: builder.query<ApiResponse<LocationRecord[]>, void>({
      queryFn: async () => {
        const data = await monthlyPlanMockAdapter.listLocations();
        return { data: { success: true, data } };
      },
      providesTags: ["LocationAdmin"]
    }),
    upsertMonthlyLocationAdmin: builder.mutation<ApiResponse<LocationRecord>, LocationRecord>({
      queryFn: async (payload) => {
        const data = await monthlyPlanMockAdapter.upsertLocation(payload);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["LocationAdmin"]
    }),
    deleteMonthlyLocationAdmin: builder.mutation<ApiResponse<{ id: string }>, string>({
      queryFn: async (id) => {
        const data = await monthlyPlanMockAdapter.deleteLocation(id);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["LocationAdmin"]
    }),
    getMonthlyPlanSettings: builder.query<ApiResponse<MonthlyPlanGlobalSettings>, void>({
      queryFn: async () => {
        const data = await monthlyPlanMockAdapter.getSettings();
        return { data: { success: true, data } };
      },
      providesTags: ["MonthlySettingsAdmin"]
    }),
    updateMonthlyPlanSettings: builder.mutation<ApiResponse<MonthlyPlanGlobalSettings>, Partial<MonthlyPlanGlobalSettings>>({
      queryFn: async (payload) => {
        const data = await monthlyPlanMockAdapter.updateSettings(payload);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["MonthlySettingsAdmin"]
    }),
    getWebsitePagesAdmin: builder.query<ApiResponse<WebsitePageRecord[]>, void>({
      query: () => "/website-pages",
      providesTags: ["WebsitePagesAdmin"]
    }),
    getWebsitePageAdmin: builder.query<ApiResponse<WebsitePageRecord | null>, string>({
      query: (slug) => `/website-pages/${slug}`,
      providesTags: (_result, _error, slug) => [{ type: "WebsitePagesAdmin", id: slug }]
    }),
    upsertWebsitePageAdmin: builder.mutation<ApiResponse<WebsitePageRecord>, WebsitePageRecord>({
      query: (payload) => ({
        url: "/website-pages/upsert",
        method: "POST",
        body: payload
      }),
      invalidatesTags: (_result, _error, payload) => [
        "WebsitePagesAdmin",
        { type: "WebsitePagesAdmin", id: payload.slug }
      ]
    }),
    deleteWebsitePageAdmin: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/website-pages/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["WebsitePagesAdmin"]
    }),
    getWebsiteMenuCategoriesAdmin: builder.query<ApiResponse<WebsiteMenuCategoryRecord[]>, void>({
      queryFn: async () => {
        const data = await backofficeMockAdapter.listWebsiteMenuCategories();
        return { data: { success: true, data } };
      },
      providesTags: ["WebsiteMenuCategoriesAdmin"]
    }),
    upsertWebsiteMenuCategoryAdmin: builder.mutation<ApiResponse<WebsiteMenuCategoryRecord>, WebsiteMenuCategoryRecord>({
      queryFn: async (payload) => {
        const data = await backofficeMockAdapter.upsertWebsiteMenuCategory(payload);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["WebsiteMenuCategoriesAdmin"]
    }),
    deleteWebsiteMenuCategoryAdmin: builder.mutation<ApiResponse<{ id: string }>, string>({
      queryFn: async (id) => {
        const data = await backofficeMockAdapter.deleteWebsiteMenuCategory(id);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["WebsiteMenuCategoriesAdmin"]
    }),
    getWebsiteSettingsAdmin: builder.query<ApiResponse<WebsiteSettingsRecord>, void>({
      queryFn: async () => {
        const data = await backofficeMockAdapter.getWebsiteSettings();
        return { data: { success: true, data } };
      },
      providesTags: ["WebsiteSettingsAdmin"]
    }),
    updateWebsiteSettingsAdmin: builder.mutation<ApiResponse<WebsiteSettingsRecord>, Partial<WebsiteSettingsRecord>>({
      queryFn: async (payload) => {
        const data = await backofficeMockAdapter.updateWebsiteSettings(payload);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["WebsiteSettingsAdmin"]
    }),
    getAdminRoles: builder.query<ApiResponse<AdminRoleRecord[]>, void>({
      query: () => "/admin-roles",
      providesTags: ["AdminRoles"]
    }),
    upsertAdminRole: builder.mutation<ApiResponse<AdminRoleRecord>, AdminRoleRecord>({
      query: (body) => ({
        url: "/admin-roles/upsert",
        method: "POST",
        body
      }),
      invalidatesTags: ["AdminRoles", "AdminUsers", "AdminAuth"]
    }),
    deleteAdminRole: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/admin-roles/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["AdminRoles", "AdminUsers", "AdminAuth"]
    }),
    getAdminUsers: builder.query<ApiResponse<AdminUserRecord[]>, void>({
      query: () => "/admin-users",
      providesTags: ["AdminUsers"]
    }),
    upsertAdminUser: builder.mutation<
      ApiResponse<AdminUserRecord>,
      {
        id?: string;
        fullName: string;
        email: string;
        password?: string;
        role: AdminUserRecord["role"];
        adminRoleId: string;
        allowedPages: string[];
        canPublish: boolean;
        canManageUsers: boolean;
        isActive: boolean;
      }
    >({
      query: ({ id, ...body }) =>
        id
          ? { url: `/admin-users/${id}`, method: "PATCH", body }
          : { url: "/admin-users", method: "POST", body },
      invalidatesTags: ["AdminUsers", "AdminRoles", "AdminAuth"]
    }),
    deleteAdminUser: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({
        url: `/admin-users/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["AdminUsers", "AdminRoles", "AdminAuth"]
    })
  })
});

export const {
  useGetDashboardQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useDeleteRestaurantMutation,
  useGetLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useGetMonthlyPlansQuery,
  useCreateMonthlyPlanMutation,
  useUpdateMonthlyPlanMutation,
  useDeleteMonthlyPlanMutation,
  useGetPlanFlowsQuery,
  useUpdatePlanFlowMutation,
  useGetIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useGetSubscriptionsQuery,
  useUpdateSubscriptionMutation,
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useGetPromoCodesAdminQuery,
  useCreatePromoCodeAdminMutation,
  useUpdatePromoCodeAdminMutation,
  useDeletePromoCodeAdminMutation,
  useGetOrdersOfDayQuery,
  useGetPrintableOrdersQuery,
  useAdminLoginMutation,
  useGetAdminMeQuery,
  useAdminLogoutMutation,
  useSendCodeMutation,
  useVerifyCodeMutation,
  useResetPasswordMutation,
  useGetMonthlyPlanOverviewQuery,
  useGetMonthlyPlanAdminListQuery,
  useGetMonthlyPlanDetailsQuery,
  useLazyGetMonthlyPlanDetailsQuery,
  useUpsertMonthlyPlanDetailsMutation,
  useArchiveMonthlyPlanMutation,
  useDeleteMonthlyPlanAdminMutation,
  useGetMealLibraryAdminQuery,
  useUpsertMealLibraryAdminMutation,
  useDeleteMealLibraryAdminMutation,
  useGetCustomPlanCategoriesAdminQuery,
  useUpsertCustomPlanCategoryAdminMutation,
  useDeleteCustomPlanCategoryAdminMutation,
  useReorderCustomPlanCategoriesAdminMutation,
  useGetCustomPlanFoodItemsAdminQuery,
  useUpsertCustomPlanFoodItemAdminMutation,
  useDeleteCustomPlanFoodItemAdminMutation,
  useReorderCustomPlanFoodItemsAdminMutation,
  useGetMonthlySubscriptionsAdminQuery,
  useUpdateMonthlySubscriptionAdminMutation,
  useGetMonthlyOrdersAdminQuery,
  useUpdateMonthlyOrderAdminMutation,
  useGetMonthlyLocationsAdminQuery,
  useUpsertMonthlyLocationAdminMutation,
  useDeleteMonthlyLocationAdminMutation,
  useGetMonthlyPlanSettingsQuery,
  useUpdateMonthlyPlanSettingsMutation,
  useGetWebsitePagesAdminQuery,
  useGetWebsitePageAdminQuery,
  useUpsertWebsitePageAdminMutation,
  useDeleteWebsitePageAdminMutation,
  useGetWebsiteMenuCategoriesAdminQuery,
  useUpsertWebsiteMenuCategoryAdminMutation,
  useDeleteWebsiteMenuCategoryAdminMutation,
  useGetWebsiteSettingsAdminQuery,
  useUpdateWebsiteSettingsAdminMutation,
  useGetAdminRolesQuery,
  useUpsertAdminRoleMutation,
  useDeleteAdminRoleMutation,
  useGetAdminUsersQuery,
  useUpsertAdminUserMutation,
  useDeleteAdminUserMutation
} = adminApi;

