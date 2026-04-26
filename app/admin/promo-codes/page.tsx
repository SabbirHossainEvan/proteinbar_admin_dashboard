"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useCreatePromoCodeAdminMutation,
  useDeletePromoCodeAdminMutation,
  useGetPromoCodesAdminQuery,
  useUpdatePromoCodeAdminMutation
} from "@/redux/api/adminApi";
import type { PromoCodeRecord } from "@/redux/backoffice/types";

type PromoFormState = Omit<PromoCodeRecord, "updatedAt">;

function createEmptyPromoCode(): PromoFormState {
  return {
    id: "",
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    maxDiscount: 100,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    appliesToMonthlyPlans: true,
    appliesToDirectOrders: false,
    stackable: false,
    showOnHomepage: false,
    eligibilityNote: ""
  };
}

export default function PromoCodesPage() {
  const { data, isLoading, isError } = useGetPromoCodesAdminQuery();
  const [createPromoCode, { isLoading: isCreating }] = useCreatePromoCodeAdminMutation();
  const [updatePromoCode, { isLoading: isUpdating }] = useUpdatePromoCodeAdminMutation();
  const [deletePromoCode, { isLoading: isDeleting }] = useDeletePromoCodeAdminMutation();
  const [form, setForm] = useState<PromoFormState>(createEmptyPromoCode());
  const [feedback, setFeedback] = useState("");
  const promoCodes = useMemo(() => data?.data ?? [], [data?.data]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      active: promoCodes.filter((code) => code.isActive && (!code.endDate || code.endDate >= today)).length,
      scheduled: promoCodes.filter((code) => code.startDate > today).length,
      expired: promoCodes.filter((code) => code.endDate && code.endDate < today).length,
      redeemed: promoCodes.reduce((sum, code) => sum + code.usedCount, 0)
    };
  }, [promoCodes]);

  const onSave = async () => {
    setFeedback("");
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      eligibilityNote: form.eligibilityNote.trim(),
      endDate: form.endDate.trim(),
      maxDiscount: form.maxDiscount === null ? null : Number(form.maxDiscount),
      usageLimit: form.usageLimit === null ? null : Number(form.usageLimit)
    };

    try {
      if (payload.id) {
        await updatePromoCode({
          id: payload.id,
          body: {
            code: payload.code,
            description: payload.description,
            discountType: payload.discountType,
            discountValue: Number(payload.discountValue),
            maxDiscount: payload.maxDiscount,
            startDate: payload.startDate,
            endDate: payload.endDate,
            usageLimit: payload.usageLimit,
            usedCount: Number(payload.usedCount),
            isActive: payload.isActive,
            appliesToMonthlyPlans: payload.appliesToMonthlyPlans,
            appliesToDirectOrders: payload.appliesToDirectOrders,
            stackable: payload.stackable,
            showOnHomepage: payload.showOnHomepage,
            eligibilityNote: payload.eligibilityNote
          }
        }).unwrap();
        setFeedback(`Updated ${payload.code}.`);
        return;
      }

      const response = await createPromoCode({
        ...payload,
        discountValue: Number(payload.discountValue),
        maxDiscount: payload.maxDiscount,
        usageLimit: payload.usageLimit,
        usedCount: Number(payload.usedCount)
      }).unwrap();
      setForm({
        ...response.data,
        updatedAt: undefined
      } as PromoFormState);
      setFeedback(`Created ${response.data.code}.`);
    } catch (error) {
      const message =
        error && typeof error === "object" && "data" in error
          ? String(
              (error as { data?: { message?: string } }).data?.message ??
                "Failed to save promo code.",
            )
          : "Failed to save promo code.";
      setFeedback(message);
    }
  };

  const onEdit = (promoCode: PromoCodeRecord) => {
    setForm({
      ...promoCode,
      updatedAt: undefined
    } as PromoFormState);
    setFeedback("");
  };

  const onCreateNew = () => {
    setForm(createEmptyPromoCode());
    setFeedback("");
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Promotions</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Promo Codes</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage gift codes, discount values, eligibility rules, and validity windows for checkout.</p>
      </div>

      {isLoading ? <LoadingState label="Loading promo codes..." /> : null}
      {isError ? <ErrorState label="Failed to load promo codes." /> : null}

      {!isLoading && !isError ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active Codes", value: String(stats.active) },
              { label: "Scheduled", value: String(stats.scheduled) },
              { label: "Expired", value: String(stats.expired) },
              { label: "Redeemed", value: String(stats.redeemed) }
            ].map((stat) => (
              <article key={stat.label} className="admin-panel rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_420px]">
            <section className="admin-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{form.id ? "Edit Promo Code" : "Create Promo Code"}</h3>
                  <p className="mt-1 text-sm text-zinc-300">Set the code, discount rule, date window, and where it can be used.</p>
                </div>
                <button
                  type="button"
                  onClick={onCreateNew}
                  className="rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900/40"
                >
                  New Code
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Code</span>
                  <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Discount Type</span>
                  <select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as PromoCodeRecord["discountType"] }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300">
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Discount Value</span>
                  <input type="number" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: Number(event.target.value) }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Max Discount</span>
                  <input type="number" value={form.maxDiscount ?? ""} onChange={(event) => setForm((current) => ({ ...current, maxDiscount: event.target.value ? Number(event.target.value) : null }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Start Date</span>
                  <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">End Date</span>
                  <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Usage Limit</span>
                  <input type="number" value={form.usageLimit ?? ""} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value ? Number(event.target.value) : null }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Used Count</span>
                  <input type="number" value={form.usedCount} onChange={(event) => setForm((current) => ({ ...current, usedCount: Number(event.target.value) }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Description</span>
                  <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Eligibility Note</span>
                  <textarea value={form.eligibilityNote} onChange={(event) => setForm((current) => ({ ...current, eligibilityNote: event.target.value }))} rows={4} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
                </label>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  { key: "isActive", label: "Code is active", hint: "Toggle whether checkout can use this code." },
                  { key: "appliesToMonthlyPlans", label: "Apply to monthly plans", hint: "Enable in meal plan checkout." },
                  { key: "appliesToDirectOrders", label: "Apply to direct orders", hint: "Reserve for storefront/cart checkout." },
                  { key: "stackable", label: "Stack with other discounts", hint: "Keep for future combined promo logic." },
                  { key: "showOnHomepage", label: "Show on homepage", hint: "Mark as a public-facing promotion." }
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(form[toggle.key as keyof PromoFormState])}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [toggle.key]: event.target.checked
                        }))
                      }
                      className="mt-1 h-4 w-4 accent-amber-300"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-100">{toggle.label}</span>
                      <span className="block text-xs text-zinc-400">{toggle.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={() => void onSave()} disabled={isCreating || isUpdating} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
                  {isCreating || isUpdating ? "Saving..." : form.id ? "Update Code" : "Create Code"}
                </button>
                {feedback ? <p className="text-sm text-zinc-300">{feedback}</p> : null}
              </div>
            </section>

            <section className="admin-panel rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white">Existing Codes</h3>
              <p className="mt-1 text-sm text-zinc-300">Edit a code, inspect its usage, or remove it if it is no longer needed.</p>
              <div className="mt-4 space-y-3">
                {promoCodes.map((promoCode) => (
                  <article key={promoCode.id} className="rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{promoCode.code}</p>
                        <p className="mt-1 text-sm text-zinc-300">{promoCode.description || "No description yet."}</p>
                        <p className="mt-2 text-xs text-zinc-500">
                          {promoCode.discountType === "percent" ? `${promoCode.discountValue}% off` : `${promoCode.discountValue} MAD off`}
                          {promoCode.maxDiscount !== null ? ` • Max ${promoCode.maxDiscount} MAD` : ""}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Uses: {promoCode.usedCount} / {promoCode.usageLimit ?? "unlimited"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${promoCode.isActive ? "bg-emerald-500/15 text-emerald-200" : "bg-zinc-800 text-zinc-400"}`}>
                        {promoCode.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onEdit(promoCode)} className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-amber-200">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setFeedback("");
                          try {
                            await deletePromoCode(promoCode.id).unwrap();
                            if (form.id === promoCode.id) {
                              setForm(createEmptyPromoCode());
                            }
                            setFeedback(`Deleted ${promoCode.code}.`);
                          } catch (error) {
                            const message =
                              error && typeof error === "object" && "data" in error
                                ? String(
                                    (error as { data?: { message?: string } }).data?.message ??
                                      "Failed to delete promo code.",
                                  )
                                : "Failed to delete promo code.";
                            setFeedback(message);
                          }
                        }}
                        disabled={isDeleting}
                        className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {!promoCodes.length ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-5 text-sm text-zinc-400">
                    No promo codes yet. Create the first code from the form.
                  </div>
                ) : null}
              </div>
            </section>
          </section>
        </>
      ) : null}
    </section>
  );
}
