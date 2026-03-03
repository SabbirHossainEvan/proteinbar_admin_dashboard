import Link from "next/link";

export default function OtpVerificationPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="admin-panel w-full max-w-md rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">OTP Verification</h1>
        <p className="mt-2 text-sm text-zinc-300">Enter the verification code sent to your email.</p>
        <form className="mt-6 space-y-3">
          <input
            type="text"
            placeholder="6-digit OTP"
            maxLength={6}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          <Link
            href="/admin/reset-password"
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200"
          >
            Verify OTP
          </Link>
        </form>
        <Link href="/admin/forgot-password" className="mt-4 inline-block text-xs text-zinc-300 hover:text-white">
          Resend OTP
        </Link>
      </div>
    </div>
  );
}
