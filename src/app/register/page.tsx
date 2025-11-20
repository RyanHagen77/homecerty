"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
};

type InvitationData = {
  invitedEmail: string;
  invitedName?: string | null;
  inviterName?: string | null;
  inviterCompany?: string | null;
  message?: string | null;
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );

  // Fetch invitation details
  useEffect(() => {
    if (!token) return;
    let cancel = false;

    async function loadInvite() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (!cancel) setMsg(data.error || "Invalid invitation link");
          return;
        }

        if (!cancel) {
          setForm((prev) => ({
            ...prev,
            email: data.invitedEmail ?? "",
            name: data.invitedName ?? "",
          }));
          setInvitationData(data);
        }
      } catch {
        if (!cancel) setMsg("Failed to load invitation.");
      }
    }

    loadInvite();
    return () => {
      cancel = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          invitationToken: token ?? undefined,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error || "Failed to register");
        setLoading(false);
        return;
      }

      window.location.href = "/login";
    } catch {
      setMsg("Registration failed");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10">
      {/* Background */}
      <div className="fixed inset-0 -z-50">
        <Image
          src="/myhomedox_home3.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white/95 shadow-2xl p-8 border border-black/5">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <DwellaLogo className="h-8 w-auto" />
        </div>

        {/* Invitation banner */}
        {invitationData && (
          <div className="mb-6 rounded-xl border border-orange-300 bg-orange-50 p-4 shadow-sm">
            <p className="text-sm text-orange-900">
              <strong>{invitationData.inviterName}</strong>
              {invitationData.inviterCompany &&
                ` (${invitationData.inviterCompany})`}{" "}
              has invited you to join Dwella.
            </p>
            {invitationData.message && (
              <p className="mt-2 text-sm italic text-orange-800">
                “{invitationData.message}”
              </p>
            )}
          </div>
        )}

        <h1 className="text-xl font-semibold text-gray-900 mb-4">
          {invitationData ? "Accept Invitation" : "Create your Dwella account"}
        </h1>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Floating input */}
          <div className="relative">
            <input
              className="peer w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-transparent focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <label className="absolute left-3 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-orange-600">
              Full name
            </label>
          </div>

          <div className="relative">
            <input
              className="peer w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-transparent focus:ring-2 focus:ring-orange-400 focus:border-orange-400 disabled:bg-gray-100"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              disabled={!!invitationData}
            />
            <label className="absolute left-3 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-orange-600">
              Email
            </label>
          </div>

          <div className="relative">
            <input
              className="peer w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-transparent focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              required
              minLength={8}
            />
            <label className="absolute left-3 top-3 text-gray-500 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-orange-600">
              Password (min 8)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[rgba(243,90,31,0.95)] py-3 text-white font-medium text-sm shadow-lg hover:bg-[rgba(243,90,31,1)] disabled:opacity-60 transition"
          >
            {loading
              ? "Creating your account..."
              : invitationData
              ? "Accept & Create Account"
              : "Create Account"}
          </button>
        </form>

        {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}

        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <a href="/login" className="text-orange-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RegisterForm />
    </Suspense>
  );
}

/** Mini Dwella logo */
function DwellaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
        stroke="#1F2937"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M32.5 34L40 41.5L54 27.5"
        stroke="#33C17D"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}