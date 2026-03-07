"use client";

import StatusBadge from "@/components/admin/StatusBadge";
import { useGetDashboardQuery } from "@/redux/api/adminApi";

export default function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery();

  const dashboardStats = data?.data?.dashboardStats ?? [];
  const latestOrders = data?.data?.latestOrders ?? [];

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Overview</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-300">Overview of proteinbar.vercel.app activity, menu, and subscriptions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(isLoading ? [{ title: "Loading...", value: "-" }] : dashboardStats).map((stat: any) => (
          <article key={stat.title} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">{stat.title}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Latest Orders</h3>
        {isError ? <p className="mt-4 text-sm text-rose-300">Failed to load dashboard data.</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Order ID</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Amount</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order: any) => (
                <tr key={order.id}>
                  <td className="py-3.5 pr-4 text-zinc-200">{order.id}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{order.customer}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{order.amount}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={order.status} />
                  </td>
                  <td className="py-3.5 text-zinc-300">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
