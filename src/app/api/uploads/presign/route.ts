// app/api/pro/contractor/uploads/presign/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET, buildRecordKey, PUBLIC_S3_URL_PREFIX } from "@/lib/s3";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/pro/contractor/uploads/presign
 * Generate presigned URL for contractor uploads (work records)
 * Validates contractor has ACTIVE connection to the home
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
      { error: "Only contractors can access this endpoint" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { homeId, recordId, filename, mimeType, size } = body;

    if (!homeId || !recordId || !filename || typeof size !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: homeId, recordId, filename, size" },
        { status: 400 }
      );
    }

    if (!mimeType) {
      return NextResponse.json(
        { error: "Missing mimeType" },
        { status: 400 }
      );
    }

    // Verify contractor has ACTIVE connection to this home
    const connection = await prisma.connection.findFirst({
      where: {
        contractorId: session.user.id,
        homeId,
        status: "ACTIVE",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "You don't have access to this property" },
        { status: 403 }
      );
    }

    // Verify the work record belongs to this contractor and home
    const workRecord = await prisma.workRecord.findFirst({
      where: {
        id: recordId,
        homeId,
        contractorId: session.user.id,
      },
    });

    if (!workRecord) {
      return NextResponse.json(
        { error: "Work record not found or access denied" },
        { status: 403 }
      );
    }

    // Build the S3 key
    const key = buildRecordKey(homeId, recordId, filename);

    // Create presigned URL
    const cmd = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 minutes

    // Public GET URL
    const publicUrl = PUBLIC_S3_URL_PREFIX
      ? `${PUBLIC_S3_URL_PREFIX}/${key}`
      : null;

    return NextResponse.json({ key, url, publicUrl }, { status: 200 });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}