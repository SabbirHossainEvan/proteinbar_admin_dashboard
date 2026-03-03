import Link from "next/link";

export default function AdminSignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute -left-24 top-16 h-60 w-60 rounded-full bg-amber-300/15 blur-3xl" />
      <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="admin-panel relative w-full max-w-md rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sign In</h1>
        <p className="mt-2 text-sm text-zinc-300">Frontend-only authentication flow for the admin dashboard.</p>

        <form className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Admin email"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <Link
            href="/admin"
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Sign In
          </Link>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-300">
          <Link href="/admin/forgot-password" className="hover:text-white">
            Forgot Password?
          </Link>
          <Link href="/admin/otp-verification" className="hover:text-white">
            OTP Verification
          </Link>
        </div>
      </div>
    </div>
  );
}
