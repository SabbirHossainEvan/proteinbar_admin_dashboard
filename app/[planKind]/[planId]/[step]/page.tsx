import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

const validPlanKinds = new Set(["custom", "normal"]);
const validPlanSteps = new Set(["set-plan", "select-meals", "selected-meals", "checkout"]);

function getStorefrontBaseUrl(host: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_STOREFRONT_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  if (host.startsWith("localhost:3001") || host.startsWith("127.0.0.1:3001")) {
    return "http://localhost:3000";
  }

  return "http://localhost:3000";
}

export default async function MealPlanFlowCompatibilityRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ planKind: string; planId: string; step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { planKind, planId, step } = await params;
  const query = await searchParams;

  if (!validPlanKinds.has(planKind) || !validPlanSteps.has(step) || !planId) {
    notFound();
  }

  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";
  const target = new URL(`/${planKind}/${planId}/${step}`, getStorefrontBaseUrl(host));

  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => target.searchParams.append(key, entry));
      return;
    }

    if (value !== undefined) {
      target.searchParams.set(key, value);
    }
  });

  redirect(target.toString());
}
