"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getAdminAuth } from "@/lib/adminAuth";
import { getVisibleAdminNavSections } from "@/lib/adminPermissions";

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
      <path
        d="M5 7.5L10 12.5L15 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIcon({ href }: { href: string }) {
  const iconPath = href.includes("orders")
    ? "M7 7h10M7 12h10M7 17h6M5 3h14a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z"
    : href.includes("meal")
      ? "M6 4h12M8 4v16M16 4v16M5 20h14M9 9h6M9 13h6"
      : href.includes("menu") || href.includes("products")
        ? "M4 6h16M4 12h16M4 18h10"
        : href.includes("customers") || href.includes("users")
          ? "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0"
          : href.includes("website") || href.includes("legal")
            ? "M4 5h16v14H4zM4 9h16M8 13h8M8 16h5"
            : href.includes("locations") || href.includes("restaurants")
              ? "M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
              : href.includes("profile") || href.includes("settings")
                ? "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5ZM19 21a7 7 0 0 0-14 0"
                : "M4 13h6V4H4v9ZM14 20h6V4h-6v16ZM4 20h6v-4H4v4Z";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d={iconPath} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const auth = useMemo(() => getAdminAuth(), []);
  const navSections = useMemo(
    () => getVisibleAdminNavSections(auth?.user),
    [auth],
  );
  const isItemActive = (href: string) =>
    href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        navSections.map((section) => [
          section.title,
          section.items.some((item) => isItemActive(item.href)) ||
            section.title === "Dashboard" ||
            section.title === "Mealprep Management",
        ]),
      ),
  );

  const toggleSection = (title: string) => {
    setOpenSections((current) => ({
      ...current,
      [title]: !current[title],
    }));
  };

  return (
    <aside className="md:sticky md:top-0 md:h-screen md:w-[312px] md:flex-shrink-0">
      <div className="flex h-full flex-col border-r border-[#dcdcdc] bg-[#fffbf5] text-[#4b4b4b] shadow-[10px_0_30px_rgba(0,0,0,0.08)]">
        <div className="pb-5 pt-6">
          <div className="flex h-[54px] items-center justi fy-center bg-black px-4 text-white shadow-[0_10px_18px_rgba(0,44,81,0.15)]">
            <div className="leading-none tracking-[0.08em]">
              <span className="text-[22px] font-black">PROTEIN</span>
              <span className="ml-1 text-[22px] font-light">BAR</span>
            </div>
          </div>
        </div>

        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-5">
          <div className="space-y-5">
            {navSections.map((section) => {
              const isOpen = openSections[section.title];
              const hasActiveChild = section.items.some((item) =>
                isItemActive(item.href),
              );

              return (
                <section key={section.title} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className={`flex w-full items-center justify-between rounded-2xl px-1 py-1 text-left transition ${
                      hasActiveChild ? "text-[#161616]" : "text-[#777]"
                    }`}
                  >
                    <span className="text-[14px] font-bold uppercase tracking-[0.16em]">
                      {section.title}
                    </span>
                    <span className="text-[#989898]">
                      <Chevron open={isOpen} />
                    </span>
                  </button>

                  {isOpen ? (
                    <nav className="space-y-1.5">
                      {section.items.map((item) => {
                        const isActive = isItemActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex h-12 w-full flex-1 items-center gap-3 rounded-lg px-[10px] py-3 text-sm font-semibold transition ${
                              isActive
                                ? "bg-[linear-gradient(268deg,#FD8700_-27.8%,#F5E486_26.43%,#F0B623_46.54%,#FD8700_98.94%)] text-white shadow-[0_8px_16px_rgba(0,0,0,0.18)]"
                                : "text-[#4b4b4b] hover:bg-[#f4eadc] hover:text-black"
                            }`}
                          >
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                                isActive
                                  ? "bg-white/15 text-white"
                                  : "bg-transparent text-[#4b4b4b] group-hover:bg-white"
                              }`}
                            >
                              <NavIcon href={item.href} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
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

        <div className="border-t border-[#dcdcdc] px-6 py-5">
          <Link
            href="/admin/sign-out"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#b42121] transition hover:bg-[#fff1ed]"
          >
            <span className="grid h-8 w-8 place-items-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M15 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M10 12h10M17 9l3 3-3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Log out
          </Link>
        </div>
      </div>
    </aside>
  );
}
