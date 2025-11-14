// app/pro/contractor/analytics/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import ContractorAnalyticsClient from "./ContractorAnalyticsClient";

export default async function ContractorAnalyticsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // If pending, keep behavior consistent with dashboard
  if (session.user.proStatus === "PENDING") {
    redirect("/pro/contractor/pending");
  }

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      verified: true,
      rating: true,
    },
  });

  const activeClients = await prisma.connection.count({
    where: {
      contractorId: userId,
      status: "ACTIVE",
    },
  });

  // You can safely add more counts later (e.g., invitations, records, quotes)
  // and pass them down through props.

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-7xl p-6">
        <ContractorAnalyticsClient
          businessName={proProfile?.businessName || null}
          proType={proProfile?.type || null}
          verified={proProfile?.verified ?? false}
          rating={proProfile?.rating ?? null}
          activeClients={activeClients}
        />
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