type StatusBadgeProps = {
  label: string;
};

const statusClassMap: Record<string, string> = {
  Pending: "border-amber-300/50 bg-amber-300/12 text-amber-100",
  Processing: "border-cyan-300/50 bg-cyan-300/12 text-cyan-100",
  Shipped: "border-blue-300/50 bg-blue-300/12 text-blue-100",
  Delivered: "border-emerald-300/50 bg-emerald-300/12 text-emerald-100",
  Active: "border-emerald-300/50 bg-emerald-300/12 text-emerald-100",
  Trial: "border-sky-300/50 bg-sky-300/12 text-sky-100",
  Paused: "border-orange-300/50 bg-orange-300/12 text-orange-100",
  Cancelled: "border-rose-300/50 bg-rose-300/12 text-rose-100",
};

export default function StatusBadge({ label }: StatusBadgeProps) {
  const classes = statusClassMap[label] ?? "border-zinc-400/45 bg-zinc-400/10 text-zinc-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${classes}`}>
      {label}
    </span>
  );
}
