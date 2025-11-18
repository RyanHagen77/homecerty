/**
 * MESSAGES API ROUTE
 *
 * Endpoint: /api/messages/[connectionId]
 *
 * GET  - Fetch all messages for a connection (last 100)
 * POST - Send a new messages (triggers Pusher real-time event)
 *
 * Returns: Message objects with sender info, attachments, and read status
 *
 * Location: app/api/messages/[connectionId]/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusher } from "@/lib/pusher";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await params;

    // Verify user has access to this connection
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        OR: [
          { contractorId: session.user.id },
          { homeownerId: session.user.id },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get messages for this connection
    const messages = await prisma.message.findMany({
      where: { connectionId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            url: true,
          },
        },
        reads: {
          where: { userId: session.user.id },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Load last 100 messages
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await params;
    const { content, attachmentIds } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify access
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        OR: [
          { contractorId: session.user.id },
          { homeownerId: session.user.id },
        ],
        status: "ACTIVE",
      },
      include: {
        contractor: { select: { id: true, name: true } },
        homeowner: { select: { id: true, name: true } },
        home: { select: { address: true } },
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create messages
    const message = await prisma.message.create({
      data: {
        connectionId,
        senderId: session.user.id,
        content: content.trim(),
        // If attachmentIds provided, connect them
        ...(attachmentIds?.length > 0 && {
          attachments: {
            connect: attachmentIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        attachments: true,
        reads: true,
      },
    });

    // Mark as read by sender
    await prisma.messageRead.create({
      data: {
        messageId: message.id,
        userId: session.user.id,
      },
    });

    // Trigger Pusher event
    await pusher.trigger(`connection-${connectionId}`, "new-messages", {
      message,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending messages:", error);
    return NextResponse.json(
      { error: "Failed to send messages" },
      { status: 500 }
    );
  }
}