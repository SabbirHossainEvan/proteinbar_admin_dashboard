"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetSubscriptionDetailsQuery,
  useGetSubscriptionsQuery,
  useUpdateSubscriptionMutation
} from "@/redux/api/adminApi";

type SubscriptionStatus = "active" | "paused" | "cancelled" | "completed";

type BackendSubscription = {
  _id?: string;
  id?: string;
  subscriptionId?: string;
  client?: string;
  plan?: string;
  totalWeeks?: number;
  currentWeek?: number;
  dayProgress?: string;
  remainingMeals?: number;
  status?: string;
  log?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type SubscriptionView = {
  id: string;
  subscriptionId: string;
  customerName: string;
  customerPhone: string;
  planTitle: string;
  planKind: "custom" | "normal";
  status: SubscriptionStatus;
  currentWeek: number;
  totalWeeks: number;
  progressDays: string;
  remainingMeals: number;
  selections: {
    meals: number;
    days: number;
    snacks: number;
    startDate: string;
    planType: string;
    deliveryOption: string;
  };
};

const getSubscriptionDocId = (item: Pick<BackendSubscription, "_id" | "id">) => String(item._id ?? item.id ?? "");

const normalizeSubscriptionStatus = (value: string | undefined): SubscriptionStatus => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "paused") return "paused";
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "completed") return "completed";
  return "active";
};

const inferPlanKind = (plan: string): "custom" | "normal" => {
  return /custom/i.test(plan) ? "custom" : "normal";
};

const toSubscriptionView = (item: BackendSubscription): SubscriptionView => {
  const planTitle = String(item.plan ?? "-");
  const dayProgress = String(item.dayProgress ?? "-");

  return {
    id: getSubscriptionDocId(item),
    subscriptionId: String(item.subscriptionId ?? "-"),
    customerName: String(item.client ?? "-"),
    customerPhone: "-",
    planTitle,
    planKind: inferPlanKind(planTitle),
    status: normalizeSubscriptionStatus(item.status),
    currentWeek: Number(item.currentWeek ?? 0),
    totalWeeks: Number(item.totalWeeks ?? 0),
    progressDays: dayProgress,
    remainingMeals: Number(item.remainingMeals ?? 0),
    selections: {
      meals: 0,
      days: 0,
      snacks: 0,
      startDate: "-",
      planType: "-",
      deliveryOption: "-"
    }
  };
};

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetSubscriptionsQuery();
  const [updateSubscription, { isLoading: isUpdating }] = useUpdateSubscriptionMutation();
  const {
    data: detailsData,
    isFetching: isDetailsLoading,
    isError: isDetailsError
  } = useGetSubscriptionDetailsQuery(selectedSubscriptionId ?? "", { skip: !selectedSubscriptionId });

  const subscriptionRows = useMemo<BackendSubscription[]>(() => {
    return Array.isArray(data?.data) ? (data.data as BackendSubscription[]) : [];
  }, [data]);

  const subscriptions = useMemo<SubscriptionView[]>(() => {
    return subscriptionRows.map(toSubscriptionView);
  }, [subscriptionRows]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return subscriptions;
    return subscriptions.filter((item) => `${item.subscriptionId} ${item.customerName} ${item.planTitle}`.toLowerCase().includes(needle));
  }, [search, subscriptions]);

  const selectedSubscription = useMemo<BackendSubscription | null>(() => {
    if (detailsData?.data && typeof detailsData.data === "object") {
      return detailsData.data as BackendSubscription;
    }

    if (!selectedSubscriptionId) return null;
    return subscriptionRows.find((item) => getSubscriptionDocId(item) === selectedSubscriptionId) ?? null;
  }, [detailsData, selectedSubscriptionId, subscriptionRows]);

  const selectedSubscriptionView = useMemo(() => {
    return selectedSubscription ? toSubscriptionView(selectedSubscription) : null;
  }, [selectedSubscription]);

  const toggleStatus = async (id: string, status: Extract<SubscriptionStatus, "active" | "paused">) => {
    if (!id) return;
    try {
      await updateSubscription({ id, body: { status, logMessage: `Status updated to ${status}` } }).unwrap();
    } catch {
      // Error UI is already handled by RTK query state.
    }
  };

  const closeDrawer = () => setSelectedSubscriptionId(null);
  const activityLog = Array.isArray(selectedSubscription?.log) ? selectedSubscription.log : [];

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
                <tr key={item.id || item.subscriptionId}>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <button
                      type="button"
                      onClick={() => item.id && setSelectedSubscriptionId(item.id)}
                      disabled={!item.id}
                      className="rounded-md text-left text-amber-100 transition hover:text-amber-200 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400"
                    >
                      {item.subscriptionId}
                    </button>
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
                  <td className="py-3.5 pr-4 text-zinc-200">{item.status}</td>
                  <td className="py-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleStatus(item.id, item.status === "paused" ? "active" : "paused")}
                        disabled={isUpdating || !item.id}
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

      {selectedSubscriptionId ? (
        <div className="fixed inset-0 z-[120] bg-zinc-950/65" onClick={closeDrawer}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-zinc-700/70 bg-zinc-950/95 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Subscription Details</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedSubscriptionView?.subscriptionId ?? "Loading..."}</h3>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Close
              </button>
            </div>

            {isDetailsLoading ? <p className="mt-5 text-sm text-zinc-300">Loading subscription details...</p> : null}
            {isDetailsError ? <p className="mt-5 text-sm text-rose-300">Failed to load subscription details.</p> : null}

            {!isDetailsLoading && !isDetailsError && selectedSubscriptionView ? (
              <div className="mt-5 space-y-5 text-sm">
                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Profile</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Customer: {selectedSubscriptionView.customerName}</p>
                    <p>Plan: {selectedSubscriptionView.planTitle}</p>
                    <p>Flow: {selectedSubscriptionView.planKind}</p>
                    <p>Status: {selectedSubscriptionView.status}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Progress</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Week: {selectedSubscriptionView.currentWeek}/{selectedSubscriptionView.totalWeeks}</p>
                    <p>Day progress: {selectedSubscriptionView.progressDays}</p>
                    <p>Remaining meals: {selectedSubscriptionView.remainingMeals}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Timeline</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    <p>Created: {selectedSubscription?.createdAt ?? "-"}</p>
                    <p>Updated: {selectedSubscription?.updatedAt ?? "-"}</p>
                  </div>
                </section>

                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Activity Log</p>
                  <div className="mt-3 space-y-2 text-zinc-200">
                    {activityLog.length ? (
                      activityLog.map((entry, index) => (
                        <p key={`${entry}-${index}`} className="rounded-lg border border-zinc-700/60 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300">
                          {entry}
                        </p>
                      ))
                    ) : (
                      <p className="text-zinc-500">No log entries.</p>
                    )}
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
