"use client";

import { ErrorState, LoadingState } from "@/components/admin/StateBlocks";
import WebsitePageEditor from "@/components/admin/WebsitePageEditor";
import { useGetWebsitePageAdminQuery } from "@/redux/api/adminApi";

export default function LegalPageManager({
  slug,
  eyebrow
}: {
  slug: string;
  eyebrow: string;
}) {
  const { data, isLoading, isError } = useGetWebsitePageAdminQuery(slug);
  const page = data?.data;

  if (isLoading) return <LoadingState label="Loading legal page..." />;
  if (isError || !page) return <ErrorState label="Legal page not found." />;

  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">{page.title}</h2>
        <p className="mt-2 text-sm text-zinc-300">{page.summary}</p>
      </div>
      <WebsitePageEditor key={`${page.id}-${page.updatedAt}`} page={page} />
    </section>
  );
}
