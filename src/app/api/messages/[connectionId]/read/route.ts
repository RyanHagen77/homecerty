/**
 * MARK MESSAGES AS READ API ROUTE
 *
 * Endpoint: /api/messages/[connectionId]/read
 *
 * POST - Marks all unread messages in this connection as read
 *
 * Works for ALL pro types: contractors, realtors, inspectors, homeowners.
 *
 * Creates MessageRead records for all messages the user hasn't read yet.
 * Call this when the user opens a conversation.
 *
 * Location: app/api/messages/[connectionId]/read/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ connectionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { connectionId } = await params;

    // Verify access (works for all pro types + homeowners)
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        OR: [
          { contractorId: userId },
          { realtorId: userId },
          { inspectorId: userId },
          { homeownerId: userId },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get unread messages for this user in this connection
    const unreadMessages = await prisma.message.findMany({
      where: {
        connectionId,
        senderId: { not: userId }, // not sent by me
        reads: {
          none: {
            userId, // not read by me yet
          },
        },
      },
      select: { id: true },
    });

    // Nothing to mark
    if (unreadMessages.length === 0) {
      return NextResponse.json({
        success: true,
        markedRead: 0,
      });
    }

    // Create read receipts for all unread messages
    await prisma.messageRead.createMany({
      data: unreadMessages.map((msg) => ({
        messageId: msg.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      markedRead: unreadMessages.length,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}