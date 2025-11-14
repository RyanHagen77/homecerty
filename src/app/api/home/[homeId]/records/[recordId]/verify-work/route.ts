// app/api/home/[homeId]/records/[recordId]/verify-work-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { z } from "zod";

export const runtime = "nodejs";

const verifyWorkSchema = z.object({
  action: z.enum(["VERIFY", "DISPUTE", "REJECT"]),
  feedback: z.string().optional(),
  adjustments: z
    .object({
      cost: z.number().positive().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

type VerifyWorkInput = z.infer<typeof verifyWorkSchema>;

/**
 * POST /api/home/:homeId/records/:recordId/verify-work-records
 * Allows homeowners to verify, dispute, or reject contractor-documented work-records
 *
 * Note: This verifies a WorkRecord, not a regular Record.
 * The recordId parameter is actually a workRecordId.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ homeId: string; recordId: string }> }
) {
  const { homeId, recordId } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use your existing home access check
  await requireHomeAccess(homeId, session.user.id);

  try {
    const body = await req.json();
    const data = verifyWorkSchema.parse(body);

    // Get work-records record (recordId is actually workRecordId here)
    const workRecord = await prisma.workRecord.findUnique({
      where: { id: recordId },
      include: {
        home: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        contractor: {
          select: {
            id: true,
            name: true,
            email: true,
            proProfile: true,
          },
        },
      },
    });

    if (!workRecord) {
      return NextResponse.json(
        { error: "Work record not found" },
        { status: 404 }
      );
    }

    // Verify work-records record belongs to this home
    if (workRecord.homeId !== homeId) {
      return NextResponse.json(
        { error: "Work record does not belong to this home" },
        { status: 400 }
      );
    }

    // Handle different actions
    if (data.action === "VERIFY") {
      return await handleVerify(workRecord, session.user.id, data);
    } else if (data.action === "DISPUTE") {
      return await handleDispute(workRecord, session.user.id, data);
    } else if (data.action === "REJECT") {
      return await handleReject(workRecord, data);
    }
  } catch (error) {
    console.error("Error verifying work-records record:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify work-records record" },
      { status: 500 }
    );
  }
}

async function handleVerify(
  workRecord: {
    id: string;
    homeId: string;
    contractorId: string;
    description: string | null;
    workType: string;
    workDate: Date;
    cost: unknown;
    home: { address: string; owner: { name: string | null } | null };
    contractor: { name: string | null; email: string };
  },
  userId: string,
  data: VerifyWorkInput
) {
  // Update work-records record to verified
  const updated = await prisma.workRecord.update({
    where: { id: workRecord.id },
    data: {
      status: "APPROVED",
      isVerified: true,
      claimedBy: userId,
      claimedAt: new Date(),
      verifiedBy: userId,
      verifiedAt: new Date(),
      approvedBy: userId,
      approvedAt: new Date(),
      // Apply any cost or description adjustments
      ...(data.adjustments?.cost && { cost: data.adjustments.cost }),
      ...(data.adjustments?.description && {
        description: workRecord.description
          ? `${workRecord.description}\n\nHomeowner note: ${data.adjustments.description}`
          : data.adjustments.description,
      }),
    },
  });

  // Create connection if it doesn't exist
  const connection = await createOrUpdateConnection({
    homeId: workRecord.homeId,
    homeownerId: userId,
    contractorId: workRecord.contractorId,
    establishedVia: "VERIFIED_WORK",
    sourceRecordId: workRecord.id,
  });

  // Create a permanent Record entry for the home history
  // Convert Decimal to number for the cost field
  const finalRecord = await prisma.record.create({
    data: {
      homeId: workRecord.homeId,
      title: workRecord.workType,
      note: workRecord.description,
      date: workRecord.workDate,
      kind: "maintenance",
      vendor: workRecord.contractor.name || workRecord.contractor.email,
      cost: workRecord.cost ? Number(workRecord.cost) : null,
      createdBy: userId,
      verifiedBy: userId,
      verifiedAt: new Date(),
    },
  });

  // Link work-records record to final record
  await prisma.workRecord.update({
    where: { id: workRecord.id },
    data: { finalRecordId: finalRecord.id },
  });

  // Notify contractor
  await prisma.notification.create({
    data: {
      userId: workRecord.contractorId,
      channel: "EMAIL",
      subject: "Your work-records has been verified",
      payload: {
        type: "WORK_VERIFIED",
        workRecordId: workRecord.id,
        workType: workRecord.workType,
        address: workRecord.home.address,
        homeownerName: workRecord.home.owner?.name,
      },
    },
  });

  return NextResponse.json({
    success: true,
    workRecord: updated,
    connection,
    finalRecord,
    message: "Work verified and added to home history",
  });
}

async function handleDispute(
  workRecord: { id: string; contractorId: string; workType: string },
  userId: string,
  data: VerifyWorkInput
) {
  const updated = await prisma.workRecord.update({
    where: { id: workRecord.id },
    data: {
      status: "DISPUTED",
      claimedBy: userId,
      claimedAt: new Date(),
      rejectionReason: data.feedback,
    },
  });

  // Notify contractor of dispute
  await prisma.notification.create({
    data: {
      userId: workRecord.contractorId,
      channel: "EMAIL",
      subject: "Work record disputed",
      payload: {
        type: "WORK_DISPUTED",
        workRecordId: workRecord.id,
        workType: workRecord.workType,
        feedback: data.feedback,
      },
    },
  });

  return NextResponse.json({
    success: true,
    workRecord: updated,
    message: "Work record disputed. Contractor has been notified.",
  });
}

async function handleReject(
  workRecord: { id: string; contractorId: string; workType: string },
  data: VerifyWorkInput
) {
  const updated = await prisma.workRecord.update({
    where: { id: workRecord.id },
    data: {
      status: "REJECTED",
      rejectionReason: data.feedback,
    },
  });

  // Notify contractor of rejection
  await prisma.notification.create({
    data: {
      userId: workRecord.contractorId,
      channel: "EMAIL",
      subject: "Work record rejected",
      payload: {
        type: "WORK_REJECTED",
        workRecordId: workRecord.id,
        workType: workRecord.workType,
        feedback: data.feedback,
      },
    },
  });

  return NextResponse.json({
    success: true,
    workRecord: updated,
    message: "Work record rejected.",
  });
}

async function createOrUpdateConnection(params: {
  homeId: string;
  homeownerId: string;
  contractorId: string;
  establishedVia: string;
  sourceRecordId: string;
}) {
  const { homeId, homeownerId, contractorId, establishedVia, sourceRecordId } =
    params;

  // Check if connection already exists
  const existing = await prisma.connection.findUnique({
    where: {
      homeownerId_contractorId_homeId: {
        homeownerId,
        contractorId,
        homeId,
      },
    },
  });

  if (existing) {
    // Update existing connection with new metrics
    const verifiedWorkCount = await prisma.workRecord.count({
      where: {
        homeId,
        contractorId,
        isVerified: true,
      },
    });

    const totalSpentResult = await prisma.workRecord.aggregate({
      where: {
        homeId,
        contractorId,
        isVerified: true,
      },
      _sum: { cost: true },
    });

    const lastWork = await prisma.workRecord.findFirst({
      where: {
        homeId,
        contractorId,
        isVerified: true,
      },
      orderBy: { workDate: "desc" },
    });

    return await prisma.connection.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        verifiedWorkCount,
        totalSpent: totalSpentResult._sum.cost || 0,
        lastWorkDate: lastWork?.workDate,
      },
    });
  } else {
    // Create new connection
    return await prisma.connection.create({
      data: {
        homeownerId,
        contractorId,
        homeId,
        status: "ACTIVE",
        invitedBy: homeownerId,
        establishedVia: establishedVia as "VERIFIED_WORK" | "INVITATION" | "MANUAL",
        sourceRecordId,
        verifiedWorkCount: 1,
        totalSpent: 0,
      },
    });
  }
}