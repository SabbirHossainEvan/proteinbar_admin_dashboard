"use client";

import { useMemo, useState } from "react";

type Stat = {
  label: string;
  value: string;
};

type EditorField = {
  label: string;
  value: string;
  type?: "text" | "textarea";
};

type EditorSection = {
  title: string;
  description: string;
  fields: EditorField[];
};

type ToggleItem = {
  label: string;
  hint: string;
  enabled: boolean;
};

type TableData = {
  title: string;
  columns: string[];
  rows: string[][];
};

export default function AdminEditablePage({
  eyebrow,
  title,
  description,
  stats,
  sections,
  toggles,
  table,
  note
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats?: Stat[];
  sections?: EditorSection[];
  toggles?: ToggleItem[];
  table?: TableData;
  note?: string;
}) {
  const [editorSections, setEditorSections] = useState(sections ?? []);
  const [visibilityItems, setVisibilityItems] = useState(toggles ?? []);
  const [savedAt, setSavedAt] = useState("");

  const toggleEnabledCount = useMemo(
    () => visibilityItems.filter((item) => item.enabled).length,
    [visibilityItems]
  );

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-zinc-300">{description}</p>
      </div>

      {stats?.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="admin-panel rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </article>
          ))}
        </section>
      ) : null}

      {editorSections.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {editorSections.map((section, sectionIndex) => (
            <article key={section.title} className="admin-panel rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  <p className="mt-1 text-sm text-zinc-300">{section.description}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {section.fields.map((field, fieldIndex) => (
                  <label key={field.label} className="block space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        value={field.value}
                        rows={4}
                        onChange={(event) =>
                          setEditorSections((current) =>
                            current.map((item, currentSectionIndex) =>
                              currentSectionIndex === sectionIndex
                                ? {
                                    ...item,
                                    fields: item.fields.map((currentField, currentFieldIndex) =>
                                      currentFieldIndex === fieldIndex
                                        ? { ...currentField, value: event.target.value }
                                        : currentField
                                    )
                                  }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(event) =>
                          setEditorSections((current) =>
                            current.map((item, currentSectionIndex) =>
                              currentSectionIndex === sectionIndex
                                ? {
                                    ...item,
                                    fields: item.fields.map((currentField, currentFieldIndex) =>
                                      currentFieldIndex === fieldIndex
                                        ? { ...currentField, value: event.target.value }
                                        : currentField
                                    )
                                  }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
                      />
                    )}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {visibilityItems.length ? (
        <section className="admin-panel rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Visibility Controls</h3>
              <p className="mt-1 text-sm text-zinc-300">
                Enabled items: <span className="text-amber-200">{toggleEnabledCount}</span> / {visibilityItems.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSavedAt(new Date().toLocaleString("en-US"))}
              className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
            >
              Save Changes
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibilityItems.map((item, index) => (
              <label
                key={item.label}
                className="flex items-start gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/55 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) =>
                    setVisibilityItems((current) =>
                      current.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, enabled: event.target.checked }
                          : currentItem
                      )
                    )
                  }
                  className="mt-1 h-4 w-4 accent-amber-300"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-100">{item.label}</span>
                  <span className="block text-xs text-zinc-400">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>

          {savedAt ? <p className="mt-4 text-xs text-zinc-400">Local mock save updated at {savedAt}.</p> : null}
        </section>
      ) : null}

      {table ? (
        <section className="admin-panel overflow-x-auto rounded-2xl p-4 md:p-5">
          <h3 className="text-lg font-semibold text-white">{table.title}</h3>
          <table className="admin-table mt-4 min-w-full text-left text-sm">
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column} className="pb-2 pr-4 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={`${table.title}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${table.title}-${rowIndex}-${cellIndex}`} className="py-3.5 pr-4 text-zinc-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {note ? (
        <section className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">
          {note}
        </section>
      ) : null}
    </section>
  );
}
