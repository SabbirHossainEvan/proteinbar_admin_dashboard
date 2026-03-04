"use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { subscriptions as seedSubscriptions } from "@/data/admin/mock";

type SubscriptionItem = (typeof seedSubscriptions)[number] & {
  log: string[];
};

const initialSubscriptions: SubscriptionItem[] = seedSubscriptions.map((item) => ({
  ...item,
  log: ["Subscription initialized"],
}));

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(initialSubscriptions);

  const updateSubscription = (id: string, patch: Partial<SubscriptionItem>, log: string) => {
    setSubscriptions((prev) =>
      prev.map((subscription) =>
        subscription.id === id
          ? {
              ...subscription,
              ...patch,
              log: [log, ...subscription.log],
            }
          : subscription,
      ),
    );
  };

  const togglePause = (item: SubscriptionItem) => {
    if (item.status === "Paused") {
      updateSubscription(item.id, { status: "Active" }, "Resumed by admin");
      return;
    }
    updateSubscription(item.id, { status: "Paused" }, "Paused by admin");
  };

  const reschedule = (item: SubscriptionItem) => {
    updateSubscription(item.id, { dayProgress: "0/0" }, "Reschedule requested (rules-based check pending)");
  };

  const extendDuration = (item: SubscriptionItem) => {
    updateSubscription(item.id, { totalWeeks: item.totalWeeks + 1 }, "Extended subscription by 1 week");
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Subscription Operations</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Subscription Progress Tracking</h2>
        <p className="mt-2 text-sm text-zinc-300">Track week/day delivery progress, remaining meals, and apply pause-resume-reschedule rules.</p>
      </div>

      <div className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
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
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td className="py-3.5 pr-4 text-zinc-200">{subscription.id}</td>
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
                      onClick={() => togglePause(subscription)}
                      className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                    >
                      {subscription.status === "Paused" ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      onClick={() => reschedule(subscription)}
                      className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-400/20"
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => extendDuration(subscription)}
                      className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-400/20"
                    >
                      Extend +1 Week
                    </button>
                  </div>
                </td>
                <td className="py-3.5 text-zinc-300">
                  <p className="max-w-56 truncate" title={subscription.log[0]}>
                    {subscription.log[0]}
                  </p>
                  <p className="text-xs text-zinc-500">{subscription.log.length} logs</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
