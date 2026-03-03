"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Image from "next/image";
import StatusBadge from "@/components/admin/StatusBadge";
import { monthlyPlanFlow, monthlyPlans } from "@/data/admin/mock";

type PlanItem = (typeof monthlyPlans)[number] & { imageUrl?: string };

export default function MonthlyPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>(monthlyPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    members: "",
    description: "",
    isNew: false,
    imageUrl: "",
  });

  const resetForm = () => {
    setForm({
      name: "",
      basePrice: "",
      members: "",
      description: "",
      isNew: false,
      imageUrl: "",
    });
    setEditingId(null);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.basePrice.trim()) {
      return;
    }

    if (editingId) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === editingId
            ? {
                ...plan,
                name: form.name.trim(),
                basePrice: form.basePrice.trim(),
                members: Number(form.members) || 0,
                description: form.description.trim() || "No description added yet.",
                isNew: form.isNew,
                imageUrl: form.imageUrl || undefined,
              }
            : plan,
        ),
      );
      resetForm();
      return;
    }

    const newPlan: PlanItem = {
      id: `PLAN-${Date.now()}`,
      name: form.name.trim(),
      basePrice: form.basePrice.trim(),
      members: Number(form.members) || 0,
      description: form.description.trim() || "No description added yet.",
      status: "Active",
      isNew: form.isNew,
      imageUrl: form.imageUrl || undefined,
    };

    setPlans((prev) => [newPlan, ...prev]);
    resetForm();
  };

  const startEditPlan = (plan: PlanItem) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      basePrice: plan.basePrice,
      members: String(plan.members),
      description: plan.description ?? "",
      isNew: Boolean(plan.isNew),
      imageUrl: plan.imageUrl ?? "",
    });

    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 120);
  };

  const deletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    if (editingId === planId) {
      resetForm();
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Subscriptions</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Monthly Plans</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage the same monthly plan layout and offer flow used on the website page.</p>
      </div>

      <section ref={formSectionRef} className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">{editingId ? "Edit Monthly Plan" : "Add Monthly Plan"}</h3>
        <p className="mt-2 text-sm text-zinc-300">Create, image upload, edit, and delete plan cards (frontend-only).</p>
        <form onSubmit={handleSubmitPlan} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Plan name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="text"
            placeholder="Price (e.g. $209/mo)"
            value={form.basePrice}
            onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            required
          />
          <input
            type="number"
            placeholder="Active members"
            value={form.members}
            onChange={(event) => setForm((prev) => ({ ...prev, members: event.target.value }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
            min={0}
          />
          <label className="flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={form.isNew}
              onChange={(event) => setForm((prev) => ({ ...prev, isNew: event.target.checked }))}
              className="h-4 w-4 accent-amber-300"
            />
            Mark as NEW plan
          </label>
          <div className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-200">
            <label htmlFor="plan-image" className="mb-2 block text-xs uppercase tracking-[0.12em] text-zinc-400">
              Upload Plan Image
            </label>
            <input id="plan-image" type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:font-semibold file:text-zinc-900" />
          </div>
          <textarea
            placeholder="Plan description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="md:col-span-2 min-h-24 rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {form.imageUrl ? (
            <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-700">
              <Image src={form.imageUrl} alt="Plan preview" width={1200} height={300} className="h-36 w-full object-cover" unoptimized />
            </div>
          ) : null}
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              {editingId ? "Update Plan" : "Add Plan"}
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

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">How Your Monthly Plan Works</h3>
        <p className="mt-2 text-sm text-zinc-300">Keep this onboarding flow aligned with the customer-facing monthly plan page.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {monthlyPlanFlow.map((item) => (
            <article key={item.step} className="rounded-xl border border-zinc-700/70 bg-zinc-900/70 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-amber-200">{item.step}</p>
              <p className="mt-2 text-sm font-medium text-zinc-100">{item.title}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="admin-panel rounded-2xl p-5">
            {plan.imageUrl ? (
              <Image
                src={plan.imageUrl}
                alt={`${plan.name} plan`}
                width={1000}
                height={240}
                className="mb-4 h-28 w-full rounded-xl object-cover"
                unoptimized
              />
            ) : (
              <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-zinc-700/70 via-zinc-800/70 to-zinc-900/70" />
            )}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="flex items-center gap-2">
                {plan.isNew ? <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-zinc-900">NEW</span> : null}
                <StatusBadge label={plan.status} />
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-300">{plan.description}</p>
            <p className="mt-4 text-2xl font-semibold text-zinc-100">{plan.basePrice}</p>
            <p className="mt-1 text-sm text-zinc-400">{plan.members} active members</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => startEditPlan(plan)}
                className="rounded-xl bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
              >
                Edit Plan
              </button>
              <button
                onClick={() => deletePlan(plan.id)}
                className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3.5 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
