"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetMonthlyOrdersAdminQuery,
  useGetMonthlySubscriptionsAdminQuery
} from "@/redux/api/adminApi";

type ClientRecord = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  state: string;
  area: string;
  address: string;
  preferredDeliveryOption: string;
  selectedPlan: string;
  meals: number;
  days: number;
  snacks: number;
  startDate: string;
  status: "Active" | "Paused" | "Lead";
};

const clientRecords: ClientRecord[] = [
  {
    id: "client-sara",
    fullName: "Sara Benali",
    firstName: "Sara",
    lastName: "Benali",
    phone: "+212600100200",
    email: "sara@example.com",
    state: "Casablanca",
    area: "CFC",
    address: "Apartment 12B, Street 8, CFC, Casablanca",
    preferredDeliveryOption: "daily-delivery",
    selectedPlan: "Weight loss for woman",
    meals: 2,
    days: 4,
    snacks: 0,
    startDate: "2026-04-23",
    status: "Active"
  },
  {
    id: "client-yassine",
    fullName: "Yassine Hadi",
    firstName: "Yassine",
    lastName: "Hadi",
    phone: "+212600100201",
    email: "yassine@example.com",
    state: "Casablanca",
    area: "Bourgogne",
    address: "Bourgogne Branch, Rue Taha Hussein, Casablanca",
    preferredDeliveryOption: "weekly-pickup",
    selectedPlan: "Lean muscle preset",
    meals: 2,
    days: 6,
    snacks: 1,
    startDate: "2026-04-21",
    status: "Paused"
  },
  {
    id: "client-nora",
    fullName: "Nora Ilyas",
    firstName: "Nora",
    lastName: "Ilyas",
    phone: "+212600100202",
    email: "nora@example.com",
    state: "Casablanca",
    area: "Maarif",
    address: "Building 4, Maarif Zone A, Casablanca",
    preferredDeliveryOption: "daily-delivery",
    selectedPlan: "Weight loss for woman",
    meals: 3,
    days: 5,
    snacks: 0,
    startDate: "2026-04-18",
    status: "Active"
  }
];

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clientRecords[0].id);
  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useGetMonthlyOrdersAdminQuery();
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions, isError: isSubscriptionsError } = useGetMonthlySubscriptionsAdminQuery();

  const filteredClients = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return clientRecords;
    return clientRecords.filter((client) =>
      [client.fullName, client.phone, client.email].some((value) => value.toLowerCase().includes(needle))
    );
  }, [search]);

  const selectedClient =
    filteredClients.find((client) => client.id === selectedClientId) ??
    clientRecords.find((client) => client.id === selectedClientId) ??
    clientRecords[0];

  const clientOrders = useMemo(() => {
    const orders = ordersData?.data ?? [];
    return orders.filter((order) => order.customerName.toLowerCase() === selectedClient.fullName.toLowerCase());
  }, [ordersData, selectedClient]);

  const clientSubscriptions = useMemo(() => {
    const subscriptions = subscriptionsData?.data ?? [];
    return subscriptions.filter((subscription) => subscription.customerName.toLowerCase() === selectedClient.fullName.toLowerCase());
  }, [selectedClient, subscriptionsData]);

  const isLoading = isLoadingOrders || isLoadingSubscriptions;
  const isError = isOrdersError || isSubscriptionsError;

  return (
    <section className="space-y-7">
      <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.16em] text-blue-200/80">Client Database</p>
        <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Clients</h2>
        <p className="mt-3 max-w-3xl text-sm text-zinc-300">
          Click the eye icon to open a client&apos;s full history, including subscriptions and orders.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Clients", value: String(clientRecords.length) },
          { label: "Active Subscribers", value: String((subscriptionsData?.data ?? []).filter((item) => item.status === "active").length) },
          { label: "Orders Tracked", value: String((ordersData?.data ?? []).length) },
          { label: "Paused Clients", value: String(clientRecords.filter((item) => item.status === "Paused").length) }
        ].map((item) => (
          <article key={item.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      {isLoading ? <LoadingState label="Loading client history..." /> : null}
      {isError ? <ErrorState label="Failed to load client history." /> : null}

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="admin-panel rounded-2xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Client List</h3>
              <p className="mt-1 text-sm text-zinc-300">Search by name, phone, or email and use the eye icon to view history.</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clients"
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-blue-300 lg:max-w-sm"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="admin-table min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="pb-2 pr-4 font-medium">Client</th>
                  <th className="pb-2 pr-4 font-medium">Phone</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td className="py-3.5 pr-4 text-zinc-100">{client.fullName}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">{client.phone}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">{client.email}</td>
                    <td className="py-3.5 pr-4 text-zinc-300">{client.status}</td>
                    <td className="py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedClientId(client.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-300 text-zinc-950 transition hover:bg-blue-200"
                        aria-label={`View ${client.fullName} history`}
                        title="View full history"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredClients.length ? (
                  <tr>
                    <td className="py-3.5 text-zinc-400" colSpan={5}>
                      No clients found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Full History</h3>
              <p className="mt-1 text-sm text-zinc-300">{selectedClient.fullName}</p>
            </div>
            <span className="rounded-full border border-zinc-600 px-3 py-1 text-xs uppercase tracking-[0.12em] text-zinc-300">
              {selectedClient.status}
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">First Name</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.firstName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Last Name</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.lastName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Phone Number</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.phone}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Email</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.email}</p>
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
          </div>

          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4">
            <p className="text-sm font-semibold text-white">Checkout Snapshot</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Selected Plan</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.selectedPlan}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Delivery Option</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.preferredDeliveryOption}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Meals</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.meals}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Days</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.days}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Snacks</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.snacks}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">Start Date</p>
                <p className="mt-1 text-sm text-zinc-200">{selectedClient.startDate}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">Subscriptions</p>
              <div className="mt-3 space-y-3">
                {clientSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/45 p-3">
                    <p className="text-sm font-semibold text-white">{subscription.planTitle}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {subscription.startDate} to {subscription.endDate}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Status: {subscription.status} | Delivery: {subscription.selections.deliveryOption}
                    </p>
                  </div>
                ))}
                {!clientSubscriptions.length ? <p className="text-sm text-zinc-400">No subscription history found.</p> : null}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Orders</p>
              <div className="mt-3 space-y-3">
                {clientOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/45 p-3">
                    <p className="text-sm font-semibold text-white">{order.orderId}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {order.orderDate} | {order.planTitle}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.deliveryOption} | {order.locationName} | {order.status}
                    </p>
                  </div>
                ))}
                {!clientOrders.length ? <p className="text-sm text-zinc-400">No order history found.</p> : null}
              </div>
            </div>
          </div>
        </section>
      </section>
    </section>
  );
}
