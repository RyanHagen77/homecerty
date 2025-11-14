// app/api/pro/contractor/work-records/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const updateWorkRecordSchema = z.object({
  photos: z.array(z.string()).optional(),
  invoice: z.string().nullable().optional(),
  warranty: z.string().nullable().optional(),
});

/**
 * PATCH /api/pro/contractor/work-records/:id
 * Update work record with file URLs after upload
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateWorkRecordSchema.parse(body);

    // Verify work record belongs to this contractor
    const workRecord = await prisma.workRecord.findFirst({
      where: {
        id,
        contractorId: session.user.id,
      },
    });

    if (!workRecord) {
      return NextResponse.json(
        { error: "Work record not found" },
        { status: 404 }
      );
    }

    // Update with file URLs
    const updated = await prisma.workRecord.update({
      where: { id },
      data: {
        ...(data.photos && { photos: data.photos }),
        ...(data.invoice !== undefined && { invoiceUrl: data.invoice }),
        ...(data.warranty !== undefined && { warrantyUrl: data.warranty }),
      },
    });

    return NextResponse.json({
      success: true,
      workRecord: updated,
    });
  } catch (error) {
    console.error("Error updating work record:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update work record" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pro/contractor/work-records/:id
 * Get single work record
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workRecord = await prisma.workRecord.findFirst({
    where: {
      id,
      contractorId: session.user.id,
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
      contractor: {
        select: {
          id: true,
          name: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
            },
          },
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

  return NextResponse.json({ workRecord });
}