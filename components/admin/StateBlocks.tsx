export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4 text-sm text-zinc-300" role="status" aria-live="polite">
      {label}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4 text-sm text-zinc-400">{label}</div>;
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
      {label}
    </div>
  );
}
