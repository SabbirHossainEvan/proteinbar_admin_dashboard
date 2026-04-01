"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetMonthlySubscriptionsAdminQuery,
  useUpdateMonthlySubscriptionAdminMutation
} from "@/redux/api/adminApi";

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useGetMonthlySubscriptionsAdminQuery();
  const [updateSubscription, { isLoading: isUpdating }] = useUpdateMonthlySubscriptionAdminMutation();
  const subscriptions = data?.data ?? [];

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return subscriptions;
    return subscriptions.filter((item) =>
      `${item.subscriptionId} ${item.customerName} ${item.planTitle}`.toLowerCase().includes(needle)
    );
  }, [search, subscriptions]);

  const toggleStatus = async (id: string, status: "active" | "paused") => {
    await updateSubscription({ id, patch: { status } }).unwrap();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Monthly Subscription Records</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Subscriptions</h2>
        <p className="mt-2 text-sm text-zinc-300">Track progress and control subscription status across custom and pre-made flows.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by subscription/customer/plan"
          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
        />
      </section>

      {isLoading ? <LoadingState label="Loading subscriptions..." /> : null}
      {isError ? <ErrorState label="Failed to load subscriptions." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Subscription</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Flow</th>
                <th className="pb-2 pr-4 font-medium">Selection Params</th>
                <th className="pb-2 pr-4 font-medium">Progress</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.subscriptionId}</td>
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
                  <td className="py-3.5 pr-4 text-zinc-200">{item.status}</td>
                  <td className="py-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleStatus(item.id, item.status === "paused" ? "active" : "paused")}
                        disabled={isUpdating}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-60"
                      >
                        {item.status === "paused" ? "Resume" : "Pause"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={8}>
                    No subscriptions found.
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
