export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PropertiesClient } from "./PropertiesClient";
import { glass, heading, textMeta } from "@/lib/glass";

export default async function PropertiesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || session.user.role !== "PRO") {
    redirect("/login");
  }

  const userId = session.user.id as string;

  // Get all connections for this contractor
  const connections = await prisma.connection.findMany({
    where: {
      contractorId: userId,
    },
    include: {
      homeowner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const homeIds = connections.map((c) => c.homeId);

  const homes = await prisma.home.findMany({
    where: {
      id: { in: homeIds },
    },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      photos: true,
    },
  });

  const workRecords = await prisma.workRecord.findMany({
    where: {
      contractorId: userId,
      homeId: { in: homeIds },
    },
    select: {
      id: true,
      homeId: true,
      workDate: true,
      status: true,
      description: true,
    },
    orderBy: {
      workDate: "desc",
    },
  });

  // Transform data for client
  const properties = connections.map((conn) => {
    const home = homes.find((h) => h.id === conn.homeId);
    const records = workRecords.filter((r) => r.homeId === conn.homeId);
    const lastWork = records.length > 0 ? records[0] : null;

    return {
      id: conn.homeId,
      address: home?.address ?? "Unknown Address",
      city: home?.city ?? "",
      state: home?.state ?? "",
      zip: home?.zip ?? "",
      homeownerName: conn.homeowner?.name ?? "Unknown",
      homeownerEmail: conn.homeowner?.email ?? "",
      connectionStatus: conn.status,
      jobCount: records.length,
      lastWorkDate: lastWork?.workDate?.toISOString() ?? null,
      lastWorkTitle: lastWork?.description ?? null,
      imageUrl: home?.photos?.[0] ?? null,
    };
  });

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Properties</span>
        </nav>

        {/* Header w/ back arrow */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href="/pro/contractor/dashboard"
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>

            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>
                Properties
              </h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                Homes you&apos;ve worked on and maintained.
              </p>
              <p className={`mt-1 text-xs ${textMeta}`}>
                {properties.length} propert
                {properties.length === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>
        </section>

        {/* Filter + grid UI (client component) */}
        <PropertiesClient properties={properties} />
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