"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useGetWebsitePagesAdminQuery,
  useUpsertWebsitePageAdminMutation
} from "@/redux/api/adminApi";
import type { WebsitePageRecord } from "@/redux/backoffice/types";

const headerPageOrder = ["home", "locations", "menu", "about-us", "contact"] as const;

const pageLabels: Record<(typeof headerPageOrder)[number], string> = {
  home: "Home",
  locations: "Locations",
  menu: "Menu",
  "about-us": "About Us",
  contact: "Contact"
};

type EditableNavPage = WebsitePageRecord & {
  originalNavLabel: string;
  originalShowInTopNav: boolean;
};

type NavEdits = Record<
  string,
  {
    navLabel: string;
    showInTopNav: boolean;
  }
>;

export default function HeaderNavigationPage() {
  const { data, isLoading, isError } = useGetWebsitePagesAdminQuery();
  const [upsertPage, { isLoading: isSaving }] = useUpsertWebsitePageAdminMutation();
  const [edits, setEdits] = useState<NavEdits>({});
  const [feedback, setFeedback] = useState("");

  const sourcePages = useMemo(() => data?.data ?? [], [data?.data]);

  const pages = useMemo(
    () =>
      headerPageOrder
      .map((slug) => sourcePages.find((page) => page.slug === slug))
      .filter((page): page is WebsitePageRecord => Boolean(page))
      .map((page) => ({
        ...page,
        navLabel: edits[page.slug]?.navLabel ?? page.navLabel,
        showInTopNav: edits[page.slug]?.showInTopNav ?? page.showInTopNav,
        originalNavLabel: page.navLabel,
        originalShowInTopNav: page.showInTopNav
      })),
    [edits, sourcePages]
  );

  const visibleCount = useMemo(
    () => pages.filter((page) => page.showInTopNav).length,
    [pages]
  );

  const hasChanges = useMemo(
    () =>
      pages.some(
        (page) =>
          page.navLabel !== page.originalNavLabel ||
          page.showInTopNav !== page.originalShowInTopNav
      ),
    [pages]
  );

  const missingPages = useMemo(
    () =>
      headerPageOrder.filter(
        (slug) => !sourcePages.some((page) => page.slug === slug)
      ),
    [sourcePages]
  );

  const updatePage = (
    slug: string,
    patch: Partial<Pick<EditableNavPage, "navLabel" | "showInTopNav">>
  ) => {
    const source = sourcePages.find((page) => page.slug === slug);
    if (!source) return;

    setEdits((current) => ({
      ...current,
      [slug]: {
        navLabel: patch.navLabel ?? current[slug]?.navLabel ?? source.navLabel,
        showInTopNav:
          patch.showInTopNav ?? current[slug]?.showInTopNav ?? source.showInTopNav
      }
    }));
  };

  const onSave = async () => {
    setFeedback("");

    const changedPages = pages.filter(
      (page) =>
        page.navLabel !== page.originalNavLabel ||
        page.showInTopNav !== page.originalShowInTopNav
    );

    if (!changedPages.length) {
      setFeedback("No navigation changes to save.");
      return;
    }

    await Promise.all(
      changedPages.map((page) =>
        upsertPage({
          ...page,
          navLabel: page.navLabel.trim() || page.title
        }).unwrap()
      )
    );

    setEdits({});
    setFeedback("Header navigation saved.");
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Website Pages</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Header Navigation</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-300">
          Control which items appear in the website header and rename them without editing each page one by one.
        </p>
      </div>

      {isLoading ? <LoadingState label="Loading header navigation..." /> : null}
      {isError ? <ErrorState label="Failed to load header navigation." /> : null}

      {!isLoading && !isError ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tracked Items", value: String(pages.length) },
              { label: "Visible In Header", value: String(visibleCount) },
              { label: "Hidden Items", value: String(Math.max(pages.length - visibleCount, 0)) },
              { label: "Unsaved Changes", value: hasChanges ? "Yes" : "No" }
            ].map((stat) => (
              <article key={stat.label} className="admin-panel rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_380px]">
            <section className="admin-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Navigation Items</h3>
                  <p className="mt-1 text-sm text-zinc-300">
                    Each card maps directly to one header item on the customer site.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onSave()}
                  disabled={isSaving || !hasChanges}
                  className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Header Nav"}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {pages.map((page) => (
                  <article
                    key={page.slug}
                    className="rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">
                          {pageLabels[page.slug as keyof typeof pageLabels] ?? page.title}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                          Route: {page.slug === "home" ? "/" : `/pages/${page.slug}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                          page.showInTopNav
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {page.showInTopNav ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Navigation Label</span>
                        <input
                          value={page.navLabel}
                          onChange={(event) =>
                            updatePage(page.slug, { navLabel: event.target.value })
                          }
                          placeholder={page.title}
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                      </label>

                      <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={page.showInTopNav}
                          onChange={(event) =>
                            updatePage(page.slug, { showInTopNav: event.target.checked })
                          }
                          className="mt-1 h-4 w-4 accent-amber-300"
                        />
                        <span>
                          <span className="block text-sm font-medium text-zinc-100">
                            Show in header
                          </span>
                          <span className="block text-xs text-zinc-400">
                            Turn this page on or off in the customer top navigation.
                          </span>
                        </span>
                      </label>
                    </div>
                  </article>
                ))}
              </div>

              {feedback ? <p className="mt-4 text-sm text-zinc-300">{feedback}</p> : null}
              {missingPages.length ? (
                <p className="mt-3 text-sm text-amber-200">
                  Missing CMS page records: {missingPages.join(", ")}.
                </p>
              ) : null}
            </section>

            <aside className="space-y-5">
              <section className="admin-panel rounded-2xl p-5">
                <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                <p className="mt-1 text-sm text-zinc-300">
                  Preview the header sequence exactly as it will appear after save.
                </p>

                <div className="mt-4 rounded-[28px] border border-zinc-700/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(10,14,20,0.34))] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.2)]">
                  <div className="flex flex-wrap items-center gap-2">
                    {pages
                      .filter((page) => page.showInTopNav)
                      .map((page) => (
                        <span
                          key={page.slug}
                          className={`rounded-full px-3 py-1.5 text-sm ${
                            page.slug === "menu"
                              ? "border border-amber-300/35 bg-amber-300/10 text-amber-100"
                              : "border border-zinc-700 bg-zinc-900/70 text-zinc-100"
                          }`}
                        >
                          {page.navLabel.trim() || page.title}
                        </span>
                      ))}
                  </div>

                  {!pages.some((page) => page.showInTopNav) ? (
                    <p className="mt-3 text-sm text-zinc-400">No header items are visible right now.</p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">
                Menu still opens the location selector in the header. This screen only changes its label and visibility.
              </section>
            </aside>
          </section>
        </>
      ) : null}
    </section>
  );
}
