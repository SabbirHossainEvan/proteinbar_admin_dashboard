"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSendCodeMutation } from "@/redux/api/adminApi";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@proteinbar.com");
  const [error, setError] = useState("");
  const [sendCode, { isLoading }] = useSendCodeMutation();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your admin email.");
      return;
    }

    try {
      await sendCode({ email: normalizedEmail }).unwrap();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("proteinbar_admin_reset_email", normalizedEmail);
      }
      router.push(`/admin/otp-verification?email=${encodeURIComponent(normalizedEmail)}`);
    } catch {
      setError("Failed to send OTP. Please try again.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="admin-panel w-full max-w-md rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Forgot Password</h1>
        <p className="mt-2 text-sm text-zinc-300">Enter your email to receive OTP code.</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Admin email"
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
        <Link href="/admin/sign-in" className="mt-4 inline-block text-xs text-zinc-300 hover:text-white">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
