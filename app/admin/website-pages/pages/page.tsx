"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteWebsitePageAdminMutation,
  useGetWebsitePagesAdminQuery,
  useUpsertWebsitePageAdminMutation
} from "@/redux/api/adminApi";
import type { WebsitePageRecord } from "@/redux/backoffice/types";

const createDraftPage = (kind: WebsitePageRecord["kind"]) => {
  const stamp = Date.now();
  const title = kind === "legal" ? "New Legal Page" : "New Page";

  return {
    id: `page-${stamp}`,
    slug: `page-${stamp}`,
    title,
    navLabel: title,
    summary: "Editable page summary",
    kind,
    status: "draft" as const,
    showInTopNav: false,
    heroEyebrow: "New page",
    heroTitle: title,
    heroSubtitle: "Add a supporting subtitle for the hero area.",
    heroBody: "Add hero copy for this page.",
    heroImage: "",
    heroPrimaryCtaLabel: "Primary CTA",
    heroPrimaryCtaLink: "",
    heroSecondaryCtaLabel: "Secondary CTA",
    heroSecondaryCtaLink: "",
    seoTitle: title,
    seoDescription: "SEO description",
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: `section-${stamp}`,
        sectionKey: "section-heading",
        sectionType: "richText",
        isVisible: true,
        sortOrder: 0,
        heading: "Section Heading",
        body: "Replace this placeholder with real content.",
        eyebrow: "",
        image: "",
        buttonLabel: "",
        buttonLink: "",
        items: []
      }
    ]
  };
};

export default function WebsitePagesPage() {
  const { data, isLoading, isError } = useGetWebsitePagesAdminQuery();
  const [upsertPage, { isLoading: isCreating }] = useUpsertWebsitePageAdminMutation();
  const [deletePage, { isLoading: isDeleting }] = useDeleteWebsitePageAdminMutation();
  const [createKind, setCreateKind] = useState<WebsitePageRecord["kind"]>("custom");
  const [feedback, setFeedback] = useState("");

  const pages = data?.data ?? [];

  const onCreate = async () => {
    setFeedback("");
    try {
      const response = await upsertPage(createDraftPage(createKind)).unwrap();
      setFeedback(`Created ${response.data.title}. Open it to finish the content.`);
    } catch {
      setFeedback("Failed to create page draft.");
    }
  };

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Website Pages</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Pages</h2>
        <p className="mt-2 text-sm text-zinc-300">Create and manage public pages, including custom landing pages and legal documents.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Page Type</span>
            <select
              value={createKind}
              onChange={(event) => setCreateKind(event.target.value as WebsitePageRecord["kind"])}
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            >
              <option value="custom">Custom Page</option>
              <option value="legal">Legal Page</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void onCreate()}
            disabled={isCreating}
            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create Draft Page"}
          </button>
          {feedback ? <p className="text-sm text-zinc-300">{feedback}</p> : null}
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading website pages..." /> : null}
      {isError ? <ErrorState label="Failed to load website pages." /> : null}

      {!isLoading ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <table className="admin-table min-w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-4 font-medium">Page</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Top Nav</th>
                <th className="pb-2 pr-4 font-medium">Updated</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td className="py-3.5 pr-4 text-zinc-100">
                    {page.title}
                    <p className="text-xs text-zinc-400">{page.summary}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-zinc-300">{page.kind}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{page.status}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{page.showInTopNav ? "Visible" : "Hidden"}</td>
                  <td className="py-3.5 pr-4 text-zinc-300">{new Date(page.updatedAt).toLocaleDateString("en-US")}</td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/website-pages/${page.slug}`}
                        className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-amber-200"
                      >
                        Edit
                      </Link>
                      {page.kind === "custom" || page.kind === "legal" ? (
                        <button
                          type="button"
                          onClick={() => void deletePage(page.id)}
                          disabled={isDeleting}
                          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!pages.length ? (
                <tr>
                  <td className="py-4" colSpan={6}>
                    <EmptyState label="No website pages found yet." />
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
