"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavSections } from "@/data/admin/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="md:w-72 md:p-5">
      <div className="admin-panel md:sticky md:top-5 overflow-hidden border-b border-b-zinc-700/50 md:rounded-2xl md:border-b-0">
        <div className="px-5 py-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Control Center</h1>
          <p className="mt-2 text-sm text-zinc-400">Backoffice modules for catalog, ops, subscriptions, and printing.</p>
        </div>
        <div className="mx-5 h-px bg-zinc-700/60" />
        <div className="px-5 pb-5 pt-4">
          <div className="space-y-5">
            {adminNavSections.map((section) => (
              <div key={section.title}>
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{section.title}</p>
                <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-x-visible md:pb-0">
                  {section.items.map((item) => {
                    const isActive = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "border-amber-300/45 bg-amber-300/12 text-amber-100 shadow-[inset_0_0_0_1px_rgba(255,191,71,0.18)]"
                            : "border-transparent text-zinc-300 hover:border-zinc-600/70 hover:bg-zinc-800/45 hover:text-white"
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
