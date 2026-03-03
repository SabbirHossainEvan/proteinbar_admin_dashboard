import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="admin-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute -left-24 top-16 h-60 w-60 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="admin-panel relative w-full max-w-md rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin Login</h1>
        <p className="mt-2 text-sm text-zinc-300">Frontend-only demo panel for proteinbar.vercel.app.</p>
        <Link
          href="/admin"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
        >
          Login as Demo Admin
        </Link>
      </div>
    </div>
  );
}
