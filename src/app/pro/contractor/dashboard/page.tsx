export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  glass,
  glassTight,
  heading,
  textMeta,
  ctaPrimary,
  ctaGhost,
} from "@/lib/glass";

export default async function ProDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // If pending-work-records, redirect to pending-work-records page
  if (session.user.proStatus === "PENDING") {
    redirect("/pro/contractor/pending");
  }

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      phone: true,
      licenseNo: true,
      verified: true,
      rating: true,
    },
  });

  const connections = await prisma.connection.findMany({
    where: { contractorId: userId, status: "ACTIVE" },
    include: {
      homeowner: { select: { name: true, email: true } },
      home: { select: { address: true, city: true, state: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <section className={glass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-semibold ${heading}`}>
                {proProfile?.businessName || "Pro Dashboard"}
              </h1>
              <p className={textMeta}>
                {proProfile?.type === "CONTRACTOR"
                  ? "Contractor"
                  : proProfile?.type === "REALTOR"
                  ? "Realtor"
                  : proProfile?.type === "INSPECTOR"
                  ? "Inspector"
                  : "Professional"}
                {proProfile?.verified && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100">
                    ✓ Verified
                  </span>
                )}
              </p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <Link href="/pro/contractor/work-records/new" className={ctaPrimary}>
                + Document Work
              </Link>
              <Link href="/pro/contractor/invitations" className={ctaGhost}>
                Invite Homeowner
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={glass}>
            <p className={`text-sm font-medium ${textMeta}`}>Active Clients</p>
            <p className={`mt-2 text-3xl font-bold ${heading}`}>
              {connections.length}
            </p>
            <p className="mt-1 text-xs text-white/60">
              Connections with homeowners on MyHomeDox
            </p>
          </div>

          <div className={glass}>
            <p className={`text-sm font-medium ${textMeta}`}>Active Jobs</p>
            <p className={`mt-2 text-3xl font-bold ${heading}`}>—</p>
            <p className="mt-1 text-xs text-white/60">
              Job tracking coming soon
            </p>
          </div>

          <div className={glass}>
            <p className={`text-sm font-medium ${textMeta}`}>This Month</p>
            <p className={`mt-2 text-3xl font-bold ${heading}`}>—</p>
            <p className="mt-1 text-xs text-white/60">
              Revenue analytics coming soon
            </p>
          </div>

          <div className={glass}>
            <p className={`text-sm font-medium ${textMeta}`}>Avg Rating</p>
            <p className={`mt-2 text-3xl font-bold ${heading}`}>
              {proProfile?.rating?.toFixed(1) || "—"}{" "}
              <span className="text-base align-middle">★</span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              Based on homeowner reviews (coming soon)
            </p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Active Jobs */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${heading}`}>Active Jobs</h2>
                <span className={`text-xs ${textMeta}`}>Job board coming soon</span>
              </div>

              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <p className="text-white/80 mb-2">
                  Job tracking and scheduling aren&apos;t live yet.
                </p>
                <p className={`mb-4 text-sm ${textMeta}`}>
                  For now, document your work and invite homeowners to verify it.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link
                    href="/pro/contractor/work-records/new"
                    className={`${ctaPrimary} px-4 py-2 text-sm`}
                  >
                    + Document Work
                  </Link>
                  <Link
                    href="/pro/contractor/invitations"
                    className={`${ctaGhost} px-4 py-2 text-sm`}
                  >
                    Invite Homeowner
                  </Link>
                </div>
              </div>
            </section>

            {/* Recent Work */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${heading}`}>Recent Work</h2>
                <Link
                  href="/pro/contractor/work-records"
                  className="text-sm text-white/70 hover:text-white"
                >
                  View Work Records
                </Link>
              </div>

              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <p className="text-white/80 mb-2">
                  Your documented work will appear here.
                </p>
                <p className={`mb-4 text-sm ${textMeta}`}>
                  Capture installs, repairs, and inspections so homeowners can keep a
                  verified history of your work.
                </p>
                <Link
                  href="/pro/contractor/work-records/new"
                  className={`${ctaPrimary} px-4 py-2 text-sm`}
                >
                  Document Your First Job
                </Link>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Clients */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${heading}`}>Clients</h2>
                <Link
                  href="/pro/contractor/clients"
                  className="px-3 py-1.5 text-sm text-white/75 hover:text-white"
                >
                  View All
                </Link>
              </div>

              {connections.length === 0 ? (
                <div className="py-8 text-center">
                  <p className={`mb-2 ${textMeta}`}>No clients yet</p>
                  <p className={`mb-4 text-sm ${textMeta}`}>
                    Invite homeowners you&apos;ve worked with to connect their home.
                  </p>
                  <Link
                    href="/pro/contractor/invitations"
                    className={`${ctaPrimary} inline-block px-4 py-2 text-sm`}
                  >
                    Invite Your First Client
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div key={conn.id} className={glassTight}>
                      <p className="font-medium text-white">
                        {conn.homeowner?.name || conn.homeowner?.email || "Homeowner"}
                      </p>
                      <p className={textMeta}>
                        {conn.home?.address}
                        {conn.home?.city ? `, ${conn.home.city}` : ""}
                        {conn.home?.state ? `, ${conn.home.state}` : ""}
                      </p>
                    </div>
                  ))}
                  <div className="pt-2 text-right">
                    <Link
                      href="/pro/contractor/invitations"
                      className="text-xs text-white/70 hover:text-white"
                    >
                      Send another invite →
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Reviews (placeholder) */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${heading}`}>Recent Reviews</h2>
              </div>
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-5 text-center">
                <p className="mb-2 text-white/80">No reviews yet</p>
                <p className={`mb-4 text-sm ${textMeta}`}>
                  As homeowners verify your work and leave feedback, their reviews
                  will show up here.
                </p>
                <Link
                  href="/pro/profile"
                  className="text-sm text-white/80 underline-offset-2 hover:underline"
                >
                  Check your public profile
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}