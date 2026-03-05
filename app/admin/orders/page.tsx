"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { orders as seedOrders, type ConfirmationStatus, type OrderStatus } from "@/data/admin/mock";

const workflowStatuses: OrderStatus[] = ["Pending", "Confirmed", "Prepared", "Delivered"];
const confirmationStatuses: ConfirmationStatus[] = ["Pending", "Confirmed", "Call back", "No answer"];

export default function OrdersPage() {
  const [orderList, setOrderList] = useState(seedOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(seedOrders[0]?.id ?? null);
  const [filters, setFilters] = useState({
    date: "",
    client: "",
    status: "",
    plan: "",
    mode: "",
    location: "",
    payment: "",
  });
  const [noteDraft, setNoteDraft] = useState("");

  const selectedOrder = orderList.find((order) => order.id === selectedOrderId) ?? null;

  const filteredOrders = useMemo(
    () =>
      orderList.filter((order) => {
        if (filters.date && !order.date.toLowerCase().includes(filters.date.toLowerCase())) return false;
        if (filters.client && !order.client.toLowerCase().includes(filters.client.toLowerCase())) return false;
        if (filters.status && order.status !== filters.status) return false;
        if (filters.plan && !order.plan.toLowerCase().includes(filters.plan.toLowerCase())) return false;
        if (filters.mode && order.orderType !== filters.mode) return false;
        if (filters.location && !order.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.payment && order.payment !== filters.payment) return false;
        return true;
      }),
    [filters, orderList],
  );

  const pushAudit = (targetId: string, action: string) => {
    const at = new Date().toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setOrderList((prev) =>
      prev.map((order) =>
        order.id === targetId
          ? {
              ...order,
              auditLog: [{ at, by: "Agent UI", action }, ...order.auditLog],
            }
          : order,
      ),
    );
  };

  const updateOrder = (targetId: string, patch: Partial<(typeof seedOrders)[number]>, action: string) => {
    setOrderList((prev) => prev.map((order) => (order.id === targetId ? { ...order, ...patch } : order)));
    pushAudit(targetId, action);
  };

  const addNote = () => {
    if (!selectedOrder || !noteDraft.trim()) return;
    updateOrder(selectedOrder.id, { notes: `${selectedOrder.notes} | ${noteDraft.trim()}` }, `Added note: ${noteDraft.trim()}`);
    setNoteDraft("");
  };

  const isEditable = selectedOrder ? ["Pending", "Confirmed"].includes(selectedOrder.status) : false;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Agent / CS Workflow</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Orders</h2>
        <p className="mt-2 text-sm text-zinc-300">Filter, verify, confirm, edit, and track every order action with audit logs.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Orders List Filters</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={filters.date}
            onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
            placeholder="Date"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            value={filters.client}
            onChange={(event) => setFilters((prev) => ({ ...prev, client: event.target.value }))}
            placeholder="Client"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="">All status</option>
            {workflowStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            value={filters.plan}
            onChange={(event) => setFilters((prev) => ({ ...prev, plan: event.target.value }))}
            placeholder="Plan"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={filters.mode}
            onChange={(event) => setFilters((prev) => ({ ...prev, mode: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="">Pickup/Delivery</option>
            <option value="Pickup">Pickup</option>
            <option value="Delivery">Delivery</option>
          </select>
          <input
            value={filters.location}
            onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Location"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={filters.payment}
            onChange={(event) => setFilters((prev) => ({ ...prev, payment: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="">Payment</option>
            <option value="Paid">Paid</option>
            <option value="COD">COD</option>
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <h3 className="text-lg font-semibold text-white">Orders</h3>
          <table className="admin-table mt-4 min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Order ID</th>
                <th className="pb-2 pr-4 font-medium">Client</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Mode</th>
                <th className="pb-2 pr-4 font-medium">Location</th>
                <th className="pb-2 pr-4 font-medium">Payment</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3.5 pr-4 text-zinc-200">{order.id}</td>
                  <td className="py-3.5 pr-4 text-zinc-100">{order.client}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{order.plan}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={order.orderType} />
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{order.location}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={order.payment} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge label={order.status} />
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{order.date}</td>
                  <td className="py-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-300/20"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="admin-panel rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white">Order Details + Actions</h3>
          {!selectedOrder ? (
            <p className="mt-4 text-sm text-zinc-300">Select any order from list to view details.</p>
          ) : (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid gap-2 text-zinc-300">
                <p>
                  <span className="text-zinc-400">Order details:</span> {selectedOrder.id} | {selectedOrder.plan} | {selectedOrder.date}
                </p>
                <p>
                  <span className="text-zinc-400">Client:</span> {selectedOrder.client} ({selectedOrder.phone})
                </p>
                <p>
                  <span className="text-zinc-400">Schedule:</span> {selectedOrder.schedule}
                </p>
                <p>
                  <span className="text-zinc-400">Payment:</span> {selectedOrder.payment} ({selectedOrder.total})
                </p>
                <p>
                  <span className="text-zinc-400">Notes:</span> {selectedOrder.notes}
                </p>
              </div>

              <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-amber-100">Delivery Configuration</p>
                <div className="mt-3 space-y-2 text-sm text-zinc-100">
                  <p className="flex items-center gap-2">
                    <span className="text-zinc-300">Selected option:</span>
                    <StatusBadge label={selectedOrder.orderType} />
                  </p>
                  {selectedOrder.orderType === "Delivery" ? (
                    <p>
                      <span className="text-zinc-300">Delivery address:</span>{" "}
                      {"deliveryAddress" in selectedOrder && selectedOrder.deliveryAddress
                        ? selectedOrder.deliveryAddress
                        : selectedOrder.location}
                    </p>
                  ) : (
                    <p>
                      <span className="text-zinc-300">Pickup location:</span>{" "}
                      {"pickupLocation" in selectedOrder && selectedOrder.pickupLocation
                        ? selectedOrder.pickupLocation
                        : selectedOrder.location}
                    </p>
                  )}
                  <p>
                    <span className="text-zinc-300">Location reference:</span> {selectedOrder.location}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Subscription Details</p>
                {"subscriptionDetails" in selectedOrder && selectedOrder.subscriptionDetails ? (
                  <div className="mt-3 grid gap-2 text-sm text-zinc-200 md:grid-cols-3">
                    <p className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-3 py-2">
                      <span className="text-zinc-400">Days / week:</span> {selectedOrder.subscriptionDetails.daysPerWeek}
                    </p>
                    <p className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-3 py-2">
                      <span className="text-zinc-400">Duration:</span> {selectedOrder.subscriptionDetails.durationWeeks} weeks
                    </p>
                    <p className="rounded-lg border border-zinc-700 bg-zinc-950/40 px-3 py-2">
                      <span className="text-zinc-400">Meals:</span> {selectedOrder.subscriptionDetails.meals}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-300">{selectedOrder.subscriptionInfo}</p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Items + Macros</p>
                <ul className="mt-2 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={`${selectedOrder.id}-${item.name}`} className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-2 text-zinc-200">
                      {item.name} x {item.qty}
                      <p className="text-xs text-zinc-400">{item.macros}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Agent Actions</p>
                <div className="grid gap-2">
                  <select
                    value={selectedOrder.confirmationStatus}
                    onChange={(event) =>
                      updateOrder(
                        selectedOrder.id,
                        { confirmationStatus: event.target.value as ConfirmationStatus },
                        `Confirmation status changed to ${event.target.value}`,
                      )
                    }
                    className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  >
                    {confirmationStatuses.map((status) => (
                      <option key={status} value={status} style={{ color: "#111111", backgroundColor: "#ffffff" }}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedOrder.status}
                    onChange={(event) =>
                      updateOrder(selectedOrder.id, { status: event.target.value as OrderStatus }, `Order status changed to ${event.target.value}`)
                    }
                    disabled={!isEditable && selectedOrder.status !== "Delivered"}
                    className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {workflowStatuses.map((status) => (
                      <option key={status} value={status} style={{ color: "#111111", backgroundColor: "#ffffff" }}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-zinc-400">
                    Edit window: {isEditable ? "Open (Pending/Confirmed)" : "Locked for this order"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Add internal note"
                      className="flex-1 rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
                    />
                    <button
                      type="button"
                      onClick={addNote}
                      className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Audit Log</p>
                <div className="mt-2 max-h-52 space-y-2 overflow-auto pr-1">
                  {selectedOrder.auditLog.map((entry, index) => (
                    <article key={`${entry.at}-${entry.by}-${index}`} className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-3 py-2 text-zinc-200">
                      <p className="text-xs text-zinc-400">{entry.at}</p>
                      <p>{entry.action}</p>
                      <p className="text-xs text-zinc-500">by {entry.by}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
