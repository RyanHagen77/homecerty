// app/pro/contractor/work-records/[id]/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta } from "@/lib/glass";

export default async function WorkRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const workRecord = await prisma.workRecord.findFirst({
    where: {
      id,
      contractorId: session.user.id,
    },
    include: {
      home: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!workRecord) {
    redirect("/pro/contractor/work-records");
  }

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div>
          <Link
            href="/pro/contractor/work-records"
            className="text-sm text-white/70 hover:text-white"
          >
            ← Back to Work Records
          </Link>
        </div>

        <section className={glass}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className={`text-2xl font-semibold ${heading}`}>
                {workRecord.workType}
              </h1>
              <p className={textMeta}>
                {new Date(workRecord.workDate).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={workRecord.status} />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white/70">Property</h3>
              <p className="text-white">{workRecord.home.address}</p>
              <p className={textMeta}>
                {workRecord.home.city}, {workRecord.home.state} {workRecord.home.zip}
              </p>
              {workRecord.home.owner && (
                <p className={`mt-1 ${textMeta}`}>
                  Owner: {workRecord.home.owner.name || workRecord.home.owner.email}
                </p>
              )}
            </div>

            {workRecord.description && (
              <div>
                <h3 className="text-sm font-medium text-white/70">Description</h3>
                <p className="text-white">{workRecord.description}</p>
              </div>
            )}

            {workRecord.cost && (
              <div>
                <h3 className="text-sm font-medium text-white/70">Cost</h3>
                <p className="text-white text-xl font-semibold">
                  ${workRecord.cost.toFixed(2)}
                </p>
              </div>
            )}

            {workRecord.photos && workRecord.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(workRecord.photos as string[]).map((photo, index) => (
                    <a
                      key={index}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition"
                    >
                      <Image
                        src={photo}
                        alt={`Work photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {workRecord.invoiceUrl && (
              <div>
                <h3 className="text-sm font-medium text-white/70">Invoice</h3>
                <a
                  href={workRecord.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View Invoice PDF →
                </a>
              </div>
            )}

            {workRecord.warrantyIncluded && (
              <div>
                <h3 className="text-sm font-medium text-white/70">Warranty</h3>
                <div className="text-white">
                  {workRecord.warrantyLength && (
                    <p className="text-sm">Length: {workRecord.warrantyLength}</p>
                  )}
                  {workRecord.warrantyDetails && (
                    <p className="text-sm mt-1">{workRecord.warrantyDetails}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className={glass}>
          <h3 className="text-lg font-semibold text-white mb-2">Status</h3>
          {workRecord.isVerified ? (
            <div className="text-green-400">
              ✓ Verified by homeowner
              {workRecord.verifiedAt && (
                <span className="text-sm text-white/60 ml-2">
                  on {new Date(workRecord.verifiedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ) : (
            <div className="text-yellow-400">
              ⏳ Pending homeowner verification
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    DOCUMENTED_UNVERIFIED: {
      label: "Pending Verification",
      color: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
    },
    VERIFIED: {
      label: "Verified",
      color: "bg-green-400/10 text-green-300 border-green-400/30",
    },
    DISPUTED: {
      label: "Disputed",
      color: "bg-red-400/10 text-red-300 border-red-400/30",
    },
  };

  const { label, color } = config[status] || {
    label: status,
    color: "bg-gray-400/10 text-gray-300 border-gray-400/30",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${color}`}>
      {label}
    </span>
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