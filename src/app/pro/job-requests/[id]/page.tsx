/**
 * JOB REQUEST DETAIL PAGE (CONTRACTOR)
 *
 * View job request from homeowner, submit quote
 *
 * Location: app/contractor/job-requests/[id]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { format } from "date-fns";
import { ContractorJobRequestActions } from "../_components/ContractorJobRequestActions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ContractorJobRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/");
  }

  const jobRequest = await prisma.jobRequest.findFirst({
    where: {
      id,
      contractorId: session.user.id,
    },
    include: {
      home: {
        select: {
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
      homeowner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      connection: {
        select: {
          id: true,
          status: true,
        },
      },
      quote: {
        include: {
          items: true,
        },
      },
      workRecord: {
        select: {
          id: true,
          workType: true,
          workDate: true,
          status: true,
          cost: true,
        },
      },
    },
  });

  if (!jobRequest) {
    notFound();
  }

  // Verify contractor assignment
  if (jobRequest.contractorId !== session.user.id) {
    redirect("/contractor");
  }

  // Sign photo URLs
  const signedPhotos = await Promise.all(
    (jobRequest.photos || []).map(async (url) => {
      const key = extractS3Key(url);
      return await getSignedGetUrl(key);
    })
  );

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/30" },
    QUOTED: { label: "Quoted", color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/30" },
    ACCEPTED: { label: "Accepted", color: "text-green-300", bg: "bg-green-500/10 border-green-500/30" },
    IN_PROGRESS: { label: "In Progress", color: "text-purple-300", bg: "bg-purple-500/10 border-purple-500/30" },
    COMPLETED: { label: "Completed", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30" },
    DECLINED: { label: "Declined", color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/30" },
    CANCELLED: { label: "Cancelled", color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/30" },
  };

  const status = statusConfig[jobRequest.status] || statusConfig.PENDING;

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Header */}
        <div className={glass}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-2xl font-semibold ${heading}`}>
                  {jobRequest.title}
                </h1>
                <span className={`rounded-full border px-3 py-1 text-sm font-medium ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className={textMeta}>
                {jobRequest.home.address}, {jobRequest.home.city}, {jobRequest.home.state}
              </p>
            </div>
            <Link
              href="/contractor/job-requests"
              className={`text-sm ${textMeta} hover:text-white whitespace-nowrap`}
            >
              ← Back to Requests
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Description
              </h2>
              <p className="whitespace-pre-wrap text-white/90">
                {jobRequest.description}
              </p>
            </section>

            {/* Photos Gallery */}
            {signedPhotos.length > 0 && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Photos ({signedPhotos.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {signedPhotos.map((photoUrl, index) => (
                    <a
                      key={index}
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                    >
                      <Image
                        src={photoUrl}
                        alt={`Job request photo ${index + 1}`}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="absolute bottom-2 right-2 opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white backdrop-blur-sm">
                          View Full Size
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Details */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Request Details
              </h2>
              <dl className="space-y-3">
                {jobRequest.category && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Category:</dt>
                    <dd className="text-white">{jobRequest.category}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Urgency:</dt>
                  <dd className="text-white">
                    {jobRequest.urgency}
                    {jobRequest.urgency === "EMERGENCY" && " 🚨"}
                  </dd>
                </div>
                {(jobRequest.budgetMin || jobRequest.budgetMax) && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Budget Range:</dt>
                    <dd className="text-white">
                      ${Number(jobRequest.budgetMin || 0).toLocaleString()} - $
                      {Number(jobRequest.budgetMax || 0).toLocaleString()}
                    </dd>
                  </div>
                )}
                {jobRequest.desiredDate && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Preferred Date:</dt>
                    <dd className="text-white">
                      {format(new Date(jobRequest.desiredDate), "MMM d, yyyy")}
                    </dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Requested:</dt>
                  <dd className="text-white">
                    {format(new Date(jobRequest.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </dd>
                </div>
                {jobRequest.respondedAt && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Responded:</dt>
                    <dd className="text-white">
                      {format(new Date(jobRequest.respondedAt), "MMM d, yyyy 'at' h:mm a")}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Your Notes */}
            {jobRequest.contractorNotes && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Your Notes
                </h2>
                <p className="whitespace-pre-wrap text-white/90">
                  {jobRequest.contractorNotes}
                </p>
              </section>
            )}

            {/* Your Quote */}
            {jobRequest.quote && (
              <section className={glass}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${heading}`}>
                    Your Quote
                  </h2>
                  <span className="text-2xl font-bold text-white">
                    ${Number(jobRequest.quote.totalAmount).toLocaleString()}
                  </span>
                </div>

                {jobRequest.quote.description && (
                  <p className={`mb-4 ${textMeta}`}>
                    {jobRequest.quote.description}
                  </p>
                )}

                {jobRequest.quote.items && jobRequest.quote.items.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white/80">Line Items:</h3>
                    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                      {jobRequest.quote.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="text-sm text-white">{item.item}</p>
                            <p className={`text-xs ${textMeta}`}>
                              {Number(item.qty)} × ${Number(item.unitPrice).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-white">
                            ${Number(item.total).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {jobRequest.quote.expiresAt && (
                  <p className={`mt-4 text-xs ${textMeta}`}>
                    Quote expires: {format(new Date(jobRequest.quote.expiresAt), "MMM d, yyyy")}
                  </p>
                )}
              </section>
            )}

            {/* Work Record */}
            {jobRequest.workRecord && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Work Completed
                </h2>
                <Link
                  href={`/contractor/work/${jobRequest.workRecord.id}`}
                  className="block rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                >
                  <p className="font-medium text-white">
                    {jobRequest.workRecord.workType}
                  </p>
                  <p className={`text-sm ${textMeta}`}>
                    Completed: {format(new Date(jobRequest.workRecord.workDate), "MMM d, yyyy")}
                  </p>
                  {jobRequest.workRecord.cost && (
                    <p className="mt-2 text-lg font-semibold text-white">
                      ${Number(jobRequest.workRecord.cost).toLocaleString()}
                    </p>
                  )}
                </Link>
              </section>
            )}
          </div>

          {/* Right Column - Homeowner & Actions */}
          <div className="space-y-6">
            {/* Homeowner Card */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Homeowner
              </h2>
              <div className="flex items-start gap-3">
                {jobRequest.homeowner.image && (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={jobRequest.homeowner.image}
                      alt={jobRequest.homeowner.name || "Homeowner"}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {jobRequest.homeowner.name}
                  </p>
                  <p className={`text-sm ${textMeta}`}>
                    ✉️ {jobRequest.homeowner.email}
                  </p>
                </div>
              </div>
            </section>

            {/* Actions */}
            <ContractorJobRequestActions
              jobRequest={jobRequest}
            />
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