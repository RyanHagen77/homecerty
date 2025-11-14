// app/home/[homeId]/pending-work/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";

export default async function PendingWorkDebugPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check access to this home
  try {
    await requireHomeAccess(homeId, session.user.id);
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>You don't have access to this home.</p>
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {JSON.stringify({ homeId, userId: session.user.id }, null, 2)}
        </pre>
      </div>
    );
  }

  // Get home details
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  // Get ALL work records for this home (no filters)
  const allWorkRecords = await prisma.workRecord.findMany({
    where: {
      homeId,
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get pending work (with filters)
  const pendingWorkRecords = await prisma.workRecord.findMany({
    where: {
      homeId,
      isVerified: false,
      status: {
        in: ["DOCUMENTED_UNVERIFIED", "DOCUMENTED", "DISPUTED"],
      },
      archivedAt: null,
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Pending Work Debug</h1>

      <div className="border rounded p-4 bg-white">
        <h2 className="text-xl font-bold mb-2">Home Info</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(home, null, 2)}
        </pre>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="text-xl font-bold mb-2">
          All Work Records ({allWorkRecords.length})
        </h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
          {JSON.stringify(allWorkRecords, null, 2)}
        </pre>
      </div>

      <div className="border rounded p-4 bg-white">
        <h2 className="text-xl font-bold mb-2">
          Filtered Pending Work ({pendingWorkRecords.length})
        </h2>
        <p className="text-sm mb-2">
          Query: isVerified=false, status IN [DOCUMENTED_UNVERIFIED, DOCUMENTED, DISPUTED], archivedAt=null
        </p>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
          {JSON.stringify(pendingWorkRecords, null, 2)}
        </pre>
      </div>

      <div className="border rounded p-4 bg-yellow-100">
        <h2 className="text-xl font-bold mb-2">Expected Values</h2>
        <ul className="text-sm space-y-1">
          <li>✅ status: "DOCUMENTED_UNVERIFIED"</li>
          <li>✅ isVerified: false</li>
          <li>✅ archivedAt: null</li>
          <li>✅ homeId: {homeId}</li>
        </ul>
      </div>
    </div>
  );
}