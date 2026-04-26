"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyOrdersAdminQuery, useUpdateMonthlyOrderAdminMutation } from "@/redux/api/adminApi";
import type { OrderRecord } from "@/redux/monthlyPlans/types";

export default function OrdersPage() {
  const [filters, setFilters] = useState({ search: "", planKind: "all", status: "all", deliveryOption: "all" });
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
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
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(item)}
                      className="text-left font-medium text-amber-200 transition hover:text-amber-100"
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
                  <td className="py-3.5 pr-4 text-zinc-300">{item.items.length} items</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.paymentStatus}
                    <p className="text-xs text-zinc-400">${item.amount.toFixed(2)}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.status}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(item)}
                        className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 transition hover:border-zinc-500"
                      >
                        View
                      </button>
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
                    </div>
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

      {selectedOrder ? (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close order details"
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Order Details</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedOrder.orderId}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedOrder.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                  selectedOrder.status === "confirmed" ? "bg-blue-500/20 text-blue-300" :
                  selectedOrder.status === "preparing" ? "bg-purple-500/20 text-purple-300" :
                  selectedOrder.status === "out-for-delivery" ? "bg-orange-500/20 text-orange-300" :
                  "bg-amber-500/20 text-amber-300"
                }`}>
                  {selectedOrder.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-500"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Customer</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedOrder.customerName}</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Email: {selectedOrder.customerEmail || "N/A"}</p>
                  <p>Phone: {selectedOrder.customerPhone || "N/A"}</p>
                  <p>Emirate: {selectedOrder.customerEmirate || "N/A"}</p>
                  <p>Area: {selectedOrder.customerArea || "N/A"}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Subscription</p>
                <p className="mt-2 text-sm font-mono text-amber-200">{selectedOrder.subscriptionId || "N/A"}</p>
                <div className="mt-2 text-sm text-zinc-300">
                  <p>Order Date: {selectedOrder.orderDate || "N/A"}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Plan</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedOrder.planTitle}</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Plan ID: {selectedOrder.planId || "N/A"}</p>
                  <p>Kind: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    selectedOrder.planKind === "custom" ? "bg-violet-500/20 text-violet-300" : "bg-sky-500/20 text-sky-300"
                  }`}>{selectedOrder.planKind}</span></p>
                </div>
                {selectedOrder.selections && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500 mb-2">Configuration</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-zinc-300">
                      <div className="flex justify-between"><span className="text-zinc-500">Meals:</span> <span className="font-medium text-white">{selectedOrder.selections.meals}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Snacks:</span> <span className="font-medium text-white">{selectedOrder.selections.snacks}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Days:</span> <span className="font-medium text-white">{selectedOrder.selections.days}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Weeks:</span> <span className="font-medium text-white">{selectedOrder.selections.weeks}</span></div>
                      <div className="flex justify-between col-span-2"><span className="text-zinc-500">Delivery Days:</span> <span className="font-medium text-amber-200">{selectedOrder.selections.deliveryDays}</span></div>
                      <div className="flex justify-between col-span-2"><span className="text-zinc-500">Start Date:</span> <span className="font-medium text-amber-200">{selectedOrder.selections.startDate}</span></div>
                      {selectedOrder.selections.planType && (
                        <div className="flex justify-between col-span-2"><span className="text-zinc-500">Plan Type:</span> <span className="font-medium text-amber-200">{selectedOrder.selections.planType}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Delivery</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300">
                  <p>Option: <span className="font-medium text-white">{selectedOrder.deliveryOption}</span></p>
                  <p>Address: {selectedOrder.deliveryAddress || "N/A"}</p>
                  {selectedOrder.locationName && (
                    <p>Pickup Location: <span className="font-medium text-white">{selectedOrder.locationName}</span></p>
                  )}
                  {selectedOrder.locationId && (
                    <p>Location ID: <span className="text-zinc-400">{selectedOrder.locationId}</span></p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Payment &amp; Totals</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Payment: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    selectedOrder.paymentStatus === "paid" ? "bg-emerald-500/20 text-emerald-300" :
                    selectedOrder.paymentStatus === "cod" ? "bg-amber-500/20 text-amber-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>{selectedOrder.paymentStatus}</span></p>
                  <p>Status: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    selectedOrder.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                    selectedOrder.status === "confirmed" ? "bg-blue-500/20 text-blue-300" :
                    selectedOrder.status === "preparing" ? "bg-purple-500/20 text-purple-300" :
                    selectedOrder.status === "out-for-delivery" ? "bg-orange-500/20 text-orange-300" :
                    "bg-amber-500/20 text-amber-300"
                  }`}>{selectedOrder.status}</span></p>
                </div>
                {selectedOrder.totals ? (
                  <div className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
                    <div className="flex justify-between py-1"><span className="text-zinc-500">Subtotal:</span> <span>${selectedOrder.totals.subtotal.toFixed(2)}</span></div>
                    {selectedOrder.totals.giftDiscount > 0 && (
                      <div className="flex justify-between py-1"><span className="text-zinc-500">Gift Discount:</span> <span className="text-emerald-400">-${selectedOrder.totals.giftDiscount.toFixed(2)}</span></div>
                    )}
                    {selectedOrder.promoCode?.code && (
                      <div className="flex justify-between py-1"><span className="text-zinc-500">Promo ({selectedOrder.promoCode.code}):</span> <span className="text-emerald-400">-${selectedOrder.promoCode.discountAmount.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between py-1"><span className="text-zinc-500">VAT:</span> <span>${selectedOrder.totals.vat.toFixed(2)}</span></div>
                    <div className="flex justify-between py-1"><span className="text-zinc-500">Safety Bag:</span> <span>${selectedOrder.totals.safetyBag.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-zinc-800 py-2 mt-1 font-semibold text-white"><span className="text-zinc-400">Grand Total:</span> <span className="text-lg">${selectedOrder.totals.grandTotal.toFixed(2)}</span></div>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                    <p>Amount: ${selectedOrder.amount.toFixed(2)}</p>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Selected Meals</p>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items.length ? (
                    selectedOrder.items.map((line, index) => (
                      <div key={`${line.mealId}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-white">{line.mealName}</p>
                          {(line.totalPrice ?? 0) > 0 && (
                            <span className="text-sm font-semibold text-amber-200">${line.totalPrice}</span>
                          )}
                        </div>
                        {line.extrasSummary && (
                          <p className="mt-1 text-xs text-amber-400/80">{line.extrasSummary}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                          <span>Date: {line.date || "N/A"}</span>
                          {line.instanceId && <span>Instance: {line.instanceId}</span>}
                          <span>Meal ID: {line.mealId || "N/A"}</span>
                          <span>Type: {line.mealType}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">{line.calories || 0} cal</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">P: {line.protein || 0}g</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">C: {line.carb || 0}g</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">F: {line.fat || 0}g</span>
                        </div>
                        {(line.basePrice ?? 0) > 0 && line.basePrice !== line.totalPrice && (
                          <div className="mt-2 text-xs text-zinc-500">
                            Base Price: ${line.basePrice} → Total: ${line.totalPrice}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No item details available for this order.</p>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
