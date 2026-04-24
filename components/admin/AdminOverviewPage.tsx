"use client";

import Link from "next/link";

type Stat = {
  label: string;
  value: string;
};

type LinkCard = {
  href: string;
  title: string;
  description: string;
};

export default function AdminOverviewPage({
  eyebrow,
  title,
  description,
  stats,
  cards,
  note
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats?: Stat[];
  cards: LinkCard[];
  note?: string;
}) {
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="admin-panel rounded-2xl p-5 transition hover:border-amber-300/45"
          >
            <h3 className="text-lg font-semibold text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-zinc-300">{card.description}</p>
          </Link>
        ))}
      </section>

      {note ? (
        <section className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">
          {note}
        </section>
      ) : null}
    </section>
  );
}
