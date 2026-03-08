"use client";

import { FormEvent, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetMonthlyPlanSettingsQuery, useUpdateMonthlyPlanSettingsMutation } from "@/redux/api/adminApi";
import type { MonthlyPlanGlobalSettings } from "@/redux/monthlyPlans/types";

const defaults: MonthlyPlanGlobalSettings = {
  id: "monthly-plan-settings",
  weeklyCycleCount: 4,
  maxActivePlansPerKind: 5,
  currencyCode: "USD",
  defaultVatPercent: 0,
  defaultSafetyBagFee: 0,
  enforceActivePlanVisibility: true,
  allowMixedDeliveryModes: false
};

export default function MonthlyPlanSettingsPage() {
  const { data, isLoading, isError } = useGetMonthlyPlanSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateMonthlyPlanSettingsMutation();
  const [draft, setDraft] = useState<MonthlyPlanGlobalSettings | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const form = useMemo(() => draft ?? data?.data ?? defaults, [draft, data]);

  const onChange = (patch: Partial<MonthlyPlanGlobalSettings>) => {
    setDraft({ ...form, ...patch });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaveMessage("");
    const payload = draft ?? form;
    await updateSettings(payload).unwrap();
    setDraft(null);
    setSaveMessage("Monthly plan settings saved.");
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Global Monthly Rules</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Monthly Plan Settings</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Global controls for pricing defaults, plan visibility, and flow policy across custom and pre-made routes.
        </p>
      </div>

      {isLoading ? <LoadingState label="Loading monthly settings..." /> : null}
      {isError ? <ErrorState label="Failed to load monthly settings." /> : null}

      {!isLoading ? (
        <section className="admin-panel rounded-2xl p-5">
          <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min={1}
              value={form.weeklyCycleCount}
              onChange={(event) => onChange({ weeklyCycleCount: Number(event.target.value) })}
              placeholder="Weekly cycle count"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <input
              type="number"
              min={1}
              value={form.maxActivePlansPerKind}
              onChange={(event) => onChange({ maxActivePlansPerKind: Number(event.target.value) })}
              placeholder="Max active plans per kind"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <input
              value={form.currencyCode}
              onChange={(event) => onChange({ currencyCode: event.target.value.toUpperCase() })}
              placeholder="Currency code"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.defaultVatPercent}
              onChange={(event) => onChange({ defaultVatPercent: Number(event.target.value) })}
              placeholder="Default VAT %"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.defaultSafetyBagFee}
              onChange={(event) => onChange({ defaultSafetyBagFee: Number(event.target.value) })}
              placeholder="Default safety bag fee"
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.enforceActivePlanVisibility}
                  onChange={(event) => onChange({ enforceActivePlanVisibility: event.target.checked })}
                  className="h-4 w-4 accent-amber-300"
                />
                Enforce active/inactive visibility in front-office
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.allowMixedDeliveryModes}
                  onChange={(event) => onChange({ allowMixedDeliveryModes: event.target.checked })}
                  className="h-4 w-4 accent-amber-300"
                />
                Allow mixed delivery modes within one plan cycle
              </label>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
              {saveMessage ? <p className="text-sm text-emerald-300">{saveMessage}</p> : null}
            </div>
          </form>
        </section>
      ) : null}
    </section>
  );
}
