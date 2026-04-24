"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import {
  useDeleteWebsiteMenuCategoryAdminMutation,
  useGetWebsiteMenuCategoriesAdminQuery,
  useUpsertWebsiteMenuCategoryAdminMutation
} from "@/redux/api/adminApi";
import type { WebsiteMenuCategoryRecord } from "@/redux/backoffice/types";

const initialForm: WebsiteMenuCategoryRecord = {
  id: "",
  name: "",
  slug: "",
  intro: "",
  badge: "",
  sortOrder: 1,
  visible: true,
  showInTopNav: true
};

export default function WebsiteMenuCategoriesPage() {
  const { data, isLoading, isError } = useGetWebsiteMenuCategoriesAdminQuery();
  const [upsertCategory, { isLoading: isSaving }] = useUpsertWebsiteMenuCategoryAdminMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteWebsiteMenuCategoryAdminMutation();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  const categories = useMemo(() => data?.data ?? [], [data]);

  const onSave = async () => {
    setMessage("");
    await upsertCategory(form).unwrap();
    setForm(initialForm);
    setMessage("Menu category saved.");
  };

  const startEdit = (category: WebsiteMenuCategoryRecord) => setForm(category);

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Website Pages</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Menu Categories</h2>
        <p className="mt-2 text-sm text-zinc-300">Control category copy and choose exactly which tabs appear in the public top navigation.</p>
      </div>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Category Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Slug</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Intro Copy</span>
            <textarea
              value={form.intro}
              onChange={(event) => setForm((current) => ({ ...current, intro: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Badge</span>
            <input
              value={form.badge ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, badge: event.target.value }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Sort Order</span>
            <input
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 1 }))}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(event) => setForm((current) => ({ ...current, visible: event.target.checked }))}
              className="mt-1 h-4 w-4 accent-amber-300"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-100">Visible on website</span>
              <span className="block text-xs text-zinc-400">Hide categories without deleting their configuration.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
            <input
              type="checkbox"
              checked={form.showInTopNav}
              onChange={(event) => setForm((current) => ({ ...current, showInTopNav: event.target.checked }))}
              className="mt-1 h-4 w-4 accent-amber-300"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-100">Show as top-nav tab</span>
              <span className="block text-xs text-zinc-400">This directly covers the tab show/hide control you asked for.</span>
            </span>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={isSaving}
            className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : form.id ? "Update Category" : "Create Category"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="rounded-xl border border-zinc-600 bg-zinc-900/70 px-4 py-2.5 text-sm text-zinc-100"
            >
              Cancel Edit
            </button>
          ) : null}
          {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
        </div>
      </section>

      {isLoading ? <LoadingState label="Loading website menu categories..." /> : null}
      {isError ? <ErrorState label="Failed to load website menu categories." /> : null}

      {!isLoading ? (
        <section className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <article key={category.id} className="admin-panel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{category.intro}</p>
                </div>
                {category.badge ? (
                  <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-semibold text-zinc-900">{category.badge}</span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
                <span className="rounded-full border border-zinc-600 px-2 py-1">sort: {category.sortOrder}</span>
                <span className="rounded-full border border-zinc-600 px-2 py-1">website: {category.visible ? "visible" : "hidden"}</span>
                <span className="rounded-full border border-zinc-600 px-2 py-1">top nav: {category.showInTopNav ? "shown" : "hidden"}</span>
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(category)}
                  className="rounded-lg bg-amber-300 px-3 py-1.5 text-xs font-semibold text-zinc-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteCategory(category.id)}
                  disabled={isDeleting}
                  className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!categories.length ? <EmptyState label="No website menu categories found." /> : null}
        </section>
      ) : null}
    </section>
  );
}
