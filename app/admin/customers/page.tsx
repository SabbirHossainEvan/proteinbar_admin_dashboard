"use client";

import { FormEvent, useEffect, useMemo, useState, useDeferredValue } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyClientDetailsAdminQuery, useGetMonthlyClientsAdminQuery, useUpdateMonthlyClientAdminMutation } from "@/redux/api/adminApi";
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

function clientStatusLabel(status: MonthlyClientRecord["status"]) {
  return status === "Lead" ? "Order-only / no active plan" : status;
}

const initialEditForm = {
  email: "",
  phone: "",
  address: ""
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedClientKey, setSelectedClientKey] = useState("");
  const [selectedClientKeys, setSelectedClientKeys] = useState<string[]>([]);
  const [editingClientKey, setEditingClientKey] = useState("");
  const [editForm, setEditForm] = useState(initialEditForm);
  const [editError, setEditError] = useState("");
  const [editMessage, setEditMessage] = useState("");
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
  const [updateClient, { isLoading: isUpdatingClient }] = useUpdateMonthlyClientAdminMutation();
  const selectedClient = selectedClientKey
    ? selectedClientData?.data ?? clients.find((client) => client.key === selectedClientKey) ?? null
    : null;
  const editingClient = editingClientKey
    ? selectedClientData?.data?.key === editingClientKey
      ? selectedClientData.data
      : clients.find((client) => client.key === editingClientKey) ?? null
    : null;
  const visibleClientKeys = useMemo(() => clients.map((client) => client.key), [clients]);
  const selectedVisibleClientKeys = useMemo(
    () => selectedClientKeys.filter((key) => visibleClientKeys.includes(key)),
    [selectedClientKeys, visibleClientKeys]
  );
  const allVisibleSelected = visibleClientKeys.length > 0 && visibleClientKeys.every((key) => selectedClientKeys.includes(key));

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status, limit]);

  useEffect(() => {
    setSelectedClientKeys((prev) => prev.filter((key) => visibleClientKeys.includes(key)));
  }, [visibleClientKeys]);

  const startEditClient = (client: MonthlyClientRecord) => {
    setEditingClientKey(client.key);
    setEditForm({
      email: client.email === "-" ? "" : client.email,
      phone: client.phone === "-" ? "" : client.phone,
      address: client.address === "-" ? "" : client.address
    });
    setEditError("");
    setEditMessage("");
  };

  const toggleClientSelection = (clientKey: string) => {
    setEditMessage("");
    setSelectedClientKeys((prev) => (prev.includes(clientKey) ? prev.filter((key) => key !== clientKey) : [...prev, clientKey]));
  };

  const toggleAllVisible = () => {
    setEditMessage("");
    setSelectedClientKeys((prev) => {
      if (allVisibleSelected) return prev.filter((key) => !visibleClientKeys.includes(key));
      return Array.from(new Set([...prev, ...visibleClientKeys]));
    });
  };

  const editSelectedClient = () => {
    if (selectedVisibleClientKeys.length !== 1) {
      setEditError("Select exactly one client to edit contact info.");
      return;
    }
    const client = clients.find((item) => item.key === selectedVisibleClientKeys[0]);
    if (client) startEditClient(client);
  };

  const saveClientInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClientKey) return;
    if (!editForm.email.trim()) {
      setEditError("Email is required.");
      return;
    }
    if (!editForm.phone.trim()) {
      setEditError("Phone is required.");
      return;
    }

    setEditError("");
    try {
      const response = await updateClient({
        clientKey: editingClientKey,
        patch: {
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim()
        }
      }).unwrap();
      setEditMessage("Client info updated.");
      setEditingClientKey("");
      setEditForm(initialEditForm);
      setSelectedClientKeys(response.data?.key ? [response.data.key] : []);
      if (selectedClientKey === editingClientKey && response.data?.key) {
        setSelectedClientKey(response.data.key);
      }
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update client info.");
    }
  };

  const exportPdf = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const generatedAt = new Date().toLocaleString();
    const totalSpent = clients.reduce((sum, client) => sum + client.totalSpent, 0);
    const filterSummary = [
      deferredSearch.trim() ? `Search: ${deferredSearch.trim()}` : "Search: All",
      `Status: ${status}`,
      `Page: ${pagination?.page ?? page} of ${pagination?.totalPages ?? 1}`,
      `Per page: ${limit}`
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
    doc.text("Clients Report", 56, 102);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(214, 211, 206);
    doc.text(`Generated ${generatedAt}`, 56, 120);
    doc.text("Meal Prep Management", pageWidth - 180, 62);
    doc.text(new Date().toISOString().slice(0, 10), pageWidth - 180, 80);

    const cards = [
      { label: "TOTAL CLIENTS", value: String(summary?.totalClients ?? clients.length) },
      { label: "VISIBLE CLIENTS", value: String(clients.length) },
      { label: "VISIBLE SPEND", value: formatMoney(totalSpent) }
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
      head: [["Client", "Contact", "Location", "Plan", "Orders", "Status", "Spent"]],
      body: clients.length
        ? clients.map((client) => [
            `${client.fullName}\nLast order: ${client.lastOrderDate || "N/A"}`,
            `${client.email}\n${client.phone}`,
            `${client.area}\n${client.state}\n${client.address}`,
            `${client.selectedPlan}\n${client.preferredDeliveryOption}`,
            `${client.orderCount} orders\n${client.subscriptionCount} subscriptions`,
            clientStatusLabel(client.status),
            formatMoney(client.totalSpent)
          ])
        : [["No clients found for the current filters.", "", "", "", "", "", ""]],
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
        fillColor: [147, 197, 253],
        textColor: [17, 24, 39],
        fontStyle: "bold",
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 251, 255]
      },
      columnStyles: {
        0: { cellWidth: 118 },
        1: { cellWidth: 130 },
        2: { cellWidth: 126 },
        3: { cellWidth: 124 },
        4: { cellWidth: 82 },
        5: { cellWidth: 104, fontStyle: "bold" },
        6: { cellWidth: 70, halign: "right", fontStyle: "bold" }
      },
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 5) return;
        const value = String(data.cell.raw ?? "");
        if (value === "Active") {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [22, 101, 52];
        } else if (value === "Paused") {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [146, 64, 14];
        } else {
          data.cell.styles.fillColor = [219, 234, 254];
          data.cell.styles.textColor = [29, 78, 216];
        }
      },
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(129, 118, 103);
        doc.text("Proteinbar clients report", 32, pageHeight - 24);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 72, pageHeight - 24);
      }
    });

    doc.save(`proteinbar-clients-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

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
          { label: "Clients With Orders", value: String(summary?.clientsWithOrders ?? 0) },
          { label: "Active Subscriptions", value: String(summary?.activeSubscriptions ?? summary?.activeClients ?? 0) },
          { label: "Total Revenue", value: formatMoney(summary?.totalRevenue ?? 0) }
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
            <option value="active">Active subscription</option>
            <option value="paused">Paused subscription</option>
            <option value="lead">Order-only / no active plan</option>
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
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
            {selectedVisibleClientKeys.length ? `${selectedVisibleClientKeys.length} selected` : "Select clients"}
          </span>
          <button
            type="button"
            onClick={editSelectedClient}
            disabled={selectedVisibleClientKeys.length !== 1}
            className="rounded-xl bg-blue-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit selected client
          </button>
          <button
            type="button"
            onClick={() => void exportPdf()}
            className="rounded-xl border border-blue-300/50 bg-blue-300/10 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-300/20"
          >
            Export PDF
          </button>
          {editMessage ? <p className="text-sm text-emerald-300">{editMessage}</p> : null}
          {editError && !editingClientKey ? <p className="text-sm text-rose-300">{editError}</p> : null}
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
              <th className="pb-2 pr-4 font-medium">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={!visibleClientKeys.length}
                  aria-label="Select all visible clients"
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                />
              </th>
              <th className="pb-2 pr-4 font-medium">Client</th>
              <th className="pb-2 pr-4 font-medium">Contact</th>
              <th className="pb-2 pr-4 font-medium">Location</th>
              <th className="pb-2 pr-4 font-medium">Plan</th>
              <th className="pb-2 pr-4 font-medium">Orders</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="py-3.5 pr-4">
                  <input
                    type="checkbox"
                    checked={selectedClientKeys.includes(client.key)}
                    aria-label={`Select ${client.fullName}`}
                    onChange={() => toggleClientSelection(client.key)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                  />
                </td>
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
                <td className="py-3.5 pr-4 text-zinc-300">{clientStatusLabel(client.status)}</td>
                <td className="py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClientKey(client.key)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-300 text-zinc-950 transition hover:bg-blue-200"
                      aria-label={`View ${client.fullName} history`}
                      title="View full history"
                    >
                      <EyeIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditClient(client)}
                      className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-100 transition hover:border-zinc-500"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!clients.length && !isLoading ? (
              <tr>
                <td className="py-3.5 text-zinc-400" colSpan={8}>
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

      {editingClientKey ? (
        <div className="fixed inset-0 z-[130]">
          <button
            type="button"
            aria-label="Close client editor"
            onClick={() => {
              setEditingClientKey("");
              setEditError("");
            }}
            className="absolute inset-0 bg-black/55"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-zinc-800 bg-zinc-950 shadow-[-24px_0_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Edit Client Info</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{editingClient?.fullName ?? "Client"}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingClientKey("");
                  setEditError("");
                }}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-500"
              >
                Close
              </button>
            </div>
            <form onSubmit={saveClientInfo} className="space-y-4 px-5 py-5">
              <p className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-100">
                Updates are applied to this client&apos;s linked meal prep orders and subscriptions.
              </p>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Email</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-blue-300"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Phone</span>
                <input
                  value={editForm.phone}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-blue-300"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Address</span>
                <textarea
                  value={editForm.address}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-blue-300"
                />
              </label>
              {editError ? <p className="text-sm text-rose-300">{editError}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdatingClient}
                  className="rounded-xl bg-blue-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-blue-200 disabled:opacity-60"
                >
                  {isUpdatingClient ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingClientKey("");
                    setEditError("");
                  }}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 transition hover:border-zinc-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

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
