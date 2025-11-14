// app/api/home/[homeId]/records/pending-work-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export const runtime = "nodejs";

/**
 * GET /api/home/:homeId/records/pending-work-records
 * Fetches all unverified work-records for a specific home
 *
 * Note: This returns WorkRecords, not regular Records.
 * WorkRecords are pending contractor work-records that needs verification.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ homeId: string }> }
) {
  const { homeId } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use your existing home access check
  await requireHomeAccess(homeId, session.user.id);

  // Get all unverified work-records records for this home
  const pendingWork = await prisma.workRecord.findMany({
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
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
              phone: true,
              rating: true,
              completedJobs: true,
              verified: true,
            },
          },
        },
      },
      invitation: {
        select: {
          id: true,
          message: true,
          invitationType: true,
        },
      },
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    pendingWork,
    totalPending: pendingWork.length,
  });
}