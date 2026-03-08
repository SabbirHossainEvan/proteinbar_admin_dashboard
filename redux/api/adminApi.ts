import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { monthlyPlanMockAdapter, type MonthlyPlanDetailsPayload } from "@/redux/monthlyPlans/mockAdapter";
import type {
  LocationRecord,
  MealLibraryItem,
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

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: [
    "Dashboard",
    "Products",
    "MenuItems",
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
    "LocationAdmin",
    "MonthlySubscriptionAdmin",
    "MonthlyOrderAdmin",
    "MonthlySettingsAdmin"
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

    getOrdersOfDay: builder.query<ApiResponse<any[]>, void>({
      query: () => "/orders-of-day",
      providesTags: ["OrdersOfDay"]
    }),
    getPrintableOrders: builder.query<ApiResponse<any[]>, void>({
      query: () => "/printing",
      providesTags: ["Printable"]
    }),

    adminLogin: builder.mutation<ApiResponse<any>, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/admin-login", method: "POST", body })
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
      queryFn: async () => {
        const data = await monthlyPlanMockAdapter.getOverview();
        return { data: { success: true, data } };
      },
      providesTags: ["MonthlyPlanAdmin"]
    }),
    getMonthlyPlanAdminList: builder.query<ApiResponse<MonthlyPlan[]>, PlanListFilters | void>({
      queryFn: async (filters) => {
        const data = await monthlyPlanMockAdapter.listPlans(filters ?? {});
        return { data: { success: true, data } };
      },
      providesTags: ["MonthlyPlanAdmin"]
    }),
    getMonthlyPlanDetails: builder.query<ApiResponse<MonthlyPlanDetailsPayload | null>, string>({
      queryFn: async (id) => {
        const data = await monthlyPlanMockAdapter.getPlanById(id);
        return { data: { success: true, data } };
      },
      providesTags: (_result, _error, id) => [{ type: "MonthlyPlanDetails", id }]
    }),
    upsertMonthlyPlanDetails: builder.mutation<ApiResponse<MonthlyPlanDetailsPayload>, MonthlyPlanDetailsPayload>({
      queryFn: async (payload) => {
        const data = await monthlyPlanMockAdapter.upsertPlanDetails(payload);
        return { data: { success: true, data } };
      },
      invalidatesTags: (_result, _error, payload) => [
        "MonthlyPlanAdmin",
        { type: "MonthlyPlanDetails", id: payload.plan.id }
      ]
    }),
    archiveMonthlyPlan: builder.mutation<ApiResponse<{ id: string; status: MonthlyPlan["status"] } | null>, string>({
      queryFn: async (id) => {
        const data = await monthlyPlanMockAdapter.archivePlan(id);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["MonthlyPlanAdmin"]
    }),
    getMealLibraryAdmin: builder.query<ApiResponse<MealLibraryItem[]>, void>({
      queryFn: async () => {
        const data = await monthlyPlanMockAdapter.listMealLibrary();
        return { data: { success: true, data } };
      },
      providesTags: ["MealLibraryAdmin"]
    }),
    upsertMealLibraryAdmin: builder.mutation<ApiResponse<MealLibraryItem>, MealLibraryItem>({
      queryFn: async (payload) => {
        const data = await monthlyPlanMockAdapter.upsertMealLibraryItem(payload);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["MealLibraryAdmin", "MonthlyPlanAdmin"]
    }),
    deleteMealLibraryAdmin: builder.mutation<ApiResponse<{ id: string }>, string>({
      queryFn: async (id) => {
        const data = await monthlyPlanMockAdapter.deleteMealLibraryItem(id);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["MealLibraryAdmin", "MonthlyPlanAdmin"]
    }),
    getMonthlySubscriptionsAdmin: builder.query<ApiResponse<SubscriptionRecord[]>, void>({
      queryFn: async () => {
        const data = await monthlyPlanMockAdapter.listSubscriptions();
        return { data: { success: true, data } };
      },
      providesTags: ["MonthlySubscriptionAdmin"]
    }),
    updateMonthlySubscriptionAdmin: builder.mutation<ApiResponse<SubscriptionRecord | null>, { id: string; patch: Partial<SubscriptionRecord> }>({
      queryFn: async ({ id, patch }) => {
        const data = await monthlyPlanMockAdapter.updateSubscription(id, patch);
        return { data: { success: true, data } };
      },
      invalidatesTags: ["MonthlySubscriptionAdmin", "MonthlyPlanAdmin"]
    }),
    getMonthlyOrdersAdmin: builder.query<ApiResponse<OrderRecord[]>, void>({
      queryFn: async () => {
        const data = await monthlyPlanMockAdapter.listOrders();
        return { data: { success: true, data } };
      },
      providesTags: ["MonthlyOrderAdmin"]
    }),
    updateMonthlyOrderAdmin: builder.mutation<ApiResponse<OrderRecord | null>, { id: string; patch: Partial<OrderRecord> }>({
      queryFn: async ({ id, patch }) => {
        const data = await monthlyPlanMockAdapter.updateOrder(id, patch);
        return { data: { success: true, data } };
      },
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
  useGetOrdersOfDayQuery,
  useGetPrintableOrdersQuery,
  useAdminLoginMutation,
  useSendCodeMutation,
  useVerifyCodeMutation,
  useResetPasswordMutation,
  useGetMonthlyPlanOverviewQuery,
  useGetMonthlyPlanAdminListQuery,
  useGetMonthlyPlanDetailsQuery,
  useUpsertMonthlyPlanDetailsMutation,
  useArchiveMonthlyPlanMutation,
  useGetMealLibraryAdminQuery,
  useUpsertMealLibraryAdminMutation,
  useDeleteMealLibraryAdminMutation,
  useGetMonthlySubscriptionsAdminQuery,
  useUpdateMonthlySubscriptionAdminMutation,
  useGetMonthlyOrdersAdminQuery,
  useUpdateMonthlyOrderAdminMutation,
  useGetMonthlyLocationsAdminQuery,
  useUpsertMonthlyLocationAdminMutation,
  useDeleteMonthlyLocationAdminMutation,
  useGetMonthlyPlanSettingsQuery,
  useUpdateMonthlyPlanSettingsMutation
} = adminApi;

