"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { ErrorState } from "@/components/admin/StateBlocks";
import LocationsManager, { normalizeAdminLocation } from "@/components/admin/LocationsManager";
import {
  useGetLocationsQuery,
  useUpsertWebsitePageAdminMutation
} from "@/redux/api/adminApi";
import type {
  WebsitePageRecord,
  WebsitePageSection,
  WebsiteRepeaterItem
} from "@/redux/backoffice/types";
import type { LocationRecord } from "@/redux/monthlyPlans/types";

const createSection = (sortOrder: number): WebsitePageSection => ({
  id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  sectionKey: `section-${sortOrder + 1}`,
  sectionType: "richText",
  isVisible: true,
  sortOrder,
  heading: "",
  body: "",
  eyebrow: "",
  image: "",
  buttonLabel: "",
  buttonLink: "",
  items: []
});

const moveItem = <T,>(items: T[], from: number, to: number) => {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
};

const normalizeSortOrders = (sections: WebsitePageSection[]) =>
  sections.map((section, index) => ({ ...section, sortOrder: index }));

const duplicateSection = (section: WebsitePageSection, sortOrder: number): WebsitePageSection => ({
  ...section,
  id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  sectionKey: `${section.sectionKey || "section"}-${Math.random().toString(36).slice(2, 5)}`,
  heading: section.heading ? `${section.heading} Copy` : "",
  sortOrder,
  items: section.items.map((item) => ({
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }))
});

const locationsSectionKey = "dynamic-locations-list";

const toLocationRepeaterItem = (location: LocationRecord): WebsiteRepeaterItem => ({
  id: `location-item-${location.id}`,
  title: location.name,
  subtitle: `${location.type} ${location.isActive ? "| active" : "| inactive"}`,
  body: location.address,
  label: location.googleMapsUrl ? "Open map" : undefined,
  link: location.googleMapsUrl,
  value: location.ratingText || (location.phone ? `Phone: ${location.phone}` : ""),
  image: location.image
});

const ensureLocationsSection = (sections: WebsitePageSection[], locations: LocationRecord[]) => {
  const syncedItems = locations.map(toLocationRepeaterItem);
  const existingSection = sections.find((section) => section.sectionKey === locationsSectionKey);

  if (existingSection) {
    return sections.map((section) =>
      section.sectionKey === locationsSectionKey
        ? {
            ...section,
            sectionType: "dynamicEmbed",
            heading: section.heading || "Location Directory",
            body: section.body || "This section is synced automatically from the Locations admin screen.",
            items: syncedItems
          }
        : section
    );
  }

  return normalizeSortOrders([
    ...sections,
    {
      id: `section-${Date.now()}-locations`,
      sectionKey: locationsSectionKey,
      sectionType: "dynamicEmbed",
      isVisible: true,
      sortOrder: sections.length,
      heading: "Location Directory",
      body: "This section is synced automatically from the Locations admin screen.",
      eyebrow: "Synced data",
      image: "",
      buttonLabel: "",
      buttonLink: "",
      items: syncedItems
    }
  ]);
};

export default function WebsitePageEditor({ page }: { page: WebsitePageRecord }) {
  const [draft, setDraft] = useState<WebsitePageRecord>(page);
  const [saveMessage, setSaveMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [savePage, { isLoading: isSaving }] = useUpsertWebsitePageAdminMutation();
  const { data: locationsData } = useGetLocationsQuery(undefined, { skip: page.slug !== "locations" });
  const syncedLocations = useMemo(
    () => ((locationsData?.data ?? []) as Parameters<typeof normalizeAdminLocation>[0][]).map(normalizeAdminLocation),
    [locationsData]
  );
  const draftWithSyncedLocations = useMemo(
    () => (page.slug === "locations" ? { ...draft, sections: ensureLocationsSection(draft.sections, syncedLocations) } : draft),
    [draft, page.slug, syncedLocations]
  );

  const visibleSectionCount = useMemo(
    () => draftWithSyncedLocations.sections.filter((section) => section.isVisible).length,
    [draftWithSyncedLocations.sections]
  );

  const repeaterItemCount = useMemo(
    () => draftWithSyncedLocations.sections.reduce((count, section) => count + section.items.length, 0),
    [draftWithSyncedLocations.sections]
  );

  const updateDraft = (patch: Partial<WebsitePageRecord>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const setSections = (nextSections: WebsitePageSection[]) => {
    setDraft((current) => ({
      ...current,
      sections: normalizeSortOrders(nextSections)
    }));
  };

  const onAddSection = () => {
    const nextSection = createSection(draft.sections.length);
    setSections([...draft.sections, nextSection]);
  };

  const onDuplicateSection = (sectionId: string) => {
    const source = draft.sections.find((section) => section.id === sectionId);
    if (!source) return;
    const next = duplicateSection(source, draft.sections.length);
    setSections([...draft.sections, next]);
  };

  const onRemoveSection = (sectionId: string) => {
    const nextSections = draft.sections.filter((section) => section.id !== sectionId);
    setSections(nextSections);
  };

  const onMoveSection = (sectionId: string, direction: -1 | 1) => {
    const currentIndex = draft.sections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1) return;
    setSections(moveItem(draft.sections, currentIndex, currentIndex + direction));
  };

  const readImage = (
    event: ChangeEvent<HTMLInputElement>,
    onLoad: (result: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      onLoad(result);
    };
    reader.readAsDataURL(file);
  };

  const onSave = async () => {
    const nextErrors: string[] = [];

    if (!draft.title.trim()) nextErrors.push("Page title is required.");
    if (!draft.navLabel.trim()) nextErrors.push("Navigation label is required.");
    if (!draft.summary.trim()) nextErrors.push("Summary is required.");
    if (!draft.heroTitle.trim()) nextErrors.push("Hero title is required.");
    if (!draft.seoTitle.trim()) nextErrors.push("SEO title is required.");
    if (!draft.seoDescription.trim()) nextErrors.push("SEO description is required.");

    draftWithSyncedLocations.sections.forEach((section, index) => {
      if (!section.sectionKey.trim()) nextErrors.push(`Section ${index + 1} needs a section key.`);
      if (!section.heading.trim() && !section.body.trim() && !section.items.length) {
        nextErrors.push(`Section ${index + 1} needs content or repeater items.`);
      }
      section.items.forEach((item, itemIndex) => {
        if (!item.title.trim() && !item.body?.trim() && !item.value?.trim()) {
          nextErrors.push(`Section ${index + 1}, item ${itemIndex + 1} needs at least a title, value, or body.`);
        }
      });
    });

    if (nextErrors.length) {
      setErrors(nextErrors);
      setSaveMessage("");
      return;
    }

    try {
      const response = await savePage({
        ...draftWithSyncedLocations,
        sections: normalizeSortOrders(draftWithSyncedLocations.sections)
      }).unwrap();
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
          { label: "Visible Sections", value: String(visibleSectionCount) },
          { label: "Repeater Items", value: String(repeaterItemCount) }
        ].map((item) => (
          <article key={item.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="admin-panel rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Sections</h3>
              <p className="mt-1 text-xs text-zinc-400">Select, reorder, duplicate, or hide blocks.</p>
            </div>
            <button
              type="button"
              onClick={onAddSection}
              className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              Add
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {draftWithSyncedLocations.sections.map((section, index) => {
              return (
                <div
                  key={section.id}
                  className="w-full rounded-2xl border border-zinc-700/70 bg-zinc-900/40 p-3 text-left transition hover:border-zinc-600"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {section.heading.trim() || `Section ${index + 1}`}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                        section.isVisible ? "bg-emerald-500/15 text-emerald-200" : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {section.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{section.sectionType}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onMoveSection(section.id, -1)}
                      disabled={section.sectionKey === locationsSectionKey}
                      className="rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveSection(section.id, 1)}
                      disabled={section.sectionKey === locationsSectionKey}
                      className="rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
                    >
                      Down
                    </button>
                    {section.sectionKey !== locationsSectionKey ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onDuplicateSection(section.id)}
                          className="rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSection(section.id)}
                          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-100"
                        >
                          Remove
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="space-y-5">
          <section className="admin-panel rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white">Page Settings</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Page Title</span>
                <input
                  value={draft.title}
                  onChange={(event) => updateDraft({ title: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Navigation Label</span>
                <input
                  value={draft.navLabel}
                  onChange={(event) => updateDraft({ navLabel: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Slug</span>
                <input
                  value={draft.slug}
                  onChange={(event) => updateDraft({ slug: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Page Type</span>
                <select
                  value={draft.kind}
                  onChange={(event) => updateDraft({ kind: event.target.value as WebsitePageRecord["kind"] })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                >
                  <option value="system">System</option>
                  <option value="custom">Custom</option>
                  <option value="legal">Legal</option>
                </select>
              </label>
              <label className="space-y-1 lg:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Summary</span>
                <textarea
                  value={draft.summary}
                  onChange={(event) => updateDraft({ summary: event.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
            </div>
          </section>

          {page.slug === "locations" ? (
            <LocationsManager
              compactHeader
              heading="Location Management"
              description="Manage every location entity for the public locations page directly from here."
            />
          ) : null}

          {draft.kind === "legal" ? (
            <section className="admin-panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Legal Content</h3>
                  <p className="mt-1 text-sm text-zinc-300">
                    Terms & Conditions and Privacy Policy text blocks can be edited here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAddSection}
                  className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
                >
                  Add Clause
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {draftWithSyncedLocations.sections.map((section, index) => (
                  <article key={section.id} className="rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {section.heading.trim() || `Clause ${index + 1}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onMoveSection(section.id, -1)}
                          disabled={section.sectionKey === locationsSectionKey}
                          className="rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveSection(section.id, 1)}
                          disabled={section.sectionKey === locationsSectionKey}
                          className="rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
                        >
                          Down
                        </button>
                        {section.sectionKey !== locationsSectionKey ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onDuplicateSection(section.id)}
                              className="rounded-lg border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveSection(section.id)}
                              className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-100"
                            >
                              Remove
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Section Title</span>
                        <input
                          value={section.heading}
                          onChange={(event) =>
                            setSections(
                              draft.sections.map((currentSection) =>
                                currentSection.id === section.id
                                  ? { ...currentSection, heading: event.target.value }
                                  : currentSection
                              )
                            )
                          }
                          disabled={section.sectionKey === locationsSectionKey}
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Section Body</span>
                        <textarea
                          value={section.body}
                          onChange={(event) =>
                            setSections(
                              draft.sections.map((currentSection) =>
                                currentSection.id === section.id
                                  ? { ...currentSection, body: event.target.value }
                                  : currentSection
                              )
                            )
                          }
                          disabled={section.sectionKey === locationsSectionKey}
                          rows={5}
                          className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                        />
                      </label>
                    </div>
                  </article>
                ))}

                {!draftWithSyncedLocations.sections.length ? (
                  <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-5 text-sm text-zinc-400">
                    No legal clauses yet. Add the first clause from here.
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="admin-panel rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Hero Content</h3>
                <p className="mt-1 text-sm text-zinc-300">Control eyebrow, subtitle, CTAs, and hero imagery.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Eyebrow</span>
                <input
                  value={draft.heroEyebrow ?? ""}
                  onChange={(event) => updateDraft({ heroEyebrow: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Title</span>
                <input
                  value={draft.heroTitle}
                  onChange={(event) => updateDraft({ heroTitle: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1 lg:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Subtitle</span>
                <textarea
                  value={draft.heroSubtitle ?? ""}
                  onChange={(event) => updateDraft({ heroSubtitle: event.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1 lg:col-span-2">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Body</span>
                <textarea
                  value={draft.heroBody}
                  onChange={(event) => updateDraft({ heroBody: event.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Hero Image URL</span>
                <input
                  value={draft.heroImage ?? ""}
                  onChange={(event) => updateDraft({ heroImage: event.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Upload Hero Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => readImage(event, (result) => updateDraft({ heroImage: result }))}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-900"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Primary CTA Label</span>
                <input
                  value={draft.heroPrimaryCtaLabel ?? ""}
                  onChange={(event) => updateDraft({ heroPrimaryCtaLabel: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Primary CTA Link</span>
                <input
                  value={draft.heroPrimaryCtaLink ?? ""}
                  onChange={(event) => updateDraft({ heroPrimaryCtaLink: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Secondary CTA Label</span>
                <input
                  value={draft.heroSecondaryCtaLabel ?? ""}
                  onChange={(event) => updateDraft({ heroSecondaryCtaLabel: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Secondary CTA Link</span>
                <input
                  value={draft.heroSecondaryCtaLink ?? ""}
                  onChange={(event) => updateDraft({ heroSecondaryCtaLink: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
            </div>
          </section>

        </div>

        <aside className="space-y-5">
          <section className="admin-panel rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white">Publish</h3>
            <div className="mt-4 space-y-3">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Status</span>
                <select
                  value={draft.status}
                  onChange={(event) => updateDraft({ status: event.target.value as WebsitePageRecord["status"] })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
                <input
                  type="checkbox"
                  checked={draft.showInTopNav}
                  onChange={(event) => updateDraft({ showInTopNav: event.target.checked })}
                  className="mt-1 h-4 w-4 accent-amber-300"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">Show in top navigation</span>
                  <span className="block text-xs text-zinc-400">Turn page visibility on or off in the public header.</span>
                </span>
              </label>
            </div>
          </section>

          <section className="admin-panel rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white">SEO</h3>
            <div className="mt-4 space-y-3">
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">SEO Title</span>
                <input
                  value={draft.seoTitle}
                  onChange={(event) => updateDraft({ seoTitle: event.target.value })}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">SEO Description</span>
                <textarea
                  value={draft.seoDescription}
                  onChange={(event) => updateDraft({ seoDescription: event.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                />
              </label>
            </div>
          </section>

          <section className="admin-panel rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white">Preview</h3>
            <div className="mt-4 rounded-2xl border border-zinc-700/70 bg-zinc-900/45 p-4">
              {draft.heroEyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-amber-200">{draft.heroEyebrow}</p> : null}
              <h4 className="mt-2 text-xl font-semibold text-white">{draft.heroTitle}</h4>
              {draft.heroSubtitle ? <p className="mt-2 text-sm text-zinc-300">{draft.heroSubtitle}</p> : null}
              <p className="mt-3 text-sm text-zinc-400">{draft.heroBody}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {draft.heroPrimaryCtaLabel ? (
                  <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-zinc-900">
                    {draft.heroPrimaryCtaLabel}
                  </span>
                ) : null}
                {draft.heroSecondaryCtaLabel ? (
                  <span className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-200">
                    {draft.heroSecondaryCtaLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {draftWithSyncedLocations.sections
                  .filter((section) => section.isVisible)
                  .slice(0, 3)
                  .map((section) => (
                    <div key={section.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{section.sectionType}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{section.heading || section.sectionKey}</p>
                      <p className="mt-1 text-xs text-zinc-400">{section.body || "No body copy yet."}</p>
                      {section.items[0] ? (
                        <p className="mt-2 text-[11px] text-zinc-500">
                          First item: {section.items[0].title || section.items[0].value || "Untitled item"}
                        </p>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          </section>
        </aside>
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
        <p className="text-sm text-zinc-400">
          CMS blocks now support hero controls, repeaters, visibility toggles, duplication, and section ordering.
        </p>
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
