"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setMsg("Invalid or missing reset link.");
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }

    setMsg(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset password.");
      }

      setMsg("Password updated. Redirecting to login…");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password.";
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
          Choose a new password
        </h1>
        <p className="mt-2 text-sm text-white/75">
          Your new password will replace your old one for this account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/70">
              New password
            </label>
            <input
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-[#F35A1F]/70 focus:ring-2 focus:ring-[#F35A1F]/30"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={invalid}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/70">
              Confirm password
            </label>
            <input
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-[#F35A1F]/70 focus:ring-2 focus:ring-[#F35A1F]/30"
              type="password"
              placeholder="Repeat your new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              disabled={invalid}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border border-white/30 bg-[rgba(243,90,31,0.9)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_28px_rgba(243,90,31,0.35)] transition hover:bg-[rgba(243,90,31,0.97)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={busy || invalid}
          >
            {busy ? "Updating password…" : "Update password"}
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