"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetOrderDetailsQuery, useGetOrdersQuery, useUpdateOrderMutation } from "@/redux/api/adminApi";

type OrderStatus = "pending" | "confirmed" | "preparing" | "out-for-delivery" | "completed";

type BackendOrder = {
  _id?: string;
  id?: string;
  orderId?: string;
  client?: string;
  phone?: string;
  plan?: string;
  orderType?: string;
  location?: string;
  deliveryAddress?: string;
  pickupLocation?: string;
  payment?: string;
  total?: string;
  status?: string;
  confirmationStatus?: string;
  date?: string;
  schedule?: string;
  notes?: string;
  subscriptionInfo?: string;
  subscriptionDetails?: {
    daysPerWeek?: number;
    durationWeeks?: number;
    meals?: number;
  };
  items?: Array<{ name?: string; qty?: number; macros?: string }>;
  auditLog?: Array<{ at?: string; by?: string; action?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

type OrderView = {
  id: string;
  orderId: string;
  customerName: string;
  planTitle: string;
  planKind: "custom" | "normal";
  status: OrderStatus;
  paymentStatus: string;
  amount: number;
  orderDate: string;
  deliveryOption: string;
  locationName: string;
  items: Array<{ mealName: string; qty: number; macros: string }>;
};

const getOrderDocId = (item: Pick<BackendOrder, "_id" | "id">) => String(item._id ?? item.id ?? "");

const normalizeOrderStatus = (value: string | undefined): OrderStatus => {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (normalized === "confirmed") return "confirmed";
  if (normalized === "preparing") return "preparing";
  if (normalized === "out-for-delivery") return "out-for-delivery";
  if (normalized === "completed") return "completed";
  return "pending";
};

const inferPlanKind = (plan: string): "custom" | "normal" => {
  return /custom/i.test(plan) ? "custom" : "normal";
};

const toNumberAmount = (total: string | undefined): number => {
  const parsed = Number(String(total ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const inferDeliveryOption = (orderType: string | undefined): string => {
  return /pickup/i.test(orderType ?? "") ? "daily-pickup" : "daily-delivery";
};

const toOrderView = (item: BackendOrder): OrderView => {
  const planTitle = String(item.plan ?? "-");
  return {
    id: getOrderDocId(item),
    orderId: String(item.orderId ?? "-"),
    customerName: String(item.client ?? "-"),
    planTitle,
    planKind: inferPlanKind(planTitle),
    status: normalizeOrderStatus(item.status),
    paymentStatus: String(item.payment ?? "-").toLowerCase(),
    amount: toNumberAmount(item.total),
    orderDate: String(item.date ?? "-"),
    deliveryOption: inferDeliveryOption(item.orderType),
    locationName: String(item.location || item.pickupLocation || item.deliveryAddress || "-"),
    items: Array.isArray(item.items)
      ? item.items.map((line) => ({
          mealName: String(line.name ?? "Item"),
          qty: Number(line.qty ?? 0),
          macros: String(line.macros ?? "-")
        }))
      : []
  };
};

export default function OrdersPage() {
  const [filters, setFilters] = useState({ search: "", planKind: "all", status: "all", deliveryOption: "all" });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetOrdersQuery();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const {
    data: detailsData,
    isFetching: isDetailsLoading,
    isError: isDetailsError
  } = useGetOrderDetailsQuery(selectedOrderId ?? "", { skip: !selectedOrderId });

  const orderRows = useMemo<BackendOrder[]>(() => {
    return Array.isArray(data?.data) ? (data.data as BackendOrder[]) : [];
  }, [data]);

  const orders = useMemo<OrderView[]>(() => {
    return orderRows.map(toOrderView);
  }, [orderRows]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return orders.filter((item) => {
      const bySearch = !needle || `${item.orderId} ${item.customerName} ${item.planTitle} ${item.locationName}`.toLowerCase().includes(needle);
      const byKind = filters.planKind === "all" || item.planKind === filters.planKind;
      const byStatus = filters.status === "all" || item.status === filters.status;
      const byOption = filters.deliveryOption === "all" || item.deliveryOption === filters.deliveryOption;
      return bySearch && byKind && byStatus && byOption;
    });
  }, [filters, orders]);

  const selectedOrder = useMemo<BackendOrder | null>(() => {
    if (detailsData?.data && typeof detailsData.data === "object") {
      return detailsData.data as BackendOrder;
    }

    if (!selectedOrderId) return null;
    return orderRows.find((item) => getOrderDocId(item) === selectedOrderId) ?? null;
  }, [detailsData, selectedOrderId, orderRows]);

  const selectedOrderView = useMemo(() => {
    return selectedOrder ? toOrderView(selectedOrder) : null;
  }, [selectedOrder]);

  const setStatus = async (id: string, status: OrderStatus) => {
    if (!id) return;
    try {
      await updateOrder({ id, body: { status } }).unwrap();
    } catch {
      // Error UI is already handled by RTK query state.
    }
  };

  const exportCsv = () => {
    const headers = ["Order ID", "Date", "Customer", "Plan", "Plan Kind", "Delivery Option", "Location", "Payment", "Amount", "Status"];
    const lines = filtered.map((item) =>
      [item.orderId, item.orderDate, item.customerName, item.planTitle, item.planKind, item.deliveryOption, item.locationName, item.paymentStatus, item.amount.toFixed(2), item.status]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const closeDrawer = () => setSelectedOrderId(null);

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Monthly Order Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Orders</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage checkout outputs from custom/normal flow and control order status updates.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search order/customer/plan"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={filters.planKind}
            onChange={(event) => setFilters((prev) => ({ ...prev, planKind: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All kinds</option>
            <option value="custom">Custom</option>
            <option value="normal">Pre-made</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All status</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="out-for-delivery">out-for-delivery</option>
            <option value="completed">completed</option>
          </select>
          <select
            value={filters.deliveryOption}
            onChange={(event) => setFilters((prev) => ({ ...prev, deliveryOption: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All delivery options</option>
            <option value="daily-delivery">daily-delivery</option>
            <option value="daily-pickup">daily-pickup</option>
            <option value="weekly-delivery">weekly-delivery</option>
            <option value="weekly-pickup">weekly-pickup</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Print
          </button>
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading monthly orders..." /> : null}
      {isError ? <ErrorState label="Failed to load monthly orders." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Order</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Delivery</th>
                <th className="pb-2 pr-4 font-medium">Items</th>
                <th className="pb-2 pr-4 font-medium">Payment</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id || item.orderId}>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <button
                      type="button"
                      onClick={() => item.id && setSelectedOrderId(item.id)}
                      disabled={!item.id}
                      className="rounded-md text-left text-amber-100 transition hover:text-amber-200 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      {item.orderId}
                    </button>
                    <p className="text-xs text-zinc-400">{item.orderDate}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.customerName}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.planTitle}
                    <p className="text-xs text-zinc-400">{item.planKind}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.deliveryOption}
                    <p className="text-xs text-zinc-400">{item.locationName}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.items.map((line) => `${line.mealName} x${line.qty}`).join(", ")}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.paymentStatus}
                    <p className="text-xs text-zinc-400">${item.amount.toFixed(2)}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.status}</td>
                  <td className="py-3.5">
                    <select
                      value={item.status}
                      disabled={isUpdating || !item.id}
                      onChange={(event) => void setStatus(item.id, event.target.value as OrderStatus)}
                      className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-300"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="preparing">preparing</option>
                      <option value="out-for-delivery">out-for-delivery</option>
                      <option value="completed">completed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={8}>
                    No monthly orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      {selectedOrderId ? (
        <div className="fixed inset-0 z-[120] bg-zinc-950/65" onClick={closeDrawer}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-zinc-700/70 bg-zinc-950/95 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Order Details</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedOrderView?.orderId ?? "Loading..."}</h3>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Close
              </button>
            </div>

            {isDetailsLoading ? <p className="mt-5 text-sm text-zinc-300">Loading order details...</p> : null}
            {isDetailsError ? <p className="mt-5 text-sm text-rose-300">Failed to load order details.</p> : null}

            {!isDetailsLoading && !isDetailsError && selectedOrderView ? (
              <div className="mt-5 space-y-5 text-sm">
                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Client & Plan</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Customer: {selectedOrderView.customerName}</p>
                    <p>Phone: {selectedOrder?.phone ?? "-"}</p>
                    <p>Plan: {selectedOrderView.planTitle}</p>
                    <p>Flow: {selectedOrderView.planKind}</p>
                    <p>Subscription info: {selectedOrder?.subscriptionInfo ?? "-"}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Order Meta</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Status: {selectedOrderView.status}</p>
                    <p>Confirmation: {selectedOrder?.confirmationStatus ?? "-"}</p>
                    <p>Payment: {selectedOrderView.paymentStatus}</p>
                    <p>Total: ${selectedOrderView.amount.toFixed(2)}</p>
                    <p>Date: {selectedOrderView.orderDate}</p>
                    <p>Schedule: {selectedOrder?.schedule ?? "-"}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Delivery & Notes</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Mode: {selectedOrder?.orderType ?? "-"}</p>
                    <p>Location: {selectedOrderView.locationName}</p>
                    <p>Delivery address: {selectedOrder?.deliveryAddress ?? "-"}</p>
                    <p>Pickup location: {selectedOrder?.pickupLocation ?? "-"}</p>
                    <p>Notes: {selectedOrder?.notes ?? "-"}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Subscription Detail</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Days/week: {selectedOrder?.subscriptionDetails?.daysPerWeek ?? 0}</p>
                    <p>Duration weeks: {selectedOrder?.subscriptionDetails?.durationWeeks ?? 0}</p>
                    <p>Meals: {selectedOrder?.subscriptionDetails?.meals ?? 0}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Items</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    {selectedOrderView.items.length ? (
                      selectedOrderView.items.map((item, index) => (
                        <p key={`${item.mealName}-${index}`} className="rounded-lg border border-zinc-700/60 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
                          {item.mealName} x{item.qty} | {item.macros}
                        </p>
                      ))
                    ) : (
                      <p className="text-zinc-500">No items.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Audit Log</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    {Array.isArray(selectedOrder?.auditLog) && selectedOrder.auditLog.length ? (
                      selectedOrder.auditLog.map((entry, index) => (
                        <p key={`${entry.at}-${index}`} className="rounded-lg border border-zinc-700/60 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
                          [{entry.at ?? "-"}] {entry.by ?? "-"}: {entry.action ?? "-"}
                        </p>
                      ))
                    ) : (
                      <p className="text-zinc-500">No audit entries.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Timeline</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Created: {selectedOrder?.createdAt ?? "-"}</p>
                    <p>Updated: {selectedOrder?.updatedAt ?? "-"}</p>
                  </div>
                </section>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
