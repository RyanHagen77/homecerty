"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplySelectPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Link
            href="/login"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to login
          </Link>

          <h1 className="text-4xl font-bold text-gray-900">Join MyHomeDox</h1>
          <p className="mt-2 text-lg text-gray-600">
            Choose the professional account type that fits you
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Contractor Card */}
          <button
            onClick={() => router.push("/apply/contractor")}
            className="group rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl hover:scale-105"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
              🔧
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Contractor</h2>
            <p className="mb-4 text-sm text-gray-600">
              HVAC, plumbing, electrical, and all trades
            </p>
            <ul className="mb-6 space-y-2 text-left text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Document work on client properties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Build verified work portfolio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Get discovered by homeowners</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Passive lead generation</span>
              </li>
            </ul>
            <div className="rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white group-hover:bg-blue-700">
              Apply as Contractor →
            </div>
          </button>

          {/* Realtor Card */}
          <button
            onClick={() => router.push("/apply/realtor")}
            className="group rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl hover:scale-105"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl">
              🏡
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Realtor</h2>
            <p className="mb-4 text-sm text-gray-600">
              Real estate agents and brokers
            </p>
            <ul className="mb-6 space-y-2 text-left text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Add verified records to listings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Show complete maintenance history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Recommend trusted contractors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Stay connected post-sale</span>
              </li>
            </ul>
            <div className="rounded-lg bg-purple-600 px-4 py-2 text-center font-medium text-white group-hover:bg-purple-700">
              Apply as Realtor →
            </div>
          </button>

          {/* Inspector Card */}
          <button
            onClick={() => router.push("/apply/inspector")}
            className="group rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-xl hover:scale-105"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              🔍
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Inspector</h2>
            <p className="mb-4 text-sm text-gray-600">
              Licensed home inspectors
            </p>
            <ul className="mb-6 space-y-2 text-left text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Link inspection reports to homes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Track follow-up recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Refer trusted contractors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Build professional reputation</span>
              </li>
            </ul>
            <div className="rounded-lg bg-green-600 px-4 py-2 text-center font-medium text-white group-hover:bg-green-700">
              Apply as Inspector →
            </div>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}