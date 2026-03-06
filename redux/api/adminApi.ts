import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
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
    "Printable"
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
  useResetPasswordMutation
} = adminApi;

