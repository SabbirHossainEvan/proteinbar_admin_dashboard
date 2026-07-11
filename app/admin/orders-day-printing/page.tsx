"use client";

import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetOrdersOfDayQuery, useGetPrintableOrdersQuery } from "@/redux/api/adminApi";

type DailyOrder = {
  orderId?: string;
  client?: string;
  orderType?: string;
  location?: string;
  items?: Array<{ qty?: number | string }>;
};

type PrintableOrder = {
  orderId?: string;
  meal?: string;
};

function getMealCount(order: DailyOrder) {
  return Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.qty ?? 0), 0) : 0;
}

export default function OrdersDayPrintingPage() {
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    isError: isOrdersError
  } = useGetOrdersOfDayQuery(undefined, { refetchOnMountOrArgChange: true });
  const {
    data: printableData,
    isLoading: isLoadingPrintable,
    isError: isPrintableError
  } = useGetPrintableOrdersQuery(undefined, { refetchOnMountOrArgChange: true });

  const orders: DailyOrder[] = ordersData?.data ?? [];
  const printableOrders: PrintableOrder[] = printableData?.data ?? [];
  const deliveryOrders = orders.filter((order) => String(order.orderType ?? "").toLowerCase() === "delivery");
  const pickupOrders = orders.filter((order) => String(order.orderType ?? "").toLowerCase() === "pickup");
  const totalMeals = orders.reduce((sum, order) => sum + getMealCount(order), 0);
  const uniquePrintableOrders = new Set(printableOrders.map((item) => item.orderId).filter(Boolean));
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric"
  });

  return (
    <section className="space-y-7">
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.16em] text-amber-200/80">Kitchen & Dispatch</p>
        <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Orders of the Day & Printing</h2>
        <p className="mt-3 max-w-3xl text-sm text-zinc-300">
          Live daily production overview for {today}. Open the detailed sheet or label printer from here.
        </p>
      </div>

      {isLoadingOrders || isLoadingPrintable ? <LoadingState label="Loading today's kitchen and printing data..." /> : null}
      {isOrdersError || isPrintableError ? <ErrorState label="Failed to load Orders of the Day & Printing data." /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today's Orders", value: String(orders.length) },
          { label: "Meals to Prepare", value: String(totalMeals) },
          { label: "Pickup Orders", value: String(pickupOrders.length) },
          { label: "Delivery Orders", value: String(deliveryOrders.length) }
        ].map((stat) => (
          <article key={stat.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/orders-of-day" className="admin-panel rounded-2xl p-5 transition hover:border-amber-300/45">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Daily Sheet</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Orders of the Day</h3>
          <p className="mt-2 text-sm text-zinc-300">View grouped delivery and pickup orders, then print/export the kitchen handover sheet.</p>
          <p className="mt-4 text-sm text-amber-200">{orders.length} orders loaded for today</p>
        </Link>

        <Link href="/admin/printing" className="admin-panel rounded-2xl p-5 transition hover:border-amber-300/45">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Labels</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Printing</h3>
          <p className="mt-2 text-sm text-zinc-300">Print meal labels for today&apos;s ready items with meal, macro, best-before, and order identifiers.</p>
          <p className="mt-4 text-sm text-amber-200">
            {printableOrders.length} labels across {uniquePrintableOrders.size} orders
          </p>
        </Link>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Today&apos;s Recent Orders</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Order</th>
                <th className="pb-2 pr-4 font-medium">Client</th>
                <th className="pb-2 pr-4 font-medium">Mode</th>
                <th className="pb-2 pr-4 font-medium">Location</th>
                <th className="pb-2 font-medium">Meals</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((order) => (
                <tr key={order.orderId}>
                  <td className="py-3 pr-4 text-zinc-100">{order.orderId}</td>
                  <td className="py-3 pr-4 text-zinc-300">{order.client || "Customer"}</td>
                  <td className="py-3 pr-4 text-zinc-300">{order.orderType || "-"}</td>
                  <td className="py-3 pr-4 text-zinc-300">{order.location || "-"}</td>
                  <td className="py-3 text-zinc-300">{getMealCount(order)}</td>
                </tr>
              ))}
              {!orders.length && !isLoadingOrders ? (
                <tr>
                  <td className="py-3 text-zinc-400" colSpan={5}>
                    No orders found for today.
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
