import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="admin-panel w-full max-w-md rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-zinc-300">Set your new admin password.</p>
        <form className="mt-6 space-y-3">
          <input
            type="password"
            placeholder="New password"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <Link
            href="/admin/sign-in"
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Save Password
          </Link>
        </form>
      </div>
    </div>
  );
}
