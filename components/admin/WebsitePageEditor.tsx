"use client";

import { useMemo, useState } from "react";
import { ErrorState } from "@/components/admin/StateBlocks";
import type { WebsitePageRecord } from "@/redux/backoffice/types";
import { useUpsertWebsitePageAdminMutation } from "@/redux/api/adminApi";

const emptySection = () => ({
  id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  heading: "",
  body: "",
  image: ""
});

export default function WebsitePageEditor({ page }: { page: WebsitePageRecord }) {
  const [draft, setDraft] = useState<WebsitePageRecord>(page);
  const [saveMessage, setSaveMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [savePage, { isLoading: isSaving }] = useUpsertWebsitePageAdminMutation();

  const visibleSectionCount = useMemo(
    () => draft.sections.filter((section) => section.heading.trim() || section.body.trim()).length,
    [draft.sections]
  );

  const updateSection = (sectionId: string, patch: Partial<WebsitePageRecord["sections"][number]>) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section))
    }));
  };

  const removeSection = (sectionId: string) => {
    setDraft((current) => ({
      ...current,
      sections: current.sections.filter((section) => section.id !== sectionId)
    }));
  };

  const onSave = async () => {
    const nextErrors: string[] = [];
    if (!draft.title.trim()) nextErrors.push("Page title is required.");
    if (!draft.navLabel.trim()) nextErrors.push("Navigation label is required.");
    if (!draft.summary.trim()) nextErrors.push("Summary is required.");
    if (!draft.heroTitle.trim()) nextErrors.push("Hero title is required.");
    if (!draft.seoTitle.trim()) nextErrors.push("SEO title is required.");
    if (!draft.seoDescription.trim()) nextErrors.push("SEO description is required.");
    if (nextErrors.length) {
      setErrors(nextErrors);
      setSaveMessage("");
      return;
    }

    try {
      const response = await savePage(draft).unwrap();
      setDraft(response.data);
      setErrors([]);
      setSaveMessage("Page saved successfully.");
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to save page."]);
      setSaveMessage("");
    }
  };

  return (
    <section className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Page Type", value: draft.kind },
          { label: "Status", value: draft.status },
          { label: "Top Nav", value: draft.showInTopNav ? "Visible" : "Hidden" },
          { label: "Content Blocks", value: String(visibleSectionCount) }
        ].map((item) => (
          <article key={item.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Page Title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Navigation Label</span>
            <input
              value={draft.navLabel}
              onChange={(event) => setDraft((current) => ({ ...current, navLabel: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Slug</span>
            <input
              value={draft.slug}
              onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Status</span>
              <select
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as WebsitePageRecord["status"] }))}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Type</span>
              <select
                value={draft.kind}
                onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as WebsitePageRecord["kind"] }))}
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
              >
                <option value="system">System</option>
                <option value="custom">Custom</option>
                <option value="legal">Legal</option>
              </select>
            </label>
          </div>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Page Summary</span>
            <textarea
              value={draft.summary}
              onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
            <input
              type="checkbox"
              checked={draft.showInTopNav}
              onChange={(event) => setDraft((current) => ({ ...current, showInTopNav: event.target.checked }))}
              className="mt-1 h-4 w-4 accent-amber-300"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-100">Show in top navigation</span>
              <span className="block text-xs text-zinc-400">Use this to show or hide the page from the public site header.</span>
            </span>
          </label>
        </div>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Hero Content</h3>
            <p className="mt-1 text-sm text-zinc-300">Editable copy and imagery for the top of the page.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Title</span>
            <input
              value={draft.heroTitle}
              onChange={(event) => setDraft((current) => ({ ...current, heroTitle: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Image URL</span>
            <input
              value={draft.heroImage ?? ""}
              onChange={(event) => setDraft((current) => ({ ...current, heroImage: event.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Body</span>
            <textarea
              value={draft.heroBody}
              onChange={(event) => setDraft((current) => ({ ...current, heroBody: event.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
        </div>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Content Sections</h3>
            <p className="mt-1 text-sm text-zinc-300">Add flexible blocks for homepage, about, contact, restaurants, or legal content.</p>
          </div>
          <button
            type="button"
            onClick={() => setDraft((current) => ({ ...current, sections: [...current.sections, emptySection()] }))}
            className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Add Section
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {draft.sections.map((section, index) => (
            <article key={section.id} className="rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Section {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Heading</span>
                  <input
                    value={section.heading}
                    onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                    className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Image URL</span>
                  <input
                    value={section.image ?? ""}
                    onChange={(event) => updateSection(section.id, { image: event.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
                <label className="space-y-1 lg:col-span-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Body Copy</span>
                  <textarea
                    value={section.body}
                    onChange={(event) => updateSection(section.id, { body: event.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white">SEO</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">SEO Title</span>
            <input
              value={draft.seoTitle}
              onChange={(event) => setDraft((current) => ({ ...current, seoTitle: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">SEO Description</span>
            <textarea
              value={draft.seoDescription}
              onChange={(event) => setDraft((current) => ({ ...current, seoDescription: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
        </div>
      </section>

      {errors.length ? (
        <div className="space-y-2">
          {errors.map((error) => (
            <ErrorState key={error} label={error} />
          ))}
        </div>
      ) : null}
      {saveMessage ? <p className="text-sm text-emerald-300">{saveMessage}</p> : null}

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/75 px-4 py-3 backdrop-blur">
        <p className="text-sm text-zinc-400">Edits here are ready for backoffice-driven page management and top-nav visibility control.</p>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={isSaving}
          className="rounded-xl bg-amber-300 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Page"}
        </button>
      </div>
    </section>
  );
}
