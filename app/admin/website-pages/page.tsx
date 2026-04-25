"use client";

import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetWebsitePagesAdminQuery,
  useGetWebsiteSettingsAdminQuery
} from "@/redux/api/adminApi";

export default function WebsitePagesOverviewPage() {
  const { data: pagesData, isLoading: isLoadingPages, isError: isPagesError } = useGetWebsitePagesAdminQuery();
  const { data: settingsData, isLoading: isLoadingSettings } = useGetWebsiteSettingsAdminQuery();

  const pages = pagesData?.data ?? [];
  const settings = settingsData?.data;

  const isLoading = isLoadingPages || isLoadingSettings;
  const visibleTopNavCount = pages.filter((page) => page.showInTopNav).length;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Website Pages</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Content Control Center</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300">
          Edit homepage, menu, locations, meal prep, global navigation, legal pages, and top-navigation visibility from one place.
        </p>
      </div>

      {isPagesError ? <ErrorState label="Failed to load website content." /> : null}
      {isLoading ? <LoadingState label="Loading website content modules..." /> : null}

      {!isLoading ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Pages", value: String(pages.length) },
              { label: "Published Pages", value: String(pages.filter((page) => page.status === "published").length) },
              { label: "Visible Nav Tabs", value: String(visibleTopNavCount) },
              { label: "Default Language", value: settings?.defaultLanguage ?? "-" }
            ].map((stat) => (
              <article key={stat.label} className="admin-panel rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="admin-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Quick Access</h3>
                  <p className="mt-1 text-sm text-zinc-300">Jump into the page groups you asked for and keep the website fully editable.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { href: "/admin/website-pages/pages", title: "Pages", text: "Create custom pages, legal pages, and manage publish state." },
                  { href: "/admin/website-pages/home", title: "Home", text: "Edit homepage text, hero image, and supporting content blocks." },
                  { href: "/admin/website-pages/menu", title: "Menu", text: "Manage hero, helper copy, and CTA content around live menu data." },
                  { href: "/admin/website-pages/locations", title: "Locations", text: "Control locations-page hero and notes while location entities stay dynamic." },
                  { href: "/admin/website-pages/meal-prep", title: "Meal Prep", text: "Manage hero, FAQ, and conversion copy around the plan builder." },
                  { href: "/admin/website-pages/about-us", title: "About Us", text: "Update brand story, proof points, and trust-building content." },
                  { href: "/admin/website-pages/contact", title: "Contact", text: "Manage contact copy, CTA language, and support blocks." }
                ].map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="rounded-2xl border border-zinc-700/70 bg-zinc-900/55 p-4 transition hover:border-amber-300/45 hover:bg-zinc-900/70"
                  >
                    <h4 className="text-base font-semibold text-white">{card.title}</h4>
                    <p className="mt-2 text-sm text-zinc-300">{card.text}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="admin-panel rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-white">Live Snapshot</h3>
              <div className="mt-4 space-y-3">
                {[...pages]
                  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                  .slice(0, 5)
                  .map((page) => (
                    <div key={page.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/45 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{page.title}</p>
                        <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
                          {page.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{page.summary}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Top nav: {page.showInTopNav ? "Visible" : "Hidden"} • Updated {new Date(page.updatedAt).toLocaleDateString("en-US")}
                      </p>
                    </div>
                  ))}
              </div>
            </section>
          </section>
        </>
      ) : null}
    </section>
  );
}
