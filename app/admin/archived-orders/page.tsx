"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { formatMoney } from "@/lib/currency";
import { useGetArchivedMonthlyOrdersAdminQuery } from "@/redux/api/adminApi";
import type { OrderRecord, PlanKind } from "@/redux/monthlyPlans/types";

type OrderStatusFilter = OrderRecord["status"] | "all";
type DeliveryFilter = OrderRecord["deliveryOption"] | "all";
type PaymentFilter = OrderRecord["paymentStatus"] | "all";

function formatArchiveDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ArchivedOrdersPage() {
  const [search, setSearch] = useState("");
  const [planKind, setPlanKind] = useState<PlanKind | "all">("all");
  const [status, setStatus] = useState<OrderStatusFilter>("all");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryFilter>("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, isFetching, isError } = useGetArchivedMonthlyOrdersAdminQuery(
    {
      search: deferredSearch.trim(),
      planKind,
      status,
      deliveryOption,
      paymentStatus,
      page,
      limit
    },
    { refetchOnMountOrArgChange: true }
  );

  const orders = data?.data.items ?? [];
  const pagination = data?.data.pagination;
  const summary = data?.data.summary;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, planKind, status, deliveryOption, paymentStatus, limit]);

  return (
    <section className="space-y-7">
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.14),_transparent_30%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.16em] text-rose-200/80">Meal Prep Management</p>
        <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Archived Orders</h2>
        <p className="mt-3 max-w-3xl text-sm text-zinc-300">
          Review orders archived from the active Orders list. These records are hidden from operations, but they are not deleted from the database.
        </p>
        <div className="mt-5">
          <Link href="/admin/orders" className="rounded-xl border border-zinc-700 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500">
            Back to active orders
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Archived", value: String(summary?.totalArchivedOrders ?? 0) },
          { label: "Filtered Results", value: String(summary?.filteredArchivedOrders ?? 0) },
          { label: "Paid Archived", value: String(summary?.paidOrders ?? 0) },
          { label: "Failed/Unpaid/COD", value: String((summary?.failedOrders ?? 0) + (summary?.unpaidOrders ?? 0) + (summary?.codOrders ?? 0)) }
        ].map((item) => (
          <article key={item.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-3 xl:grid-cols-[1fr_repeat(5,160px)]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, email, phone, location, archive reason"
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-rose-300"
          />
          <select
            value={planKind}
            onChange={(event) => setPlanKind(event.target.value as PlanKind | "all")}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-rose-300"
          >
            <option value="all">All kinds</option>
            <option value="custom">Custom</option>
            <option value="normal">Pre-made</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatusFilter)}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-rose-300"
          >
            <option value="all">All status</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="out-for-delivery">out-for-delivery</option>
            <option value="completed">completed</option>
          </select>
          <select
            value={deliveryOption}
            onChange={(event) => setDeliveryOption(event.target.value as DeliveryFilter)}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-rose-300"
          >
            <option value="all">All delivery</option>
            <option value="daily-delivery">daily-delivery</option>
            <option value="daily-pickup">daily-pickup</option>
            <option value="weekly-delivery">weekly-delivery</option>
            <option value="weekly-pickup">weekly-pickup</option>
          </select>
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value as PaymentFilter)}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-rose-300"
          >
            <option value="all">All payment</option>
            <option value="paid">paid</option>
            <option value="unpaid">unpaid</option>
            <option value="failed">failed</option>
            <option value="cod">cod</option>
          </select>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-rose-300"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading archived orders..." /> : null}
      {isError ? <ErrorState label="Failed to load archived orders." /> : null}

      <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Archived Order List</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {pagination ? `${pagination.total} archived order${pagination.total === 1 ? "" : "s"} found` : "Loading archived order count..."}
              {isFetching && !isLoading ? " - refreshing..." : ""}
            </p>
          </div>
          {pagination ? (
            <p className="text-sm text-zinc-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          ) : null}
        </div>

        <table className="admin-table min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-medium">Order</th>
              <th className="pb-2 pr-4 font-medium">Customer</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Delivery</th>
              <th className="pb-2 pr-4 font-medium">Payment</th>
              <th className="pb-2 pr-4 font-medium">Archived</th>
              <th className="pb-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="py-3.5 pr-4 text-zinc-200">
                  <p className="font-medium text-rose-100">{order.orderId}</p>
                  <p className="text-xs text-zinc-500">Order date: {order.orderDate || "N/A"}</p>
                  <p className="text-xs text-zinc-500">Status: {order.status}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p className="text-zinc-100">{order.customerName}</p>
                  <p className="text-xs text-zinc-500">{order.customerEmail || "No email"}</p>
                  <p className="text-xs text-zinc-500">{order.customerPhone || "No phone"}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{order.planTitle || "N/A"}</p>
                  <p className="text-xs text-zinc-500">{order.planKind}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{order.deliveryOption}</p>
                  <p className="text-xs text-zinc-500">{order.locationName || order.deliveryAddress || "N/A"}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{order.paymentStatus}</p>
                  <p className="text-xs text-zinc-500">{formatMoney(order.amount, order.currency)}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{formatArchiveDate(order.archivedAt)}</p>
                  <p className="text-xs text-zinc-500">{order.archivedBy || "Admin"}</p>
                </td>
                <td className="max-w-xs py-3.5 text-zinc-300">
                  <p className="line-clamp-2">{order.archiveReason || "Archived from orders cleanup"}</p>
                </td>
              </tr>
            ))}
            {!orders.length && !isLoading ? (
              <tr>
                <td className="py-3.5 text-zinc-400" colSpan={7}>
                  No archived orders found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {pagination ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-400">
              Showing {orders.length ? (pagination.page - 1) * pagination.limit + 1 : 0}
              {" - "}
              {(pagination.page - 1) * pagination.limit + orders.length} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}
