"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { adminNavSections } from "@/data/admin/navigation";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const isItemActive = (href: string) => (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      adminNavSections.map((section) => [
        section.title,
        section.items.some((item) => isItemActive(item.href)) || section.title === "Dashboard"
      ])
    )
  );

  const toggleSection = (title: string) => {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title]
    }));
  };

  return (
    <aside className="md:sticky md:top-0 md:h-screen md:w-84 md:flex-shrink-0 md:p-4">
      <div className="admin-panel border-b border-b-zinc-700/50 md:flex md:h-full md:flex-col md:overflow-hidden md:rounded-[28px] md:border-b-0">
        <div className="px-5 py-5 md:px-5 md:pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Control Center</h1>
          <p className="mt-2 text-sm text-zinc-400">Backoffice modules for catalog, ops, subscriptions, and printing.</p>
        </div>
        <div className="mx-5 h-px bg-zinc-700/60" />
        <div className="admin-scrollbar px-5 pb-5 pt-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
          <div className="space-y-3">
            {adminNavSections.map((section) => {
              const isOpen = openSections[section.title];
              const hasActiveChild = section.items.some((item) => isItemActive(item.href));

              return (
                <section
                  key={section.title}
                  className={`relative overflow-hidden rounded-2xl border transition ${
                    hasActiveChild
                      ? "border-amber-300/30 bg-[linear-gradient(180deg,rgba(255,191,71,0.11),rgba(24,24,27,0.58))] shadow-[0_0_0_1px_rgba(255,191,71,0.08),0_14px_30px_rgba(0,0,0,0.18)]"
                      : "border-zinc-700/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(10,14,20,0.34))] hover:border-zinc-600/70"
                  }`}
                >
                  {hasActiveChild ? (
                    <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-amber-300 shadow-[0_0_18px_rgba(255,191,71,0.55)]" aria-hidden="true" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                      hasActiveChild ? "bg-amber-300/8 text-amber-50" : "text-zinc-100 hover:bg-zinc-800/35"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${hasActiveChild ? "text-amber-50" : ""}`}>{section.title}</p>
                      <p className={`mt-1 text-xs ${hasActiveChild ? "text-amber-100/65" : "text-zinc-500"}`}>
                        {section.items.length} item{section.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${
                        hasActiveChild ? "border-amber-300/40 bg-amber-300/10 text-amber-200" : "border-zinc-600 bg-zinc-900/45 text-zinc-400"
                      }`}
                    >
                      <Chevron open={isOpen} />
                    </span>
                  </button>

                  {isOpen ? (
                    <nav className="space-y-2 border-t border-zinc-700/50 px-3 py-3">
                      {section.items.map((item) => {
                        const isActive = isItemActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? "border-amber-300/45 bg-amber-300/12 text-amber-100 shadow-[inset_0_0_0_1px_rgba(255,191,71,0.18)]"
                                : "border-transparent text-zinc-300 hover:border-zinc-600/60 hover:bg-zinc-800/35 hover:text-white"
                            }`}
                          >
                            <span className="block">{item.label}</span>
                            {item.description ? (
                              <span className="mt-1 block text-xs font-normal text-zinc-500">
                                {item.description}
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </nav>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
