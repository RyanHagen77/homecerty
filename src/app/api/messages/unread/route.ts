/**
 * UNREAD MESSAGES COUNT API ROUTE
 *
 * Endpoint: /api/messages/unread
 *
 * GET - Returns unread messages count for the current user.
 *
 * Works for contractors and homeowners.
 *
 * Response:
 * {
 *   total: 5,                 // total unread across all connections
 *   byConnection: {           // breakdown per connection
 *     "connection-id-1": 3,
 *     "connection-id-2": 2
 *   }
 * }
 *
 * Use this to show badge counts in navigation or inbox.
 *
 * Location: app/api/messages/unread/route.ts
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<NextResponse> {
  console.log("[Unread API] Request received");
  console.log("[Unread API] Headers:", Object.fromEntries(request.headers.entries()));

  try {
    const session = await getServerSession(authConfig);

    console.log("[Unread API] Session:", JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log("[Unread API] NO SESSION - Returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("[Unread API] User ID:", userId);

    // All active connections for this user (contractors + homeowners)
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { contractorId: userId },
          { homeownerId: userId },
        ],
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const connectionIds = connections.map((c) => c.id);

    // No active connections = no unread messages
    if (connectionIds.length === 0) {
      return NextResponse.json({
        total: 0,
        byConnection: {},
      });
    }

    // Count total unread messages
    const totalUnread = await prisma.message.count({
      where: {
        connectionId: { in: connectionIds },
        senderId: { not: userId }, // not sent by me
        reads: {
          none: {
            userId, // not read by me
          },
        },
      },
    });

    // Get unread count per connection
    const unreadByConnection = await prisma.message.groupBy({
      by: ["connectionId"],
      where: {
        connectionId: { in: connectionIds },
        senderId: { not: userId },
        reads: {
          none: {
            userId,
          },
        },
      },
      _count: { _all: true },
    });

    // Format as { [connectionId]: count }
    const byConnection = Object.fromEntries(
      unreadByConnection.map((item) => [item.connectionId, item._count._all])
    );

    console.log("[Unread API] Returning:", { total: totalUnread, connectionCount: connectionIds.length });

    return NextResponse.json({
      total: totalUnread,
      byConnection,
    });
  } catch (error) {
    console.error("[Unread API] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread messages count" },
      { status: 500 }
    );
  }
}