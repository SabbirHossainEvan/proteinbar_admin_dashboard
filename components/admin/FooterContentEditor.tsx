"use client";

import type {
  WebsitePageRecord,
  WebsitePageSection,
  WebsiteRepeaterItem,
} from "@/redux/backoffice/types";

const contactSectionKey = "contact-details";
const linksSectionKey = "footer-links";

type FooterContentEditorProps = {
  draft: WebsitePageRecord;
  onUpdatePage: (patch: Partial<WebsitePageRecord>) => void;
  onUpdateSections: (sections: WebsitePageSection[]) => void;
};

function createItem(prefix: string): WebsiteRepeaterItem {
  return {
    id: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "",
    label: "",
    value: "",
    link: "",
  };
}

export default function FooterContentEditor({
  draft,
  onUpdatePage,
  onUpdateSections,
}: FooterContentEditorProps) {
  const contactSection = draft.sections.find(
    (section) => section.sectionKey === contactSectionKey,
  );
  const linksSection = draft.sections.find(
    (section) => section.sectionKey === linksSectionKey,
  );

  const updateSection = (
    sectionKey: string,
    update: (section: WebsitePageSection) => WebsitePageSection,
  ) => {
    onUpdateSections(
      draft.sections.map((section) =>
        section.sectionKey === sectionKey ? update(section) : section,
      ),
    );
  };

  const updateItem = (
    sectionKey: string,
    itemId: string,
    patch: Partial<WebsiteRepeaterItem>,
  ) => {
    updateSection(sectionKey, (section) => ({
      ...section,
      items: section.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const addItem = (sectionKey: string, prefix: string) => {
    updateSection(sectionKey, (section) => ({
      ...section,
      items: [...section.items, createItem(prefix)],
    }));
  };

  const removeItem = (sectionKey: string, itemId: string) => {
    updateSection(sectionKey, (section) => ({
      ...section,
      items: section.items.filter((item) => item.id !== itemId),
    }));
  };

  return (
    <section className="admin-panel rounded-2xl p-5">
      <div>
        <h3 className="text-lg font-semibold text-white">Footer Content</h3>
        <p className="mt-1 text-sm text-zinc-300">
          Changes apply to the global footer on every customer-facing page.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            Brand Name
          </span>
          <input
            value={draft.heroTitle}
            onChange={(event) => onUpdatePage({ heroTitle: event.target.value })}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            Tagline
          </span>
          <input
            value={draft.heroSubtitle ?? ""}
            onChange={(event) =>
              onUpdatePage({ heroSubtitle: event.target.value })
            }
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
        </label>
        <label className="space-y-1 lg:col-span-2">
          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            Supporting Text
          </span>
          <textarea
            value={draft.heroBody ?? ""}
            onChange={(event) => onUpdatePage({ heroBody: event.target.value })}
            rows={3}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-300"
          />
        </label>
      </div>

      {contactSection ? (
        <div className="mt-7 border-t border-zinc-700/70 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white">Contact Details</h4>
              <p className="mt-1 text-xs text-zinc-400">
                Use links such as tel:+212... or mailto:name@example.com.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={contactSection.isVisible}
                  onChange={(event) =>
                    updateSection(contactSectionKey, (section) => ({
                      ...section,
                      isVisible: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-amber-300"
                />
                Visible
              </label>
              <button
                type="button"
                onClick={() => addItem(contactSectionKey, "footer-contact")}
                className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-semibold text-zinc-900"
              >
                Add Contact
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {contactSection.items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-zinc-700/70 bg-zinc-900/45 p-4"
              >
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <label className="min-w-0 space-y-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                      Prefix
                    </span>
                    <input
                      value={item.label ?? ""}
                      onChange={(event) =>
                        updateItem(contactSectionKey, item.id, {
                          label: event.target.value,
                        })
                      }
                      placeholder="T: or E:"
                      className="w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="min-w-0 space-y-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                      Name
                    </span>
                    <input
                      value={item.title}
                      onChange={(event) =>
                        updateItem(contactSectionKey, item.id, {
                          title: event.target.value,
                        })
                      }
                      placeholder="Bourgogne or Email"
                      className="w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="min-w-0 space-y-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                      Displayed Value
                    </span>
                    <input
                      value={item.value ?? ""}
                      onChange={(event) =>
                        updateItem(contactSectionKey, item.id, {
                          value: event.target.value,
                        })
                      }
                      placeholder="Phone number or email"
                      className="w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                  <label className="min-w-0 space-y-1">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">
                      Link Destination
                    </span>
                    <input
                      value={item.link ?? ""}
                      onChange={(event) =>
                        updateItem(contactSectionKey, item.id, {
                          link: event.target.value,
                        })
                      }
                      placeholder="tel:, mailto:, or https://"
                      className="w-full min-w-0 rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(contactSectionKey, item.id)}
                  className="mt-3 w-full rounded-lg border border-rose-400/40 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/10 sm:w-auto"
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {linksSection ? (
        <div className="mt-7 border-t border-zinc-700/70 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white">Footer Links</h4>
              <p className="mt-1 text-xs text-zinc-400">
                Manage legal and informational links displayed below the cards.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={linksSection.isVisible}
                  onChange={(event) =>
                    updateSection(linksSectionKey, (section) => ({
                      ...section,
                      isVisible: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-amber-300"
                />
                Visible
              </label>
              <button
                type="button"
                onClick={() => addItem(linksSectionKey, "footer-link")}
                className="rounded-lg bg-amber-300 px-3 py-2 text-xs font-semibold text-zinc-900"
              >
                Add Link
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {linksSection.items.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 rounded-xl border border-zinc-700/70 bg-zinc-900/45 p-4 lg:grid-cols-[1fr_1.5fr_auto]"
              >
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateItem(linksSectionKey, item.id, {
                      title: event.target.value,
                    })
                  }
                  placeholder="Link label"
                  className="rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                />
                <input
                  value={item.link ?? ""}
                  onChange={(event) =>
                    updateItem(linksSectionKey, item.id, {
                      link: event.target.value,
                    })
                  }
                  placeholder="/page or https://..."
                  className="rounded-lg border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => removeItem(linksSectionKey, item.id)}
                  className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs text-rose-200"
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
