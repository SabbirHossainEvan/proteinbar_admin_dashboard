"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyOrdersAdminQuery, useUpdateMonthlyOrderAdminMutation } from "@/redux/api/adminApi";
import type { OrderRecord } from "@/redux/monthlyPlans/types";

export default function OrdersPage() {
  const [filters, setFilters] = useState({ search: "", planKind: "all", status: "all", deliveryOption: "all" });
  const { data, isLoading, isError } = useGetMonthlyOrdersAdminQuery();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateMonthlyOrderAdminMutation();

  const filtered = useMemo(() => {
    const orders = data?.data ?? [];
    const needle = filters.search.trim().toLowerCase();
    return orders.filter((item) => {
      const bySearch =
        !needle ||
        `${item.orderId} ${item.customerName} ${item.planTitle} ${item.locationName}`.toLowerCase().includes(needle);
      const byKind = filters.planKind === "all" || item.planKind === filters.planKind;
      const byStatus = filters.status === "all" || item.status === filters.status;
      const byOption = filters.deliveryOption === "all" || item.deliveryOption === filters.deliveryOption;
      return bySearch && byKind && byStatus && byOption;
    });
  }, [data, filters]);

  const setStatus = async (id: string, status: OrderRecord["status"]) => {
    await updateOrder({ id, patch: { status } }).unwrap();
  };

  const exportCsv = () => {
    const headers = ["Order ID", "Date", "Customer", "Plan", "Plan Kind", "Delivery Option", "Location", "Payment", "Amount", "Status"];
    const lines = filtered.map((item) =>
      [
        item.orderId,
        item.orderDate,
        item.customerName,
        item.planTitle,
        item.planKind,
        item.deliveryOption,
        item.locationName,
        item.paymentStatus,
        item.amount.toFixed(2),
        item.status
      ]
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
                <tr key={item.id}>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    {item.orderId}
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
                      disabled={isUpdating}
                      onChange={(event) => void setStatus(item.id, event.target.value as OrderRecord["status"])}
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
    </section>
  );
}
