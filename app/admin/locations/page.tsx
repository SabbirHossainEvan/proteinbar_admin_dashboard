"use client";

import { FormEvent, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteMonthlyLocationAdminMutation,
  useGetMonthlyLocationsAdminQuery,
  useUpsertMonthlyLocationAdminMutation
} from "@/redux/api/adminApi";
import type { DeliveryOption, LocationRecord } from "@/redux/monthlyPlans/types";

const options: DeliveryOption[] = ["daily-delivery", "daily-pickup", "weekly-delivery", "weekly-pickup"];

const initialForm = {
  id: "",
  name: "",
  type: "both" as LocationRecord["type"],
  address: "",
  isActive: true,
  deliveryFee: 0,
  cutoffTime: "10:00",
  supportedOptions: [...options] as DeliveryOption[]
};

export default function LocationsPage() {
  const { data, isLoading, isError } = useGetMonthlyLocationsAdminQuery();
  const [upsertLocation, { isLoading: isSaving }] = useUpsertMonthlyLocationAdminMutation();
  const [deleteLocation, { isLoading: isDeleting }] = useDeleteMonthlyLocationAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");

  const locations = data?.data ?? [];

  const toggleOption = (option: DeliveryOption) => {
    setForm((prev) => {
      const exists = prev.supportedOptions.includes(option);
      return {
        ...prev,
        supportedOptions: exists ? prev.supportedOptions.filter((item) => item !== option) : [...prev.supportedOptions, option]
      };
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setSubmitError("Name and address are required.");
      return;
    }
    if (!form.supportedOptions.length) {
      setSubmitError("Select at least one supported delivery option.");
      return;
    }
    setSubmitError("");
    const payload: LocationRecord = {
      id: form.id || `loc-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      isActive: form.isActive,
      deliveryFee: Number(form.deliveryFee),
      cutoffTime: form.cutoffTime,
      supportedOptions: form.supportedOptions
    };
    await upsertLocation(payload).unwrap();
    setForm(initialForm);
  };

  const startEdit = (item: LocationRecord) => {
    setForm(item);
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Pickup & Delivery</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Locations</h2>
        <p className="mt-2 text-sm text-zinc-300">Configure pickup/delivery locations used in monthly checkout flow.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Location name"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as LocationRecord["type"] }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="both">both</option>
            <option value="pickup">pickup</option>
            <option value="delivery">delivery</option>
          </select>
          <input
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            placeholder="Address"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 md:col-span-2"
          />
          <input
            type="number"
            min={0}
            value={form.deliveryFee}
            onChange={(event) => setForm((prev) => ({ ...prev, deliveryFee: Number(event.target.value) }))}
            placeholder="Delivery fee"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
          <input
            type="time"
            value={form.cutoffTime}
            onChange={(event) => setForm((prev) => ({ ...prev, cutoffTime: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
          <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="h-4 w-4 accent-amber-300"
            />
            Active location
          </label>
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 p-3 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Supported options</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    form.supportedOptions.includes(option) ? "bg-amber-300 text-zinc-900" : "border border-zinc-600 text-zinc-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {submitError ? <p className="text-sm text-rose-300 md:col-span-2">{submitError}</p> : null}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : form.id ? "Update Location" : "Add Location"}
            </button>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm text-zinc-100"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {isLoading ? <LoadingState label="Loading locations..." /> : null}
      {isError ? <ErrorState label="Failed to load locations." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Address</th>
                <th className="pb-2 pr-4 font-medium">Config</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((item) => (
                <tr key={item.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">{item.name}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.type}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.address}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    fee: ${item.deliveryFee.toFixed(2)} | cutoff: {item.cutoffTime}
                    <p className="text-xs text-zinc-400">{item.supportedOptions.join(", ")}</p>
                  </td>
                  <td className="py-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteLocation(item.id)}
                        disabled={isDeleting}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!locations.length ? (
                <tr>
                  <td className="py-3.5 text-zinc-400" colSpan={5}>
                    No locations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      ) : null}
    </section>
  );
}
