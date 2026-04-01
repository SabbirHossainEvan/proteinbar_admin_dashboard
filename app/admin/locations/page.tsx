"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteMonthlyLocationAdminMutation,
  useGetMonthlyLocationsAdminQuery,
  useUpsertMonthlyLocationAdminMutation
} from "@/redux/api/adminApi";
import type { DeliveryOption, LocationRecord } from "@/redux/monthlyPlans/types";

const defaultSupportedOptions: DeliveryOption[] = ["daily-delivery", "daily-pickup", "weekly-delivery", "weekly-pickup"];

const initialForm = {
  id: "",
  name: "",
  type: "both" as LocationRecord["type"],
  address: "",
  image: "",
  phone: "",
  googleMapsUrl: "",
  ratingText: "",
  isActive: true,
  deliveryFee: 0,
  cutoffTime: "10:00",
  supportedOptions: [...defaultSupportedOptions] as DeliveryOption[]
};

export default function LocationsPage() {
  const { data, isLoading, isError } = useGetMonthlyLocationsAdminQuery();
  const [upsertLocation, { isLoading: isSaving }] = useUpsertMonthlyLocationAdminMutation();
  const [deleteLocation, { isLoading: isDeleting }] = useDeleteMonthlyLocationAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");

  const locations = data?.data ?? [];

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, image: result }));
    };
    reader.readAsDataURL(file);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setSubmitError("Name and address are required.");
      return;
    }
    setSubmitError("");
    const payload: LocationRecord = {
      id: form.id || `loc-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      image: form.image || undefined,
      phone: form.phone.trim() || undefined,
      googleMapsUrl: form.googleMapsUrl.trim() || undefined,
      ratingText: form.ratingText.trim() || undefined,
      isActive: form.isActive,
      deliveryFee: Number(form.deliveryFee),
      cutoffTime: form.cutoffTime,
      supportedOptions: form.supportedOptions.length ? form.supportedOptions : [...defaultSupportedOptions]
    };
    await upsertLocation(payload).unwrap();
    setForm(initialForm);
  };

  const startEdit = (item: LocationRecord) => {
    setForm({
      ...item,
      image: item.image ?? "",
      phone: item.phone ?? "",
      googleMapsUrl: item.googleMapsUrl ?? "",
      ratingText: item.ratingText ?? ""
    });
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
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="Phone number"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
          <input
            value={form.ratingText}
            onChange={(event) => setForm((prev) => ({ ...prev, ratingText: event.target.value }))}
            placeholder="Rating text"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
          <input
            value={form.googleMapsUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, googleMapsUrl: event.target.value }))}
            placeholder="Google Maps link"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300 md:col-span-2"
          />
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Location Image Upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-900"
            />
          </label>
          <div className="md:col-span-2">
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/35 p-3">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt={form.name || "Location preview"}
                  className="max-h-48 rounded-xl object-cover"
                />
              ) : (
                <p className="text-sm text-zinc-500">Uploaded location image preview will appear here.</p>
              )}
            </div>
          </div>
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
                <th className="pb-2 pr-4 font-medium">Image</th>
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
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <span className="text-zinc-500">No image</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{item.type}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {item.address}
                    {item.phone ? <p className="text-xs text-zinc-400">phone: {item.phone}</p> : null}
                    {item.googleMapsUrl ? (
                      <p className="text-xs text-zinc-400">
                        <a href={item.googleMapsUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                          Google Maps
                        </a>
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    fee: ${item.deliveryFee.toFixed(2)} | cutoff: {item.cutoffTime}
                    {item.ratingText ? <p className="text-xs text-zinc-400">{item.ratingText}</p> : null}
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
                  <td className="py-3.5 text-zinc-400" colSpan={6}>
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
