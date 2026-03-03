"use client";

import { useState } from "react";

const initialNotifications = [
  { id: "NOTIF-1", title: "New order received", meta: "ORD-2092 from Casablanca", time: "2 min ago", status: "Unread" },
  { id: "NOTIF-2", title: "Plan updated", meta: "Super Saver Subscription edited", time: "18 min ago", status: "Unread" },
  { id: "NOTIF-3", title: "Delivery alert", meta: "CFC branch cut-off changed", time: "1 hour ago", status: "Read" },
  { id: "NOTIF-4", title: "Low stock warning", meta: "Protein Oats inventory is below threshold", time: "3 hours ago", status: "Read" },
];

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<(typeof initialNotifications)[number] | null>(null);

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Alerts Center</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Notifications</h2>
        <p className="mt-2 text-sm text-zinc-300">Track operational alerts and admin activity updates.</p>
      </div>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Recent Notifications</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium">Details</th>
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">{notification.title}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{notification.meta}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{notification.time}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{notification.status}</td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="View notification"
                        onClick={() => setSelectedNotification(notification)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/40 bg-amber-300/10 text-amber-100 transition hover:bg-amber-300/20"
                      >
                        <ViewIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete notification"
                        onClick={() => deleteNotification(notification.id)}
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
      </section>

      {selectedNotification ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/65 p-4" onClick={() => setSelectedNotification(null)}>
          <div
            className="admin-panel w-full max-w-lg rounded-2xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Notification Details</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{selectedNotification.title}</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-zinc-300">
                <span className="text-zinc-400">Notification ID: </span>
                {selectedNotification.id}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Details: </span>
                {selectedNotification.meta}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Time: </span>
                {selectedNotification.time}
              </p>
              <p className="text-zinc-300">
                <span className="text-zinc-400">Status: </span>
                {selectedNotification.status}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
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
