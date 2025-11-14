// app/api/pro/contractor/work-records-records/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createWorkRecordSchema = z.object({
  address: z.object({
    line1: z.string().min(1, "Address is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
  }),
  workType: z.string().min(1, "Work type is required"),
  workDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  description: z.string().optional(),
  cost: z.number().positive().optional(),
  warrantyIncluded: z.boolean().default(false),
  warrantyLength: z.string().optional(),
  warrantyDetails: z.string().optional(),
});

/**
 * POST /api/pro/contractor/work-records-records
 * Allows contractors to document work-records independently (without invitation)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    return NextResponse.json(
      { error: "Only contractors can document work-records" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createWorkRecordSchema.parse(body);

    // Step 1: Find or create Home by address
    const normalizedAddress = normalizeAddress(data.address);

    let home = await prisma.home.findFirst({
      where: { normalizedAddress },
    });

    // If home doesn't exist, create placeholder (no owner yet)
    if (!home) {
      home = await prisma.home.create({
        data: {
          address: data.address.line1,
          addressLine2: data.address.line2 ?? null,
          city: data.address.city,
          state: data.address.state,
          zip: data.address.zip,
          normalizedAddress,
          ownerId: null, // Orphaned until claimed
        },
      });
    }

    // Step 2: Create work-records record (unverified)
    const workRecord = await prisma.workRecord.create({
      data: {
        homeId: home.id,
        contractorId: session.user.id,
        invitationId: null, // No invitation - independent documentation
        workType: data.workType,
        workDate: new Date(data.workDate),
        description: data.description ?? null,
        cost: data.cost ?? null,
        warrantyIncluded: data.warrantyIncluded,
        warrantyLength: data.warrantyLength ?? null,
        warrantyDetails: data.warrantyDetails ?? null,
        addressSnapshot: data.address, // Store for homeowner matching
        status: home.ownerId ? "DOCUMENTED" : "DOCUMENTED_UNVERIFIED",
        isVerified: false,
        photos: [],
        invoiceUrl: null,
      },
      include: {
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

    // Step 3: Notify homeowner if home has an owner
    if (home.ownerId) {
      await notifyHomeownerOfNewWork(home.ownerId, workRecord, home);
    }

    return NextResponse.json(
      {
        success: true,
        workRecord: {
          id: workRecord.id,
          homeId: home.id,
          status: workRecord.status,
          uploadUrl: `/api/pro/contractor/work-records/${workRecord.id}/upload`,
        },
        message: home.ownerId
          ? "Work documented. Homeowner has been notified."
          : "Work documented. Awaiting property owner verification.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating work-records record:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create work-records record" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pro/contractor/work-records-records
 * List contractor's work-records records
 */
export async function GET(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const homeId = searchParams.get("homeId");

  const workRecords = await prisma.workRecord.findMany({
    where: {
      contractorId: session.user.id,
      ...(status && {
        status: status as
          | "PENDING_ACCEPTANCE"
          | "READY_TO_DOCUMENT"
          | "DOCUMENTED_UNVERIFIED"
          | "DOCUMENTED"
          | "APPROVED"
          | "REJECTED"
          | "DISPUTED"
          | "EXPIRED",
      }),
      ...(homeId && { homeId }),
      archivedAt: null,
    },
    include: {
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      invitation: {
        select: {
          id: true,
          workType: true,
          message: true,
        },
      },
    },
    orderBy: {
      workDate: "desc",
    },
  });

  return NextResponse.json({ workRecords });
}

// Helper functions

function normalizeAddress(address: {
  line1: string;
  city: string;
  state: string;
  zip: string;
}): string {
  // Normalize for matching: lowercase, remove spaces, standardize
  return [
    address.line1.toLowerCase().replace(/\W/g, ""),
    address.city.toLowerCase().replace(/\W/g, ""),
    address.state.toLowerCase(),
    address.zip.replace(/\D/g, "").slice(0, 5), // First 5 digits only
  ].join("");
}

async function notifyHomeownerOfNewWork(
  homeownerId: string,
  workRecord: {
    id: string;
    workType: string;
    workDate: Date;
    contractor: { name: string | null };
  },
  home: { address: string; city: string; state: string }
) {
  // Create notification
  await prisma.notification.create({
    data: {
      userId: homeownerId,
      channel: "EMAIL",
      subject: "New work-records documented at your property",
      payload: {
        type: "UNVERIFIED_WORK_ADDED",
        workRecordId: workRecord.id,
        workType: workRecord.workType,
        address: home.address,
        city: home.city,
        state: home.state,
        contractorName: workRecord.contractor.name,
        workDate: workRecord.workDate,
      },
    },
  });

  // TODO: Send actual email via your email service
  // await sendEmail({
  //   to: homeowner.email,
  //   subject: 'New work-records documented at your property',
  //   template: 'unverified-work-records',
  //   data: { workRecord, home }
  // });
}