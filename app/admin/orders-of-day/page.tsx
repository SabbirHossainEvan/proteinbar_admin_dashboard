"use client";

import { todaysOrders } from "@/data/admin/mock";

function openPrintDocument(title: string, body: string) {
  const printWindow = window.open("", "_blank", "width=980,height=760");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          p { margin: 0 0 16px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function OrdersOfDayPage() {
  const groupedByMode = {
    Delivery: todaysOrders.filter((order) => order.mode === "Delivery"),
    Pickup: todaysOrders.filter((order) => order.mode === "Pickup"),
  };

  const handlePrintDailySheet = () => {
    const rows = todaysOrders
      .map(
        (order) =>
          `<tr><td>${order.id}</td><td>${order.client}</td><td>${order.mode}</td><td>${order.slot}</td><td>${order.location}</td><td>${order.meals}</td></tr>`,
      )
      .join("");

    openPrintDocument(
      "Orders of the Day",
      `<h1>Orders of the Day</h1><p>${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "2-digit",
        year: "numeric",
      })}</p><table><thead><tr><th>Order ID</th><th>Client</th><th>Mode</th><th>Time Slot</th><th>Location</th><th>Meals</th></tr></thead><tbody>${rows}</tbody></table>`,
    );
  };

  const handleExportCsv = () => {
    const headers = ["Order ID", "Client", "Mode", "Time Slot", "Location", "Meals"];
    const lines = todaysOrders.map((order) => [order.id, order.client, order.mode, order.slot, order.location, order.meals].join(","));
    const csv = [headers.join(","), ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-of-day-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Operations View</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Orders of the Day</h2>
        <p className="mt-2 text-sm text-zinc-300">Daily production and delivery sheet grouped by mode, slot, and location.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {Object.entries(groupedByMode).map(([mode, list]) => (
          <section key={mode} className="admin-panel rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white">{mode}</h3>
            <div className="mt-4 space-y-2">
              {list.map((order) => (
                <article key={order.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/55 p-3 text-sm">
                  <p className="text-zinc-100">
                    {order.id} - {order.client}
                  </p>
                  <p className="text-zinc-300">Slot: {order.slot}</p>
                  <p className="text-zinc-300">Location: {order.location}</p>
                  <p className="text-xs text-zinc-400">Meals: {order.meals}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Export / Print</h3>
        <p className="mt-2 text-sm text-zinc-300">Generate daily sheet for kitchen packing and rider handover.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePrintDailySheet}
            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-200"
          >
            Print Daily Sheet
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-100 hover:border-zinc-500"
          >
            Export CSV
          </button>
        </div>
      </section>
    </section>
  );
}
