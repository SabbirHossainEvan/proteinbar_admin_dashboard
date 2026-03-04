"use client";

import { printableOrders } from "@/data/admin/mock";

type PrintableOrder = (typeof printableOrders)[number];

function printLabelDocument(items: PrintableOrder[]) {
  const printWindow = window.open("", "_blank", "width=860,height=760");
  if (!printWindow) return;

  const labels = items
    .map(
      (item) => `
      <section class="label">
        <h2>${item.client}</h2>
        <p><strong>Date:</strong> ${item.date}</p>
        <p><strong>Meal:</strong> ${item.meal}</p>
        <p><strong>Macros:</strong> ${item.macros}</p>
        <p><strong>Best Before:</strong> ${item.bestBefore}</p>
        <p><strong>Order ID:</strong> ${item.orderId}</p>
        <p><strong>QR:</strong> [${item.orderId}]</p>
      </section>
    `,
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Order Labels</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color: #111827; }
          .label { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
          h2 { margin: 0 0 8px; font-size: 18px; }
          p { margin: 4px 0; font-size: 13px; }
        </style>
      </head>
      <body>
        ${labels}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function PrintingPage() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Kitchen / Packing</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Printing (Receipts / Labels)</h2>
        <p className="mt-2 text-sm text-zinc-300">Print per-client order labels with meal info, macros, best-before, and order ID/QR placeholder.</p>
      </div>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => printLabelDocument(printableOrders)}
            className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200"
          >
            Print All Labels
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Client</th>
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Meal</th>
                <th className="pb-2 pr-4 font-medium">Macros</th>
                <th className="pb-2 pr-4 font-medium">Best Before</th>
                <th className="pb-2 pr-4 font-medium">Order ID</th>
                <th className="pb-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {printableOrders.map((item) => (
                <tr key={`${item.orderId}-${item.meal}`}>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.client}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.date}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.meal}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.macros}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.bestBefore}</td>
                  <td className="py-3.5 pr-4 text-zinc-200">{item.orderId}</td>
                  <td className="py-3.5">
                    <button
                      type="button"
                      onClick={() => printLabelDocument([item])}
                      className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                    >
                      Print Label
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
