"use client";

import { useEffect, useState, useDeferredValue } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyClientDetailsAdminQuery, useGetMonthlyClientsAdminQuery } from "@/redux/api/adminApi";
import type { MonthlyClientRecord } from "@/redux/monthlyPlans/types";

type StatusFilter = "all" | "active" | "paused" | "lead";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, isFetching, isError } = useGetMonthlyClientsAdminQuery({
    search: deferredSearch.trim(),
    status,
    page,
    limit
  }, {
    refetchOnMountOrArgChange: true
  });
  const {
    data: selectedClientData,
    isLoading: isLoadingSelectedClient,
    isError: isSelectedClientError
  } = useGetMonthlyClientDetailsAdminQuery(selectedClientKey, {
    skip: !selectedClientKey,
    refetchOnMountOrArgChange: true
  });

  const clients = data?.data.items ?? [];
  const pagination = data?.data.pagination;
  const summary = data?.data.summary;
  const selectedClient = selectedClientKey
    ? selectedClientData?.data ?? clients.find((client) => client.key === selectedClientKey) ?? null
    : null;

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status, limit]);

  return (
    <section className="space-y-7">
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.16em] text-blue-200/80">Client Database</p>
        <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Clients</h2>
        <p className="mt-3 max-w-3xl text-sm text-zinc-300">
          Search and filter unique clients. Open a client to see full order and subscription history.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Clients", value: String(summary?.totalClients ?? 0) },
          { label: "Active Clients", value: String(summary?.activeClients ?? 0) },
          { label: "Paused Clients", value: String(summary?.pausedClients ?? 0) },
          { label: "Lead Clients", value: String(summary?.leadClients ?? 0) }
        ].map((item) => (
          <article key={item.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_150px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email, name, phone, order ID, subscription ID"
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-300"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-blue-300"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="lead">Lead</option>
          </select>
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-blue-300"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading clients..." /> : null}
      {isError ? <ErrorState label="Failed to load clients." /> : null}

      <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Client List</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {pagination ? `${pagination.total} client${pagination.total === 1 ? "" : "s"} found` : "Loading client count..."}
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
              <th className="pb-2 pr-4 font-medium">Client</th>
              <th className="pb-2 pr-4 font-medium">Contact</th>
              <th className="pb-2 pr-4 font-medium">Location</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Orders</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="py-3.5 pr-4 text-zinc-100">
                  <p className="font-medium">{client.fullName}</p>
                  <p className="text-xs text-zinc-500">Last order: {client.lastOrderDate || "N/A"}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{client.email}</p>
                  <p className="text-xs text-zinc-500">{client.phone}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{client.area}</p>
                  <p className="text-xs text-zinc-500">{client.state}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{client.selectedPlan}</p>
                  <p className="text-xs text-zinc-500">{client.preferredDeliveryOption}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">
                  <p>{client.orderCount} orders</p>
                  <p className="text-xs text-zinc-500">{formatMoney(client.totalSpent)}</p>
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">{client.status}</td>
                <td className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedClientKey(client.key)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-300 text-zinc-950 transition hover:bg-blue-200"
                    aria-label={`View ${client.fullName} history`}
                    title="View full history"
                  >
                    <EyeIcon />
                  </button>
                </td>
              </tr>
            ))}
            {!clients.length && !isLoading ? (
              <tr>
                <td className="py-3.5 text-zinc-400" colSpan={7}>
                  No clients found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {pagination ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
            <p className="text-sm text-zinc-400">
              Showing {clients.length ? (pagination.page - 1) * pagination.limit + 1 : 0}
              {" - "}
              {(pagination.page - 1) * pagination.limit + clients.length} of {pagination.total}
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

      {selectedClientKey ? (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close client details"
            onClick={() => setSelectedClientKey("")}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Full History</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedClient?.fullName ?? "Loading client..."}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientKey("")}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-500"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              {isLoadingSelectedClient ? <LoadingState label="Loading client history..." /> : null}
              {isSelectedClientError ? <ErrorState label="Failed to load client history." /> : null}
              {selectedClient ? (
                <>
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Email</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Phone</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">State</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.state}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Area</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.area}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Address</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.address}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-sm font-semibold text-white">Summary</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Orders</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Subscriptions</p>
                    <p className="mt-1 text-sm text-zinc-200">{selectedClient.subscriptionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Total Spent</p>
                    <p className="mt-1 text-sm text-zinc-200">{formatMoney(selectedClient.totalSpent)}</p>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-sm font-semibold text-white">Subscriptions</p>
                <div className="mt-3 space-y-3">
                  {selectedClient.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <p className="text-sm font-semibold text-white">{subscription.planTitle}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {subscription.startDate || "N/A"} to {subscription.endDate || "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {subscription.status} | {subscription.selections.deliveryOption}
                      </p>
                    </div>
                  ))}
                  {!selectedClient.subscriptions.length ? <p className="text-sm text-zinc-400">No subscription history found.</p> : null}
                </div>
              </section>

              <section>
                <p className="text-sm font-semibold text-white">Orders</p>
                <div className="mt-3 space-y-3">
                  {selectedClient.orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{order.orderId}</p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {order.orderDate || "N/A"} | {order.planTitle}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {order.deliveryOption} | {order.locationName || "N/A"} | {order.status}
                          </p>
                        </div>
                        <div className="text-right text-xs text-zinc-300">
                          <p>{order.paymentStatus}</p>
                          <p className="mt-1 text-zinc-500">{formatMoney(order.amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!selectedClient.orders.length ? <p className="text-sm text-zinc-400">No order history found.</p> : null}
                </div>
              </section>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
