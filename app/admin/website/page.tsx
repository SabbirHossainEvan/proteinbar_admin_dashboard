"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import { useGetWebsiteSettingsAdminQuery, useUpdateWebsiteSettingsAdminMutation } from "@/redux/api/adminApi";
import type { WebsiteSettingsRecord } from "@/redux/backoffice/types";

function WebsiteSettingsForm({ settings }: { settings: WebsiteSettingsRecord }) {
  const [updateSettings, { isLoading: isSaving }] = useUpdateWebsiteSettingsAdminMutation();
  const [form, setForm] = useState({
    siteName: settings.siteName,
    faviconUrl: settings.faviconUrl,
    defaultLanguage: settings.defaultLanguage,
    supportedLanguages: settings.supportedLanguages.join(", "),
    localeStrategy: settings.localeStrategy,
    defaultMetaTitle: settings.defaultMetaTitle,
    defaultMetaDescription: settings.defaultMetaDescription,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    contactAddress: settings.contactAddress,
    rtlEnabled: settings.rtlEnabled
  });
  const [message, setMessage] = useState("");

  const onSave = async () => {
    setMessage("");
    await updateSettings({
      siteName: form.siteName,
      faviconUrl: form.faviconUrl,
      defaultLanguage: form.defaultLanguage,
      supportedLanguages: form.supportedLanguages.split(",").map((item) => item.trim()).filter(Boolean),
      localeStrategy: form.localeStrategy,
      defaultMetaTitle: form.defaultMetaTitle,
      defaultMetaDescription: form.defaultMetaDescription,
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      contactAddress: form.contactAddress,
      rtlEnabled: form.rtlEnabled
    }).unwrap();
    setMessage("Website settings saved.");
  };

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Default Language", value: form.defaultLanguage || "-" },
          { label: "Languages", value: String(form.supportedLanguages.split(",").map((item) => item.trim()).filter(Boolean).length || 0) },
          { label: "RTL", value: form.rtlEnabled ? "Enabled" : "Disabled" },
          { label: "Favicon", value: form.faviconUrl || "-" }
        ].map((stat) => (
          <article key={stat.label} className="admin-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Site Name</span>
            <input value={form.siteName} onChange={(event) => setForm((current) => ({ ...current, siteName: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Favicon URL</span>
            <input value={form.faviconUrl} onChange={(event) => setForm((current) => ({ ...current, faviconUrl: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Language</span>
            <input value={form.defaultLanguage} onChange={(event) => setForm((current) => ({ ...current, defaultLanguage: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Supported Languages</span>
            <input value={form.supportedLanguages} onChange={(event) => setForm((current) => ({ ...current, supportedLanguages: event.target.value }))} placeholder="English, Arabic" className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Locale Strategy</span>
            <input value={form.localeStrategy} onChange={(event) => setForm((current) => ({ ...current, localeStrategy: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Meta Title</span>
            <input value={form.defaultMetaTitle} onChange={(event) => setForm((current) => ({ ...current, defaultMetaTitle: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Default Meta Description</span>
            <textarea value={form.defaultMetaDescription} onChange={(event) => setForm((current) => ({ ...current, defaultMetaDescription: event.target.value }))} rows={3} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Support Email</span>
            <input value={form.supportEmail} onChange={(event) => setForm((current) => ({ ...current, supportEmail: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Support Phone</span>
            <input value={form.supportPhone} onChange={(event) => setForm((current) => ({ ...current, supportPhone: event.target.value }))} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">Contact Address</span>
            <textarea value={form.contactAddress} onChange={(event) => setForm((current) => ({ ...current, contactAddress: event.target.value }))} rows={3} className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300" />
          </label>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3">
          <input type="checkbox" checked={form.rtlEnabled} onChange={(event) => setForm((current) => ({ ...current, rtlEnabled: event.target.checked }))} className="mt-1 h-4 w-4 accent-amber-300" />
          <span>
            <span className="block text-sm font-medium text-zinc-100">Enable RTL support</span>
            <span className="block text-xs text-zinc-400">Useful when your secondary language requires right-to-left layouts.</span>
          </span>
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => void onSave()} disabled={isSaving} className="rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60">
            {isSaving ? "Saving..." : "Save Website Settings"}
          </button>
          {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
        </div>
      </section>
    </>
  );
}

export default function WebsiteSettingsPage() {
  const { data, isLoading, isError } = useGetWebsiteSettingsAdminQuery();

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Settings</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Website</h2>
        <p className="mt-2 text-sm text-zinc-300">Manage favicon, languages, SEO defaults, and contact details from a single settings screen.</p>
      </div>

      {isLoading ? <LoadingState label="Loading website settings..." /> : null}
      {isError ? <ErrorState label="Failed to load website settings." /> : null}

      {data?.data ? <WebsiteSettingsForm key={data.data.id} settings={data.data} /> : null}
    </section>
  );
}
