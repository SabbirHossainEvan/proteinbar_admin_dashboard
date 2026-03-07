"use client";

import StatusBadge from "@/components/admin/StatusBadge";
import { useGetSubscriptionsQuery, useUpdateSubscriptionMutation } from "@/redux/api/adminApi";

type SubscriptionItem = {
  _id?: string;
  id?: string;
  subscriptionId: string;
  client: string;
  plan: string;
  totalWeeks: number;
  currentWeek: number;
  dayProgress: string;
  remainingMeals: number;
  status: string;
  log: string[];
};

function getSubscriptionDocId(item: SubscriptionItem) {
  return String(item.id ?? item._id ?? "");
}

export default function SubscriptionsPage() {
  const { data, isLoading, isError } = useGetSubscriptionsQuery();
  const [updateSubscription, { isLoading: isUpdating }] = useUpdateSubscriptionMutation();

  const subscriptions: SubscriptionItem[] = (data?.data ?? []).map((item: any) => ({
    _id: item._id,
    id: item.id,
    subscriptionId: item.subscriptionId ?? "",
    client: item.client ?? "",
    plan: item.plan ?? "",
    totalWeeks: Number(item.totalWeeks ?? 0),
    currentWeek: Number(item.currentWeek ?? 0),
    dayProgress: item.dayProgress ?? "0/0",
    remainingMeals: Number(item.remainingMeals ?? 0),
    status: item.status ?? "Active",
    log: Array.isArray(item.log) ? item.log : []
  }));

  const applyUpdate = async (id: string, body: Record<string, unknown>) => {
    await updateSubscription({ id, body }).unwrap();
  };

  const togglePause = async (item: SubscriptionItem) => {
    const id = getSubscriptionDocId(item);
    if (!id) return;

    if (item.status === "Paused") {
      await applyUpdate(id, { status: "Active", logMessage: "Resumed by admin" });
      return;
    }
    await applyUpdate(id, { status: "Paused", logMessage: "Paused by admin" });
  };

  const reschedule = async (item: SubscriptionItem) => {
    const id = getSubscriptionDocId(item);
    if (!id) return;

    await applyUpdate(id, { dayProgress: "0/0", logMessage: "Reschedule requested (rules-based check pending)" });
  };

  const extendDuration = async (item: SubscriptionItem) => {
    const id = getSubscriptionDocId(item);
    if (!id) return;

    await applyUpdate(id, {
      totalWeeks: item.totalWeeks + 1,
      logMessage: "Extended subscription by 1 week"
    });
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Subscription Operations</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Subscription Progress Tracking</h2>
        <p className="mt-2 text-sm text-zinc-300">Track week/day delivery progress, remaining meals, and apply pause-resume-reschedule rules.</p>
      </div>

      <div className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        {isError ? <p className="mb-3 text-sm text-rose-300">Failed to load subscriptions.</p> : null}
        <table className="admin-table min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-medium">Subscription</th>
              <th className="pb-2 pr-4 font-medium">Client</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Progress</th>
              <th className="pb-2 pr-4 font-medium">Remaining Meals</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Controls</th>
              <th className="pb-2 font-medium">Recent Actions</th>
            </tr>
          </thead>
          <tbody>
            {(isLoading ? [] : subscriptions).map((subscription) => {
              const docId = getSubscriptionDocId(subscription);
              return (
                <tr key={docId || subscription.subscriptionId}>
                  <td className="py-3.5 pr-4 text-zinc-200">{subscription.subscriptionId}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{subscription.client}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{subscription.plan}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    Week {subscription.currentWeek}/{subscription.totalWeeks}
                    <p className="text-xs text-zinc-400">Day {subscription.dayProgress}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">{subscription.remainingMeals}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={subscription.status} />
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!docId || isUpdating}
                        onClick={() => void togglePause(subscription)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200 disabled:opacity-60"
                      >
                        {subscription.status === "Paused" ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        disabled={!docId || isUpdating}
                        onClick={() => void reschedule(subscription)}
                        className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-60"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        disabled={!docId || isUpdating}
                        onClick={() => void extendDuration(subscription)}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-60"
                      >
                        Extend +1 Week
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 text-zinc-300">
                    <p className="max-w-56 truncate" title={subscription.log[0]}>
                      {subscription.log[0] ?? "-"}
                    </p>
                    <p className="text-xs text-zinc-500">{subscription.log.length} logs</p>
                  </td>
                </tr>
              );
            })}
            {!isLoading && subscriptions.length === 0 ? (
              <tr>
                <td className="py-3.5 text-zinc-400" colSpan={8}>No subscriptions found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
