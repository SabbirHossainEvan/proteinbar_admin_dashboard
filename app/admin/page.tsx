"use client";

import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyOrdersAdminQuery, useGetMonthlyPlanOverviewQuery } from "@/redux/api/adminApi";

export default function DashboardPage() {
  const { data: overviewData, isLoading, isError } = useGetMonthlyPlanOverviewQuery();
  const { data: ordersData, isError: isOrdersError } = useGetMonthlyOrdersAdminQuery();
  const overview = overviewData?.data;
  const latestOrders = (ordersData?.data ?? []).slice(0, 5);

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Monthly Plans</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Admin Control Center</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Live summary for custom and pre-made monthly plan operations.
        </p>
      </div>

      {isError ? <ErrorState label="Failed to load monthly plan overview." /> : null}
      {isLoading ? <LoadingState label="Loading dashboard summary..." /> : null}

      {!isLoading && overview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Active Plans", value: overview.activePlans },
            { title: "Custom Plans", value: overview.customPlans },
            { title: "Pre-made Plans", value: overview.normalPlans },
            { title: "Active Subscriptions", value: overview.activeSubscriptions },
            { title: "Pending Orders", value: overview.pendingOrders },
            { title: "Active Meal Library", value: overview.activeMeals }
          ].map((stat) => (
            <article key={stat.title} className="admin-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{stat.title}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
            </article>
          ))}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { href: "/admin/monthly-plans", title: "Monthly Plans", text: "Create, edit, archive plans and jump to tabbed detail editor." },
          { href: "/admin/subscriptions", title: "Subscriptions", text: "Track progress, pause/resume, and inspect selected flow params." },
          { href: "/admin/orders", title: "Orders", text: "Manage monthly orders by delivery mode, status, and payment state." },
          { href: "/admin/restaurants", title: "Restaurants", text: "Create restaurant branches that menu items can be assigned to." },
          { href: "/admin/meal-library", title: "Meal Library", text: "Configure assignable breakfast/lunch/dinner/snack meal catalog." },
          { href: "/admin/locations", title: "Locations", text: "Configure pickup and delivery locations per delivery option." }
        ].map((card) => (
          <Link key={card.href} href={card.href} className="admin-panel rounded-2xl p-5 transition hover:border-amber-300/45">
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-zinc-300">{card.text}</p>
          </Link>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Recent Monthly Orders</h3>
        {isOrdersError ? <p className="mt-3 text-sm text-rose-300">Failed to load order feed.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Order ID</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Flow</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3.5 pr-4 text-zinc-200">{order.orderId}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{order.customerName}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{order.planTitle}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{order.planKind}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{order.status}</td>
                  <td className="py-3.5 text-zinc-300">{order.orderDate}</td>
                </tr>
              ))}
              {!latestOrders.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={6}>
                    No monthly orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
