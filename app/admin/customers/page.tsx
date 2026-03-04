"use client";

import { FormEvent, useRef, useState } from "react";
import { locations as seedLocations, weekDays } from "@/data/admin/mock";

type LocationItem = (typeof seedLocations)[number];

const initialForm = {
  name: "",
  pickupAddress: "",
  mapLink: "",
  deliveryZone: "",
  deliveryFee: "",
  workingDays: [] as string[],
  cutoffTime: "",
  timeSlots: "",
};

function toggleDay(days: string[], day: string) {
  return days.includes(day) ? days.filter((item) => item !== day) : [...days, day];
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>(seedLocations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.pickupAddress.trim()) return;

    const payload: LocationItem = {
      id: editingId ?? `LOC-${Date.now()}`,
      name: form.name.trim(),
      pickupAddress: form.pickupAddress.trim(),
      mapLink: form.mapLink.trim(),
      deliveryZone: form.deliveryZone.trim() || "N/A",
      deliveryFee: form.deliveryFee.trim() || "$0.00",
      workingDays: form.workingDays,
      cutoffTime: form.cutoffTime.trim() || "-",
      timeSlots: form.timeSlots
        .split(",")
        .map((slot) => slot.trim())
        .filter(Boolean),
    };

    if (editingId) {
      setLocations((prev) => prev.map((location) => (location.id === editingId ? payload : location)));
      resetForm();
      return;
    }

    setLocations((prev) => [payload, ...prev]);
    resetForm();
  };

  const startEdit = (location: LocationItem) => {
    setEditingId(location.id);
    setForm({
      name: location.name,
      pickupAddress: location.pickupAddress,
      mapLink: location.mapLink,
      deliveryZone: location.deliveryZone,
      deliveryFee: location.deliveryFee,
      workingDays: location.workingDays,
      cutoffTime: location.cutoffTime,
      timeSlots: location.timeSlots.join(", "),
    });

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((location) => location.id !== id));
    if (editingId === id) resetForm();
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Pickup / Delivery Config</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Locations</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage pickup points, delivery zones, fees, working days, cutoff time, and service slots.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Location" : "Add Location"}</h3>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Pickup point name"
            required
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.deliveryZone}
            onChange={(event) => setForm((prev) => ({ ...prev, deliveryZone: event.target.value }))}
            placeholder="Delivery zone"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.pickupAddress}
            onChange={(event) => setForm((prev) => ({ ...prev, pickupAddress: event.target.value }))}
            placeholder="Pickup address"
            required
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="url"
            value={form.mapLink}
            onChange={(event) => setForm((prev) => ({ ...prev, mapLink: event.target.value }))}
            placeholder="Map link (optional)"
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="text"
            value={form.deliveryFee}
            onChange={(event) => setForm((prev) => ({ ...prev, deliveryFee: event.target.value }))}
            placeholder="Delivery fee"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="time"
            value={form.cutoffTime}
            onChange={(event) => setForm((prev) => ({ ...prev, cutoffTime: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
          <label className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-200 md:col-span-2">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">Working Days</span>
            <div className="grid grid-cols-4 gap-1.5">
              {weekDays.map((day) => (
                <label key={day} className="flex items-center gap-1 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.workingDays.includes(day)}
                    onChange={() => setForm((prev) => ({ ...prev, workingDays: toggleDay(prev.workingDays, day) }))}
                  />
                  {day}
                </label>
              ))}
            </div>
          </label>
          <input
            type="text"
            value={form.timeSlots}
            onChange={(event) => setForm((prev) => ({ ...prev, timeSlots: event.target.value }))}
            placeholder="Time slots (comma separated)"
            className="md:col-span-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200">
              {editingId ? "Update Location" : "Add Location"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-600 bg-zinc-800/70 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="admin-panel rounded-2xl p-4 md:p-5">
        <h3 className="text-lg font-semibold text-white">Location Configuration List</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Location</th>
                <th className="pb-2 pr-4 font-medium">Pickup Address</th>
                <th className="pb-2 pr-4 font-medium">Delivery</th>
                <th className="pb-2 pr-4 font-medium">Working Days</th>
                <th className="pb-2 pr-4 font-medium">Cutoff / Slots</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">
                    {location.name}
                    <p className="text-xs text-zinc-400">{location.id}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {location.pickupAddress}
                    <p className="text-xs text-zinc-400">{location.mapLink ? "Map link set" : "No map link"}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    {location.deliveryZone}
                    <p className="text-xs text-zinc-400">Fee: {location.deliveryFee}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{location.workingDays.join(", ") || "-"}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">
                    Cutoff: {location.cutoffTime}
                    <p className="text-xs text-zinc-400">{location.timeSlots.join(", ") || "No slot set"}</p>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(location)}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-400/20"
                      >
                        Delete
                      </button>
                    </div>
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
