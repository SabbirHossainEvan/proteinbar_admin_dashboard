"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { formatMoney } from "@/lib/currency";
import {
  useGetMonthlySubscriptionsAdminQuery,
  useUpdateMonthlySubscriptionAdminMutation
} from "@/redux/api/adminApi";
import type { SubscriptionRecord } from "@/redux/monthlyPlans/types";

type SubscriptionStatus = SubscriptionRecord["status"];

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkFeedback, setBulkFeedback] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionRecord | null>(null);
  const { data, isLoading, isError } = useGetMonthlySubscriptionsAdminQuery();
  const [updateSubscription, { isLoading: isUpdating }] = useUpdateMonthlySubscriptionAdminMutation();

  const filtered = useMemo(() => {
    const subscriptions = data?.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return subscriptions;
    return subscriptions.filter((item) =>
      `${item.subscriptionId} ${item.customerName} ${item.planTitle} ${item.customerPhone} ${item.customerEmail ?? ""}`.toLowerCase().includes(needle)
    );
  }, [data, search]);

  const visibleIds = useMemo(() => filtered.map((item) => item.id), [filtered]);
  const subscriptions = data?.data ?? [];
  const selectedItems = useMemo(
    () => subscriptions.filter((item) => selectedIds.includes(item.id)),
    [subscriptions, selectedIds]
  );
  const selectedCount = selectedIds.length;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.includes(id));

  const toggleStatus = async (id: string, status: SubscriptionStatus) => {
    await updateSubscription({ id, patch: { status } }).unwrap();
  };

  const toggleSelected = (id: string) => {
    setBulkFeedback("");
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleSelectAllVisible = () => {
    setBulkFeedback("");
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const runBulkStatusUpdate = async (status: Exclude<SubscriptionStatus, "completed">) => {
    const idsToUpdate = selectedItems
      .filter((item) => item.status !== status)
      .filter((item) => !(item.status === "cancelled" && status !== "cancelled"))
      .map((item) => item.id);

    if (!idsToUpdate.length) {
      setBulkFeedback("No selected subscriptions can be updated for that action.");
      return;
    }

    setBulkFeedback("");
    await Promise.all(idsToUpdate.map((id) => toggleStatus(id, status)));
    setSelectedIds((current) => current.filter((id) => !idsToUpdate.includes(id)));
    setBulkFeedback(`${idsToUpdate.length} subscription${idsToUpdate.length === 1 ? "" : "s"} updated.`);
  };

  const getRemaining = (endDate: string) => {
    const end = new Date(`${endDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = end.getTime() - today.getTime();
    const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      remainingDays,
      remainingWeeks: Math.ceil(remainingDays / 7)
    };
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Paid Plan Lifecycle Records</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Active Subscriptions</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Manage paid, CMI-confirmed meal-plan subscriptions only. Pending, unpaid, failed, and test checkout attempts stay in Orders until payment is confirmed.
        </p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="mb-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">
          <p className="font-semibold">Why this count can be lower than Orders</p>
          <p className="mt-1 text-amber-50/85">
            Orders is the full checkout/payment queue. Active Subscriptions is created only after CMI confirms payment, so unpaid orders can appear in Orders but not here.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setBulkFeedback("");
            }}
            placeholder="Search paid subscriptions by customer, plan, phone, or email"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-xs font-medium text-zinc-300">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={() => void runBulkStatusUpdate("paused")}
              disabled={!selectedCount || isUpdating}
              className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-200 disabled:opacity-50"
            >
              Bulk Pause
            </button>
            <button
              type="button"
              onClick={() => void runBulkStatusUpdate("active")}
              disabled={!selectedCount || isUpdating}
              className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Bulk Resume
            </button>
            <button
              type="button"
              onClick={() => void runBulkStatusUpdate("cancelled")}
              disabled={!selectedCount || isUpdating}
              className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              Bulk Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setBulkFeedback("");
              }}
              disabled={!selectedCount || isUpdating}
              className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
        {bulkFeedback ? <p className="mt-3 text-sm text-zinc-300">{bulkFeedback}</p> : null}
      </section>

      {isLoading ? <LoadingState label="Loading active subscriptions..." /> : null}
      {isError ? <ErrorState label="Failed to load active subscriptions." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(node) => {
                        if (node) node.indeterminate = someVisibleSelected && !allVisibleSelected;
                      }}
                      onChange={toggleSelectAllVisible}
                      disabled={!visibleIds.length || isUpdating}
                      className="h-4 w-4 accent-amber-300"
                    />
                    Select
                  </label>
                </th>
                <th className="pb-2 pr-4 font-medium">Subscription</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Flow</th>
                <th className="pb-2 pr-4 font-medium">Selection Params</th>
                <th className="pb-2 pr-4 font-medium">Progress</th>
                <th className="pb-2 pr-4 font-medium">Remaining</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={selectedIds.includes(item.id) ? "bg-amber-300/[0.04]" : undefined}>
                  <td className="py-3.5 pr-4 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      disabled={isUpdating}
                      aria-label={`Select subscription ${item.subscriptionId}`}
                      className="mt-1 h-4 w-4 accent-amber-300"
                    />
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <button
                      type="button"
                      onClick={() => setSelectedSubscription(item)}
                      className="text-left font-medium text-amber-200 transition hover:text-amber-100"
                    >
                      {item.subscriptionId}
                    </button>
                    <p className="text-xs text-zinc-400">{item.startDate || "No start date"}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-100">
                    {item.customerName}
                    <p className="text-xs text-zinc-400">{item.customerPhone}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.planTitle}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.planKind}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    meals:{item.selections.meals} days:{item.selections.days} snacks:{item.selections.snacks}
                    <p className="text-xs text-zinc-400">
                      start:{item.selections.startDate} planType:{item.selections.planType || "-"}
                    </p>
                    <p className="text-xs text-zinc-400">deliveryOption: {item.selections.deliveryOption}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    week {item.currentWeek}/{item.totalWeeks}
                    <p className="text-xs text-zinc-400">days {item.progressDays}</p>
                    <p className="text-xs text-zinc-400">remaining meals {item.remainingMeals}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {(() => {
                      const remaining = getRemaining(item.endDate);
                      return (
                        <>
                          {remaining.remainingDays} days
                          <p className="text-xs text-zinc-400">{remaining.remainingWeeks} weeks remaining</p>
                          <p className="text-xs text-zinc-400">
                            {item.startDate} to {item.endDate}
                          </p>
                        </>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.status}</td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubscription(item)}
                        className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 transition hover:border-zinc-500"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        title={item.status === "cancelled" ? "Cancelled subscriptions cannot be resumed from this shortcut." : undefined}
                        onClick={() => void toggleStatus(item.id, item.status === "paused" ? "active" : "paused")}
                        disabled={isUpdating || item.status === "cancelled"}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-60"
                      >
                        {item.status === "paused" ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleStatus(item.id, "cancelled")}
                        disabled={isUpdating || item.status === "cancelled"}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={10}>
                    No active subscriptions found. Paid CMI-confirmed plans will appear here; unpaid orders remain in Orders.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      {selectedSubscription ? (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close subscription details"
            onClick={() => setSelectedSubscription(null)}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Subscription Details</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedSubscription.subscriptionId}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedSubscription.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                  selectedSubscription.status === "paused" ? "bg-amber-500/20 text-amber-300" :
                  selectedSubscription.status === "cancelled" ? "bg-rose-500/20 text-rose-300" :
                  "bg-blue-500/20 text-blue-300"
                }`}>
                  {selectedSubscription.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubscription(null)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-500"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Customer</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedSubscription.customerName}</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Email: {selectedSubscription.customerEmail || "N/A"}</p>
                  <p>Phone: {selectedSubscription.customerPhone || "N/A"}</p>
                  <p>Emirate: {selectedSubscription.customerEmirate || "N/A"}</p>
                  <p>Area: {selectedSubscription.customerArea || "N/A"}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Plan</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedSubscription.planTitle}</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Plan ID: {selectedSubscription.planId || "N/A"}</p>
                  <p>
                    Kind: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                      selectedSubscription.planKind === "custom" ? "bg-violet-500/20 text-violet-300" : "bg-sky-500/20 text-sky-300"
                    }`}>{selectedSubscription.planKind}</span>
                  </p>
                  <p>Current Week: {selectedSubscription.currentWeek}/{selectedSubscription.totalWeeks}</p>
                  <p>Remaining Meals: {selectedSubscription.remainingMeals}</p>
                </div>
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Configuration</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-zinc-300">
                    <div className="flex justify-between"><span className="text-zinc-500">Meals:</span> <span className="font-medium text-white">{selectedSubscription.selections.meals}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Snacks:</span> <span className="font-medium text-white">{selectedSubscription.selections.snacks}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Days:</span> <span className="font-medium text-white">{selectedSubscription.selections.days}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Weeks:</span> <span className="font-medium text-white">{selectedSubscription.selections.weeks ?? selectedSubscription.totalWeeks}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-zinc-500">Start Date:</span> <span className="font-medium text-amber-200">{selectedSubscription.selections.startDate || "N/A"}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-zinc-500">Delivery Days:</span> <span className="font-medium text-amber-200">{selectedSubscription.selections.deliveryDays.join(", ") || "N/A"}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-zinc-500">Delivery Option:</span> <span className="font-medium text-amber-200">{selectedSubscription.selections.deliveryOption || "N/A"}</span></div>
                    {selectedSubscription.selections.planType ? (
                      <div className="flex justify-between col-span-2"><span className="text-zinc-500">Plan Type:</span> <span className="font-medium text-amber-200">{selectedSubscription.selections.planType}</span></div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Delivery</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300">
                  <p>Option: <span className="font-medium text-white">{selectedSubscription.selections.deliveryOption || "N/A"}</span></p>
                  <p>Address: {selectedSubscription.deliveryAddress || "N/A"}</p>
                  {selectedSubscription.pickupLocationName ? (
                    <p>Pickup Location: <span className="font-medium text-white">{selectedSubscription.pickupLocationName}</span></p>
                  ) : null}
                  <p>Subscription Window: {selectedSubscription.startDate || "N/A"} to {selectedSubscription.endDate || "N/A"}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Selected Meals</p>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    {selectedSubscription.selectedMeals?.length ?? 0} item{(selectedSubscription.selectedMeals?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedSubscription.selectedMeals?.length ? (
                    selectedSubscription.selectedMeals.map((meal, index) => (
                      <div key={`${meal.instanceId || meal.id}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-white">{meal.title}</p>
                          {(meal.totalPrice ?? 0) > 0 ? (
                            <span className="text-sm font-semibold text-amber-200">{formatMoney(meal.totalPrice ?? 0)}</span>
                          ) : null}
                        </div>
                        {meal.extrasSummary ? (
                          <p className="mt-1 text-xs text-amber-400/80">{meal.extrasSummary}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                          <span>Date: {meal.date || "N/A"}</span>
                          {meal.instanceId ? <span>Instance: {meal.instanceId}</span> : null}
                          <span>Meal ID: {meal.id || "N/A"}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">{meal.calories || 0} cal</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">P: {meal.protein || 0}g</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">C: {meal.carb || 0}g</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">F: {meal.fat || 0}g</span>
                        </div>
                        {(meal.basePrice ?? 0) > 0 && meal.basePrice !== meal.totalPrice ? (
                          <div className="mt-2 text-xs text-zinc-500">
                            Base Price: {formatMoney(meal.basePrice ?? 0)} to Total: {formatMoney(meal.totalPrice ?? 0)}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No meal details available for this subscription.</p>
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

