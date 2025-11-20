/**
 * JOB REQUESTS LIST PAGE (HOMEOWNER)
 *
 * Shows all job requests created by the homeowner
 *
 * Location: app/home/[homeId]/requested-jobs/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import Image from "next/image";
import Link from "next/link";
import { glass, glassTight, heading, textMeta } from "@/lib/glass";
import { formatDistanceToNow } from "date-fns";
import type { Prisma } from "@prisma/client";

type PageProps = {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ status?: string }>;
};

type JobRequestWithRelations = Prisma.JobRequestGetPayload<{
  include: {
    contractor: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
        proProfile: {
          select: {
            businessName: true;
            verified: true;
            rating: true;
          };
        };
      };
    };
    quote: {
      select: {
        id: true;
        totalAmount: true;
        status: true;
      };
    };
  };
}>;

export default async function RequestedJobsPage({ params, searchParams }: PageProps) {
  const { homeId } = await params;
  const { status } = await searchParams;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      address: true,
      city: true,
      state: true,
    },
  });

  if (!home) {
    redirect("/home");
  }

  // Get job requests
  const where: Prisma.JobRequestWhereInput = {
    homeId,
    homeownerId: session.user.id,
  };

  if (status) {
    where.status = status as Prisma.EnumJobRequestStatusFilter;
  }

  const jobRequests = await prisma.jobRequest.findMany({
    where,
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              verified: true,
              rating: true,
            },
          },
        },
      },
      quote: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Group by status
  const pending = jobRequests.filter((jr) => jr.status === "PENDING");
  const quoted = jobRequests.filter((jr) => jr.status === "QUOTED");
  const accepted = jobRequests.filter((jr) => jr.status === "ACCEPTED");
  const inProgress = jobRequests.filter((jr) => jr.status === "IN_PROGRESS");
  const completed = jobRequests.filter((jr) => jr.status === "COMPLETED");
  const other = jobRequests.filter((jr) =>
    ["DECLINED", "CANCELLED"].includes(jr.status)
  );

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-6xl space-y-6 p-6">

        {/* Header */}
        <div className={glass}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${heading}`}>
                Job Requests
              </h1>
              <p className={`mt-2 ${textMeta}`}>
              {home.address}, {home.city}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/home/${homeId}/requested-jobs/new`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Request Work
            </Link>
            <Link
              href={`/home/${homeId}`}
              className={`text-sm ${textMeta} hover:text-white`}
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Pending" count={pending.length} color="orange" />
          <StatCard label="Quoted" count={quoted.length} color="blue" />
          <StatCard label="Accepted" count={accepted.length} color="green" />
          <StatCard label="In Progress" count={inProgress.length} color="purple" />
          <StatCard label="Completed" count={completed.length} color="emerald" />
          <StatCard label="Other" count={other.length} color="gray" />
        </div>

        {/* Pending Section */}
        {pending.length > 0 && (
          <section className={glass}>
            <h2 className={`mb-4 text-xl font-semibold ${heading}`}>
              Pending ({pending.length})
            </h2>
            <p className={`mb-4 text-sm ${textMeta}`}>
              Waiting for contractor to respond
            </p>
            <div className="space-y-3">
              {pending.map((jr) => (
                <JobRequestCard key={jr.id} jobRequest={jr} homeId={homeId} />
              ))}
            </div>
          </section>
        )}

        {/* Quoted Section */}
        {quoted.length > 0 && (
          <section className={glass}>
            <h2 className={`mb-4 text-xl font-semibold ${heading}`}>
              Quoted ({quoted.length})
            </h2>
            <p className={`mb-4 text-sm ${textMeta}`}>
              Contractor has sent a quote - review and accept
            </p>
            <div className="space-y-3">
              {quoted.map((jr) => (
                <JobRequestCard key={jr.id} jobRequest={jr} homeId={homeId} />
              ))}
            </div>
          </section>
        )}

        {/* All Requests */}
        <section className={glass}>
          <h2 className={`mb-4 text-xl font-semibold ${heading}`}>
            All Job Requests
          </h2>

          {jobRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <div className="mb-4 text-6xl">🔨</div>
              <p className="mb-2 text-white/80">No job requests yet</p>
              <p className={`mb-6 text-sm ${textMeta}`}>
                Request work from your connected contractors to get started.
              </p>
              <Link
                href={`/home/${homeId}/requested-jobs/new`}
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
              >
                Request Work
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobRequests.map((jr) => (
                <JobRequestCard key={jr.id} jobRequest={jr} homeId={homeId} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    green: "bg-green-500/10 border-green-500/30 text-green-300",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    gray: "bg-gray-500/10 border-gray-500/30 text-gray-300",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 backdrop-blur-sm ${colorMap[color]}`}
    >
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{count}</p>
    </div>
  );
}

function JobRequestCard({
  jobRequest,
  homeId
}: {
  jobRequest: JobRequestWithRelations;
  homeId: string;
}) {
  const statusConfig: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    PENDING: {
      label: "Pending",
      color: "bg-orange-500/10 text-orange-300 border-orange-500/30",
      icon: "⏳",
    },
    QUOTED: {
      label: "Quoted",
      color: "bg-blue-500/10 text-blue-300 border-blue-500/30",
      icon: "💰",
    },
    ACCEPTED: {
      label: "Accepted",
      color: "bg-green-500/10 text-green-300 border-green-500/30",
      icon: "✅",
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "bg-purple-500/10 text-purple-300 border-purple-500/30",
      icon: "🔨",
    },
    COMPLETED: {
      label: "Completed",
      color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      icon: "✔️",
    },
    DECLINED: {
      label: "Declined",
      color: "bg-gray-500/10 text-gray-300 border-gray-500/30",
      icon: "❌",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "bg-gray-500/10 text-gray-300 border-gray-500/30",
      icon: "🚫",
    },
  };

  const status = statusConfig[jobRequest.status] || statusConfig.PENDING;

  const urgencyColors: Record<string, string> = {
    LOW: "text-gray-400",
    NORMAL: "text-white/70",
    HIGH: "text-yellow-400",
    EMERGENCY: "text-red-400",
  };

  return (
    <Link
      href={`/home/${homeId}/requested-jobs/${jobRequest.id}`}
      className={`${glassTight} block hover:bg-white/10 transition-colors`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">
                {jobRequest.title}
              </h3>
              <p className={`text-sm ${textMeta} truncate`}>
                To: {jobRequest.contractor?.proProfile?.businessName ||
                  jobRequest.contractor?.name ||
                  jobRequest.contractor?.email}
              </p>
            </div>
            <span
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${status.color}`}
            >
              {status.icon} {status.label}
            </span>
          </div>

          {/* Description */}
          <p className={`text-sm ${textMeta} line-clamp-2 mb-2`}>
            {jobRequest.description}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            {jobRequest.category && <span>{jobRequest.category}</span>}
            {jobRequest.urgency && (
              <span className={urgencyColors[jobRequest.urgency]}>
                • {jobRequest.urgency}
              </span>
            )}
            {jobRequest.budgetMin && jobRequest.budgetMax && (
              <span>
                • ${Number(jobRequest.budgetMin).toLocaleString()} - $
                {Number(jobRequest.budgetMax).toLocaleString()}
              </span>
            )}
            {jobRequest.quote && (
              <span className="text-blue-400">
                • Quote: ${Number(jobRequest.quote.totalAmount).toLocaleString()}
              </span>
            )}
            <span>
              • {formatDistanceToNow(new Date(jobRequest.createdAt))} ago
            </span>
          </div>
        </div>
      </div>
    </Link>
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