"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send reset link.");
      }

      setMsg(
        "If an account exists for that email, we’ve sent a password reset link."
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset link.";
      setMsg(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-[url('/myhomedox_home3.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1"
          >
            <span aria-hidden>←</span> Back to login
          </button>
          <span className="text-xs text-white/50">Dwella</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-white/75">
          Enter the email associated with your account. We’ll send you a link to
          create a new password.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-[#F35A1F]/70 focus:ring-2 focus:ring-[#F35A1F]/30"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border border-white/30 bg-[rgba(243,90,31,0.9)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(243,90,31,0.35)] transition hover:bg-[rgba(243,90,31,0.97)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={busy}
          >
            {busy ? "Sending reset link…" : "Send reset link"}
          </button>
        </form>

        {msg && (
          <p className="mt-4 text-xs text-white/80">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}