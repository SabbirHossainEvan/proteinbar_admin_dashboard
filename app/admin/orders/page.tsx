"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { formatMoney } from "@/lib/currency";
import { useBulkArchiveMonthlyOrdersAdminMutation, useGetMonthlyOrdersAdminQuery, useUpdateMonthlyOrderAdminMutation } from "@/redux/api/adminApi";
import type { OrderRecord } from "@/redux/monthlyPlans/types";

function paymentBadgeClass(status: OrderRecord["paymentStatus"]) {
  if (status === "paid") return "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/25";
  if (status === "failed") return "bg-red-500/20 text-red-300 ring-1 ring-red-400/25";
  if (status === "unpaid") return "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/25";
  return "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/25";
}

function orderStatusBadgeClass(status: OrderRecord["status"]) {
  if (status === "completed") return "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/25";
  if (status === "confirmed") return "bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/25";
  if (status === "preparing") return "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/25";
  if (status === "out-for-delivery") return "bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/25";
  return "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/25";
}

function formatDateTime(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getOrderTimestamp(order: OrderRecord) {
  return order.createdAt || order.orderDate;
}

export default function OrdersPage() {
  const [filters, setFilters] = useState({ search: "", planKind: "all", status: "all", deliveryOption: "all", paymentStatus: "all" });
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkError, setBulkError] = useState("");
  const { data, isLoading, isError } = useGetMonthlyOrdersAdminQuery();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateMonthlyOrderAdminMutation();
  const [bulkArchiveOrders, { isLoading: isArchiving }] = useBulkArchiveMonthlyOrdersAdminMutation();

  const filtered = useMemo(() => {
    const orders = data?.data ?? [];
    const needle = filters.search.trim().toLowerCase();
    return orders.filter((item) => {
      const bySearch =
        !needle ||
        `${item.orderId} ${item.customerName} ${item.planTitle} ${item.locationName}`.toLowerCase().includes(needle);
      const byKind = filters.planKind === "all" || item.planKind === filters.planKind;
      const byStatus = filters.status === "all" || item.status === filters.status;
      const byOption = filters.deliveryOption === "all" || item.deliveryOption === filters.deliveryOption;
      const byPayment = filters.paymentStatus === "all" || item.paymentStatus === filters.paymentStatus;
      return bySearch && byKind && byStatus && byOption && byPayment;
    });
  }, [data, filters]);

  const filteredIds = useMemo(() => filtered.map((item) => item.id), [filtered]);
  const selectedVisibleIds = useMemo(
    () => selectedOrderIds.filter((id) => filteredIds.includes(id)),
    [filteredIds, selectedOrderIds]
  );
  const selectedArchiveableIds = useMemo(
    () => filtered.filter((item) => selectedOrderIds.includes(item.id) && !item.isRecoveryOnly).map((item) => item.id),
    [filtered, selectedOrderIds]
  );
  const allVisibleSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedOrderIds.includes(id));

  useEffect(() => {
    const currentIds = new Set((data?.data ?? []).map((item) => item.id));
    setSelectedOrderIds((prev) => prev.filter((id) => currentIds.has(id)));
  }, [data]);

  const setStatus = async (id: string, status: OrderRecord["status"]) => {
    await updateOrder({ id, patch: { status } }).unwrap();
  };

  const toggleOrderSelection = (id: string) => {
    setBulkError("");
    setBulkMessage("");
    setSelectedOrderIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAllVisible = () => {
    setBulkError("");
    setBulkMessage("");
    setSelectedOrderIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  const archiveSelectedOrders = async () => {
    if (!selectedArchiveableIds.length) return;
    const confirmed = window.confirm(
      `Archive ${selectedArchiveableIds.length} selected order${selectedArchiveableIds.length === 1 ? "" : "s"}? They will be hidden from this list but not deleted from the database. Failed payment recovery-only attempts stay visible for follow-up.`
    );
    if (!confirmed) return;

    setBulkError("");
    setBulkMessage("");
    try {
      const response = await bulkArchiveOrders({
        ids: selectedArchiveableIds,
        reason: "Bulk archived from Meal Prep Management orders cleanup"
      }).unwrap();
      setBulkMessage(response.data?.message ?? response.message ?? "Selected orders archived.");
      setSelectedOrderIds((prev) => prev.filter((id) => !selectedArchiveableIds.includes(id)));
      if (selectedOrder && selectedArchiveableIds.includes(selectedOrder.id)) {
        setSelectedOrder(null);
      }
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "Failed to archive selected orders.");
    }
  };

  const exportCsv = () => {
    const headers = ["Order ID", "Date", "Customer", "Plan", "Plan Kind", "Delivery Option", "Location", "Payment", "Amount", "Currency", "Status"];
    const lines = filtered.map((item) =>
      [
        item.orderId,
        item.orderDate,
        item.customerName,
        item.planTitle,
        item.planKind,
        item.deliveryOption,
        item.locationName,
        item.paymentStatus,
        item.amount.toFixed(2),
        item.currency,
        item.status
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const generatedAt = new Date().toLocaleString();
    const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);
    const filterSummary = [
      filters.search.trim() ? `Search: ${filters.search.trim()}` : "Search: All",
      `Plan: ${filters.planKind}`,
      `Status: ${filters.status}`,
      `Delivery: ${filters.deliveryOption}`
    ];

    doc.setFillColor(17, 17, 17);
    doc.roundedRect(32, 28, pageWidth - 64, 106, 18, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PROTEIN", 56, 62);
    doc.setTextColor(217, 181, 111);
    doc.setFont("helvetica", "normal");
    doc.text("BAR", 140, 62);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("Orders Report", 56, 102);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(214, 211, 206);
    doc.text(`Generated ${generatedAt}`, 56, 120);
    doc.text("Meal Prep Management", pageWidth - 180, 62);
    doc.text(new Date().toISOString().slice(0, 10), pageWidth - 180, 80);

    const cards = [
      { label: "TOTAL ORDERS", value: String(filtered.length) },
      { label: "TOTAL AMOUNT", value: formatMoney(totalAmount, "MAD") },
      { label: "PENDING", value: String(filtered.filter((item) => item.status === "pending").length) }
    ];
    cards.forEach((card, index) => {
      const x = 32 + index * ((pageWidth - 80) / 3 + 8);
      const width = (pageWidth - 96) / 3;
      doc.setFillColor(255, 253, 248);
      doc.setDrawColor(216, 201, 173);
      doc.roundedRect(x, 154, width, 58, 12, 12, "FD");
      doc.setTextColor(113, 101, 84);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(card.label, x + 14, 176);
      doc.setTextColor(17, 17, 17);
      doc.setFontSize(18);
      doc.text(card.value, x + 14, 198);
    });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(95, 86, 73);
    doc.setFontSize(9);
    doc.text(filterSummary.join(" | "), 32, 238, { maxWidth: pageWidth - 64 });

    autoTable(doc, {
      startY: 256,
      head: [["Order", "Customer", "Plan", "Delivery", "Payment", "Status", "Amount"]],
      body: filtered.length
        ? filtered.map((item) => [
            `${item.orderId}\n${item.orderDate || "N/A"}`,
            `${item.customerName || "Customer"}\n${item.customerEmail || item.customerPhone || "No contact"}`,
            `${item.planTitle || "N/A"}\n${item.planKind}`,
            `${item.deliveryOption}\n${item.locationName || item.deliveryAddress || "N/A"}`,
            item.paymentStatus,
            item.status,
            formatMoney(item.amount, item.currency)
          ])
        : [["No orders found for the current filters.", "", "", "", "", "", ""]],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 7,
        lineColor: [238, 229, 215],
        lineWidth: 0.5,
        valign: "middle"
      },
      headStyles: {
        fillColor: [211, 170, 87],
        textColor: [17, 17, 17],
        fontStyle: "bold",
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [255, 253, 248]
      },
      columnStyles: {
        0: { cellWidth: 92 },
        1: { cellWidth: 128 },
        2: { cellWidth: 128 },
        3: { cellWidth: 112 },
        4: { cellWidth: 70, halign: "center", fontStyle: "bold" },
        5: { cellWidth: 82, halign: "center", fontStyle: "bold" },
        6: { cellWidth: 66, halign: "right", fontStyle: "bold" }
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const value = String(data.cell.raw ?? "");
        if (data.column.index === 4) {
          if (value === "paid") {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          } else if (value === "unpaid") {
            data.cell.styles.fillColor = [255, 228, 230];
            data.cell.styles.textColor = [190, 18, 60];
          } else if (value === "failed") {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [185, 28, 28];
          } else {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          }
        }
        if (data.column.index === 5) {
          if (value === "completed") {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          } else if (value === "confirmed") {
            data.cell.styles.fillColor = [219, 234, 254];
            data.cell.styles.textColor = [29, 78, 216];
          } else if (value === "preparing") {
            data.cell.styles.fillColor = [243, 232, 255];
            data.cell.styles.textColor = [126, 34, 206];
          } else if (value === "out-for-delivery") {
            data.cell.styles.fillColor = [255, 237, 213];
            data.cell.styles.textColor = [194, 65, 12];
          } else {
            data.cell.styles.fillColor = [254, 243, 199];
            data.cell.styles.textColor = [146, 64, 14];
          }
        }
      },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(129, 118, 103);
        doc.text("Proteinbar admin report", 32, pageHeight - 24);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 72, pageHeight - 24);
      }
    });

    doc.save(`proteinbar-orders-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Monthly Order Management</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Orders</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Orders shows every checkout/payment attempt: pending, unpaid, failed, and paid. Paid CMI-confirmed orders can create Subscriptions for ongoing plan delivery.
        </p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="mb-5 rounded-2xl border border-sky-300/25 bg-sky-300/10 p-4 text-sm text-sky-50">
          <p className="font-semibold">Orders vs Subscriptions</p>
          <p className="mt-1 text-sky-50/85">
            Use Orders to review checkout attempts and recover failed/unpaid sales. Use Subscriptions only for paid, confirmed meal-plan lifecycles after payment succeeds.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search order/customer/plan"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <select
            value={filters.planKind}
            onChange={(event) => setFilters((prev) => ({ ...prev, planKind: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All kinds</option>
            <option value="custom">Custom</option>
            <option value="normal">Pre-made</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All status</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="preparing">preparing</option>
            <option value="out-for-delivery">out-for-delivery</option>
            <option value="completed">completed</option>
          </select>
          <select
            value={filters.deliveryOption}
            onChange={(event) => setFilters((prev) => ({ ...prev, deliveryOption: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All delivery options</option>
            <option value="daily-delivery">daily-delivery</option>
            <option value="daily-pickup">daily-pickup</option>
            <option value="weekly-delivery">weekly-delivery</option>
            <option value="weekly-pickup">weekly-pickup</option>
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(event) => setFilters((prev) => ({ ...prev, paymentStatus: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All payment</option>
            <option value="paid">paid</option>
            <option value="unpaid">unpaid</option>
            <option value="failed">failed</option>
            <option value="cod">cod</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
            {selectedVisibleIds.length ? `${selectedVisibleIds.length} selected (${selectedArchiveableIds.length} archiveable)` : "Select orders to archive test data"}
          </span>
          <button
            type="button"
            onClick={() => void archiveSelectedOrders()}
            disabled={!selectedArchiveableIds.length || isArchiving}
            className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isArchiving ? "Archiving..." : "Archive selected"}
          </button>
          <Link
            href="/admin/archived-orders"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            View archived orders
          </Link>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="rounded-xl border border-amber-300/50 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Print
          </button>
        </div>
        {bulkMessage ? <p className="mt-3 text-sm text-emerald-300">{bulkMessage}</p> : null}
        {bulkError ? <p className="mt-3 text-sm text-rose-300">{bulkError}</p> : null}
      </section>

      {isLoading ? <LoadingState label="Loading monthly orders..." /> : null}
      {isError ? <ErrorState label="Failed to load monthly orders." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    disabled={!filteredIds.length}
                    aria-label="Select all visible orders"
                    onChange={toggleAllVisible}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                  />
                </th>
                <th className="pb-2 pr-4 font-medium">Order</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Delivery</th>
                <th className="pb-2 pr-4 font-medium">Items</th>
                <th className="pb-2 pr-4 font-medium">Payment</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={item.paymentStatus === "failed" ? "bg-red-500/[0.04]" : undefined}>
                  <td className="py-3.5 pr-4">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(item.id)}
                      aria-label={`Select order ${item.orderId}`}
                      onChange={() => toggleOrderSelection(item.id)}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                    />
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(item)}
                      className="text-left font-medium text-amber-200 transition hover:text-amber-100"
                    >
                      {item.orderId}
                    </button>
                    <p className="text-xs text-zinc-400">Attempted: {formatDateTime(getOrderTimestamp(item))}</p>
                    {item.updatedAt ? (
                      <p className="text-xs text-zinc-500">Updated: {formatDateTime(item.updatedAt)}</p>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.customerName}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.planTitle}
                    <p className="text-xs text-zinc-400">{item.planKind}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.deliveryOption}
                    <p className="text-xs text-zinc-400">{item.locationName}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.items.length} items</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentBadgeClass(item.paymentStatus)}`}>
                      {item.paymentStatus}
                    </span>
                    <p className="text-xs text-zinc-400">{formatMoney(item.amount, item.currency)}</p>
                    {item.paymentStatus === "failed" ? (
                      <p className="mt-1 text-xs font-medium text-red-300">Follow up</p>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-200">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(item)}
                        className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 transition hover:border-zinc-500"
                      >
                        View
                      </button>
                      <select
                        value={item.status}
                        disabled={isUpdating || item.isRecoveryOnly}
                        title={item.isRecoveryOnly ? "This is a failed payment attempt without a confirmed order lifecycle yet." : undefined}
                        onChange={(event) => void setStatus(item.id, event.target.value as OrderRecord["status"])}
                        className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-amber-300"
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="preparing">preparing</option>
                        <option value="out-for-delivery">out-for-delivery</option>
                        <option value="completed">completed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={9}>
                    No monthly orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}

      {selectedOrder ? (
        <div className="fixed inset-0 z-[120]">
          <button
            type="button"
            aria-label="Close order details"
            onClick={() => setSelectedOrder(null)}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Order Details</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedOrder.orderId}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selectedOrder.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                  selectedOrder.status === "confirmed" ? "bg-blue-500/20 text-blue-300" :
                  selectedOrder.status === "preparing" ? "bg-purple-500/20 text-purple-300" :
                  selectedOrder.status === "out-for-delivery" ? "bg-orange-500/20 text-orange-300" :
                  "bg-amber-500/20 text-amber-300"
                }`}>
                  {selectedOrder.status}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-500"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Customer</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedOrder.customerName}</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Email: {selectedOrder.customerEmail || "N/A"}</p>
                  <p>Phone: {selectedOrder.customerPhone || "N/A"}</p>
                  <p>Emirate: {selectedOrder.customerEmirate || "N/A"}</p>
                  <p>Area: {selectedOrder.customerArea || "N/A"}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Subscription</p>
                <p className="mt-2 text-sm font-mono text-amber-200">{selectedOrder.subscriptionId || "N/A"}</p>
                <div className="mt-2 text-sm text-zinc-300">
                  <p>Attempted / placed: {formatDateTime(getOrderTimestamp(selectedOrder))}</p>
                  <p>Order date: {selectedOrder.orderDate || "N/A"}</p>
                  <p>Last updated: {formatDateTime(selectedOrder.updatedAt)}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Plan</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedOrder.planTitle}</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Plan ID: {selectedOrder.planId || "N/A"}</p>
                  <p>Kind: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    selectedOrder.planKind === "custom" ? "bg-violet-500/20 text-violet-300" : "bg-sky-500/20 text-sky-300"
                  }`}>{selectedOrder.planKind}</span></p>
                </div>
                {selectedOrder.selections && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500 mb-2">Configuration</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-zinc-300">
                      <div className="flex justify-between"><span className="text-zinc-500">Meals:</span> <span className="font-medium text-white">{selectedOrder.selections.meals}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Snacks:</span> <span className="font-medium text-white">{selectedOrder.selections.snacks}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Days:</span> <span className="font-medium text-white">{selectedOrder.selections.days}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Weeks:</span> <span className="font-medium text-white">{selectedOrder.selections.weeks}</span></div>
                      <div className="flex justify-between col-span-2"><span className="text-zinc-500">Delivery Days:</span> <span className="font-medium text-amber-200">{selectedOrder.selections.deliveryDays}</span></div>
                      <div className="flex justify-between col-span-2"><span className="text-zinc-500">Start Date:</span> <span className="font-medium text-amber-200">{selectedOrder.selections.startDate}</span></div>
                      {selectedOrder.selections.planType && (
                        <div className="flex justify-between col-span-2"><span className="text-zinc-500">Plan Type:</span> <span className="font-medium text-amber-200">{selectedOrder.selections.planType}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Delivery</p>
                <div className="mt-3 grid gap-2 text-sm text-zinc-300">
                  <p>Option: <span className="font-medium text-white">{selectedOrder.deliveryOption}</span></p>
                  <p>Address: {selectedOrder.deliveryAddress || "N/A"}</p>
                  {selectedOrder.locationName && (
                    <p>Pickup Location: <span className="font-medium text-white">{selectedOrder.locationName}</span></p>
                  )}
                  {selectedOrder.locationId && (
                    <p>Location ID: <span className="text-zinc-400">{selectedOrder.locationId}</span></p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Payment &amp; Totals</p>
                {selectedOrder.paymentStatus === "failed" ? (
                  <div className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                    <p className="font-semibold">Failed payment attempt - follow up to recover the sale</p>
                    <p className="mt-1 text-red-100/80">
                      {selectedOrder.paymentFailureReason || "CMI marked this payment as failed or declined."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedOrder.customerPhone ? (
                        <a
                          href={`tel:${selectedOrder.customerPhone}`}
                          className="rounded-lg border border-red-300/30 bg-red-300/10 px-3 py-1.5 text-xs font-semibold text-red-50 transition hover:bg-red-300/20"
                        >
                          Call customer
                        </a>
                      ) : null}
                      {selectedOrder.customerEmail ? (
                        <a
                          href={`mailto:${selectedOrder.customerEmail}?subject=${encodeURIComponent(`Proteinbar payment follow-up for ${selectedOrder.orderId}`)}`}
                          className="rounded-lg border border-red-300/30 bg-red-300/10 px-3 py-1.5 text-xs font-semibold text-red-50 transition hover:bg-red-300/20"
                        >
                          Email customer
                        </a>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                  <p>Payment: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    selectedOrder.paymentStatus === "paid" ? "bg-emerald-500/20 text-emerald-300" :
                    selectedOrder.paymentStatus === "failed" ? "bg-red-500/20 text-red-300" :
                    selectedOrder.paymentStatus === "cod" ? "bg-amber-500/20 text-amber-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>{selectedOrder.paymentStatus}</span></p>
                  <p>Status: <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                    selectedOrder.status === "completed" ? "bg-emerald-500/20 text-emerald-300" :
                    selectedOrder.status === "confirmed" ? "bg-blue-500/20 text-blue-300" :
                    selectedOrder.status === "preparing" ? "bg-purple-500/20 text-purple-300" :
                    selectedOrder.status === "out-for-delivery" ? "bg-orange-500/20 text-orange-300" :
                    "bg-amber-500/20 text-amber-300"
                  }`}>{selectedOrder.status}</span></p>
                </div>
                {selectedOrder.totals ? (
                  <div className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
                    <div className="flex justify-between py-1"><span className="text-zinc-500">Subtotal:</span> <span>{formatMoney(selectedOrder.totals.subtotal, selectedOrder.currency)}</span></div>
                    {selectedOrder.totals.giftDiscount > 0 && (
                      <div className="flex justify-between py-1"><span className="text-zinc-500">Gift Discount:</span> <span className="text-emerald-400">-{formatMoney(selectedOrder.totals.giftDiscount, selectedOrder.currency)}</span></div>
                    )}
                    {selectedOrder.promoCode?.code && (
                      <div className="flex justify-between py-1"><span className="text-zinc-500">Promo ({selectedOrder.promoCode.code}):</span> <span className="text-emerald-400">-{formatMoney(selectedOrder.promoCode.discountAmount, selectedOrder.currency)}</span></div>
                    )}
                    <div className="flex justify-between py-1"><span className="text-zinc-500">VAT:</span> <span>{formatMoney(selectedOrder.totals.vat, selectedOrder.currency)}</span></div>
                    <div className="flex justify-between py-1"><span className="text-zinc-500">Safety Bag:</span> <span>{formatMoney(selectedOrder.totals.safetyBag, selectedOrder.currency)}</span></div>
                    <div className="flex justify-between border-t border-zinc-800 py-2 mt-1 font-semibold text-white"><span className="text-zinc-400">Grand Total:</span> <span className="text-lg">{formatMoney(selectedOrder.totals.grandTotal, selectedOrder.currency)}</span></div>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                    <p>Amount: {formatMoney(selectedOrder.amount, selectedOrder.currency)}</p>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Selected Meals</p>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedOrder.items.length ? (
                    selectedOrder.items.map((line, index) => (
                      <div key={`${line.mealId}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-semibold text-white">{line.mealName}</p>
                          {(line.totalPrice ?? 0) > 0 && (
                            <span className="text-sm font-semibold text-amber-200">{formatMoney(line.totalPrice ?? 0, selectedOrder.currency)}</span>
                          )}
                        </div>
                        {line.extrasSummary && (
                          <p className="mt-1 text-xs text-amber-400/80">{line.extrasSummary}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-400">
                          <span>Date: {line.date || "N/A"}</span>
                          {line.instanceId && <span>Instance: {line.instanceId}</span>}
                          <span>Meal ID: {line.mealId || "N/A"}</span>
                          <span>Type: {line.mealType}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">{line.calories || 0} cal</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">P: {line.protein || 0}g</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">C: {line.carb || 0}g</span>
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-xs text-zinc-300">F: {line.fat || 0}g</span>
                        </div>
                        {(line.basePrice ?? 0) > 0 && line.basePrice !== line.totalPrice && (
                          <div className="mt-2 text-xs text-zinc-500">
                            Base Price: {formatMoney(line.basePrice ?? 0, selectedOrder.currency)} → Total: {formatMoney(line.totalPrice ?? 0, selectedOrder.currency)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No item details available for this order.</p>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
