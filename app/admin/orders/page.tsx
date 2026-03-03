 "use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { orders } from "@/data/admin/mock";

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m6 6 1 14h10l1-14" />
      <path d="M10 10v7M14 10v7" />
    </svg>
  );
}

export default function OrdersPage() {
  const [orderList, setOrderList] = useState(orders);
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[number] | null>(null);

  const deleteOrder = (id: string) => {
    setOrderList((prev) => prev.filter((item) => item.id !== id));
    if (selectedOrder?.id === id) setSelectedOrder(null);
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Commerce</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Orders</h2>
        <p className="mt-2 text-sm text-zinc-300">Track live orders coming from website and subscriptions.</p>
      </div>

      <div className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
        <table className="admin-table min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="pb-2 pr-4 font-medium">Order ID</th>
              <th className="pb-2 pr-4 font-medium">Customer</th>
              <th className="pb-2 pr-4 font-medium">Items</th>
              <th className="pb-2 pr-4 font-medium">Total</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderList.map((order) => (
              <tr key={order.id}>
                <td className="py-3.5 pr-4 text-zinc-200">{order.id}</td>
                <td className="py-3.5 pr-4 text-zinc-100">{order.customer}</td>
                <td className="py-3.5 pr-4 text-zinc-300">{order.itemCount}</td>
                <td className="py-3.5 pr-4 text-zinc-200">{order.total}</td>
                <td className="py-3 pr-4">
                  <StatusBadge label={order.status} />
                </td>
                <td className="py-3.5 pr-4 text-zinc-300">{order.date}</td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="View order"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/40 bg-amber-300/10 text-amber-100 transition hover:bg-amber-300/20"
                    >
                      <ViewIcon />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete order"
                      onClick={() => deleteOrder(order.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-400/40 bg-rose-400/10 text-rose-100 transition hover:bg-rose-400/20"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/65 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="admin-panel w-full max-w-lg rounded-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Order Details</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{selectedOrder.id}</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-zinc-300">
                <span className="text-zinc-400">Customer: </span>
                {selectedOrder.customer}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Items: </span>
                {selectedOrder.itemCount}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Total: </span>
                {selectedOrder.total}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Status: </span>
                {selectedOrder.status}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Date: </span>
                {selectedOrder.date}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
