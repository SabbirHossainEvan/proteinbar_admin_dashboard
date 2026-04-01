"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteMonthlyPlanAdminMutation,
  useGetMonthlyPlanAdminListQuery,
  useUpsertMonthlyPlanDetailsMutation
} from "@/redux/api/adminApi";
import type { MonthlyPlan, PlanKind } from "@/redux/monthlyPlans/types";

const defaultImage = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200";

const createNewPlanDraft = (kind: PlanKind) => {
  const id = `plan-${Date.now()}`;
  const ruleId = `rule-${id}`;
  const pricingId = `pricing-${id}`;

  return {
    plan: {
      id,
      slug: `${kind}-${Date.now()}`,
      title: kind === "custom" ? "New Custom Plan" : "New Pre-made Plan",
      description: "Plan description",
      image: defaultImage,
      badge: kind === "custom" ? "Custom" : "Pre-made",
      status: "draft" as const,
      planKind: kind,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ruleConfigId: ruleId,
      pricingConfigId: pricingId,
      content: {
        heroTitle: "Hero title",
        heroSubtitle: "Hero subtitle",
        selectMealsText: "Select meals content",
        checkoutText: "Checkout content",
        ...(kind === "custom"
          ? {
              customStepTwo: {
                categories: [],
                foodItems: []
              }
            }
          : {})
      },
      weekAssignmentIds: []
    },
    rules: {
      id: ruleId,
      planId: id,
      allowedMealsPerDay: [1, 2, 3],
      allowedDays: [3, 4, 5],
      allowedSnacks: [0, 1],
      planTypeOptions: kind === "custom" ? ["lose-weight", "gain-weight"] : [],
      deliveryDaysRule: {
        min: 2,
        max: 6,
        allowedWeekDays: [0, 1, 2, 3, 4, 5, 6]
      },
      defaults: {
        meals: 3,
        days: 5,
        snacks: 0,
        planType: kind === "custom" ? "lose-weight" : undefined,
        deliveryDays: [1, 3, 5]
      },
      deliveryOptionConfigs: [
        { option: "daily-delivery" as const, enabled: true, label: "Daily Delivery", serviceFee: 0, minDays: 2, maxDays: 7 },
        { option: "daily-pickup" as const, enabled: true, label: "Daily Pickup", serviceFee: 0, minDays: 2, maxDays: 7 },
        { option: "weekly-delivery" as const, enabled: true, label: "Weekly Delivery", serviceFee: 0, minDays: 2, maxDays: 7 },
        { option: "weekly-pickup" as const, enabled: true, label: "Weekly Pickup", serviceFee: 0, minDays: 2, maxDays: 7 }
      ]
    },
    pricing: {
      id: pricingId,
      planId: id,
      basePriceFormula: {
        baseFee: 100,
        pricePerMeal: 5,
        dayMultiplier: 1
      },
      snacksAddonPrice: 2,
      vatPercent: 15,
      safetyBagFee: 2,
      giftCodeRule: {
        type: "percent" as const,
        value: 10,
        maxDiscount: 20,
        enabled: true
      }
    },
    weekAssignments: []
  };
};

export default function MonthlyPlansPage() {
  const [filters, setFilters] = useState<{ kind: PlanKind | "all"; status: MonthlyPlan["status"] | "all"; search: string }>({
    kind: "all",
    status: "all",
    search: ""
  });
  const [quickCreateKind, setQuickCreateKind] = useState<PlanKind>("custom");
  const [createError, setCreateError] = useState("");

  const { data, isLoading, isError } = useGetMonthlyPlanAdminListQuery(filters);
  const { data: allPlansData } = useGetMonthlyPlanAdminListQuery();
  const [deletePlan, { isLoading: isDeleting }] = useDeleteMonthlyPlanAdminMutation();
  const [upsertPlanDetails, { isLoading: isCreating }] = useUpsertMonthlyPlanDetailsMutation();

  const plans = useMemo(() => data?.data ?? [], [data]);
  const allPlans = useMemo(() => allPlansData?.data ?? [], [allPlansData]);
  const hasCustomPlan = useMemo(() => allPlans.some((item) => item.planKind === "custom"), [allPlans]);
  const selectedQuickCreateKind = hasCustomPlan && quickCreateKind === "custom" ? "normal" : quickCreateKind;

  const summary = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((item) => item.status === "active").length,
      custom: plans.filter((item) => item.planKind === "custom").length,
      normal: plans.filter((item) => item.planKind === "normal").length
    }),
    [plans]
  );

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError("");
    if (selectedQuickCreateKind === "custom" && hasCustomPlan) {
      setCreateError("Only one custom plan can exist. Delete the current custom plan to create a new one.");
      return;
    }
    try {
      await upsertPlanDetails(createNewPlanDraft(selectedQuickCreateKind)).unwrap();
    } catch {
      setCreateError("Failed to create plan draft.");
    }
  };

  const onDelete = async (id: string) => {
    setCreateError("");
    try {
      await deletePlan(id).unwrap();
    } catch {
      setCreateError("Failed to delete plan.");
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Monthly Plan Catalog</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Monthly Plans</h2>
        <p className="mt-2 text-sm text-zinc-300">List, filter, create draft, edit plan details, and delete plans.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Visible Plans", value: summary.active },
          { title: "Total Plans", value: summary.total },
          { title: "Custom Flow", value: summary.custom },
          { title: "Pre-made Flow", value: summary.normal }
        ].map((item) => (
          <article key={item.title} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{item.title}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search by title or description"
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300 md:col-span-2"
          />
          <select
            value={filters.kind}
            onChange={(event) => setFilters((prev) => ({ ...prev, kind: event.target.value as PlanKind | "all" }))}
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All kinds</option>
            <option value="custom">Custom</option>
            <option value="normal">Pre-made</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, status: event.target.value as MonthlyPlan["status"] | "all" }))
            }
            className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
          >
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">Quick Create</h3>
        {hasCustomPlan ? (
          <p className="mt-2 text-sm text-zinc-400">Custom plan already exists. You can still create multiple pre-made plans.</p>
        ) : null}
        <form onSubmit={onCreate} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Plan kind</span>
            <select
              value={selectedQuickCreateKind}
              onChange={(event) => setQuickCreateKind(event.target.value as PlanKind)}
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="custom" disabled={hasCustomPlan}>
                Custom
              </option>
              <option value="normal">Pre-made</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={isCreating || (selectedQuickCreateKind === "custom" && hasCustomPlan)}
            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create Draft"}
          </button>
          {createError ? <p className="text-sm text-rose-300">{createError}</p> : null}
        </form>
      </section>

      {isLoading ? <LoadingState label="Loading monthly plans..." /> : null}
      {isError ? <ErrorState label="Failed to load monthly plans." /> : null}

      {!isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="admin-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{plan.planKind}</p>
              <h3 className="mt-1 text-xl font-semibold text-white">{plan.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{plan.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">status: {plan.status}</span>
                <span className="rounded-full border border-zinc-600 px-2 py-1 text-zinc-200">slug: {plan.slug}</span>
                {plan.badge ? <span className="rounded-full bg-amber-300 px-2 py-1 font-semibold text-zinc-900">{plan.badge}</span> : null}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Link
                  href={`/admin/monthly-plans/${plan.id}`}
                  className="rounded-xl bg-amber-300 px-3.5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
                >
                  Edit Details
                </Link>
                <button
                  type="button"
                  onClick={() => void onDelete(plan.id)}
                  disabled={isDeleting}
                  className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {!plans.length ? (
            <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4 text-sm text-zinc-400">
              No plans match these filters.
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
