"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVerifyCodeMutation } from "@/redux/api/adminApi";

export default function OtpVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifyCode, { isLoading }] = useVerifyCodeMutation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const queryEmail = new URLSearchParams(window.location.search).get("email");
    if (queryEmail) {
      setEmail(queryEmail);
      return;
    }

    const stored = window.sessionStorage.getItem("proteinbar_admin_reset_email") ?? "";
    setEmail(stored);
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Missing email. Go back and request OTP first.");
      return;
    }

    if (code.length !== 6) {
      setError("OTP must be 6 digits.");
      return;
    }

    try {
      await verifyCode({ email, code }).unwrap();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("proteinbar_admin_reset_email", email);
      }
      router.push(`/admin/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Invalid or expired OTP.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="admin-panel w-full max-w-md rounded-2xl p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Proteinbar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">OTP Verification</h1>
        <p className="mt-2 text-sm text-zinc-300">Enter the verification code sent to your email.</p>
        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit OTP"
            maxLength={6}
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900/70 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300"
          />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <Link href="/admin/forgot-password" className="mt-4 inline-block text-xs text-zinc-300 hover:text-white">
          Resend OTP
        </Link>
      </div>
    </div>
  );
}
