/**
 * MESSAGES INBOX PAGE
 *
 * Shows all active conversations for ANY pro type (contractor, realtor, inspector).
 * Lists connections with unread counts and last messages preview.
 *
 * Location: app/(pro)/pro/messages/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  glass,
  glassTight,
  heading,
  textMeta,
} from "@/lib/glass";

export default async function MessagesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get all active connections with messages data (works for all pro types)
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { contractorId: userId },
        { realtorId: userId },
        { inspectorId: userId },
      ],
      status: "ACTIVE",
    },
    include: {
      homeowner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          reads: {
            where: { userId },
          },
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              reads: {
                none: {
                  userId,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Format conversations
  const conversations = connections.map((conn) => {
    const lastMessage = conn.messages[0];
    const unreadCount = conn._count.messages;

    return {
      connectionId: conn.id,
      homeowner: {
        name: conn.homeowner.name || conn.homeowner.email || "Homeowner",
        image: conn.homeowner.image,
      },
      property: {
        address: conn.home.address,
        city: conn.home.city,
        state: conn.home.state,
      },
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.reads.length > 0,
          }
        : null,
      unreadCount,
    };
  });

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Header */}
        <section className={glass}>
          <h1 className={`text-2xl font-semibold ${heading}`}>Messages</h1>
          <p className={textMeta}>
            Communicate with homeowners about your work
          </p>
        </section>

        {/* Conversations List */}
        <section className={glass}>
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <p className="mb-2 text-white/80">No conversations yet</p>
              <p className={`text-sm ${textMeta}`}>
                Messages will appear here when homeowners reach out or when you
                start a conversation with a connected homeowner.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link
                  key={conv.connectionId}
                  href={`/pro/messages/${conv.connectionId}`}
                  className={`${glassTight} flex items-center gap-4 hover:bg-white/10 transition-colors`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {conv.homeowner.image ? (
                      <Image
                        src={conv.homeowner.image}
                        alt={conv.homeowner.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-xl font-medium">
                          {conv.homeowner.name[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-white truncate">
                        {conv.homeowner.name}
                      </p>
                      {conv.lastMessage && (
                        <p className={`text-xs ${textMeta} flex-shrink-0`}>
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                    <p className={`text-sm ${textMeta} truncate`}>
                      {conv.property.address}
                      {conv.property.city && `, ${conv.property.city}`}
                    </p>
                    {conv.lastMessage && (
                      <p
                        className={`text-sm ${
                          conv.unreadCount > 0
                            ? "text-white font-medium"
                            : textMeta
                        } truncate mt-1`}
                      >
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="flex-shrink-0 h-6 min-w-[24px] px-1.5 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
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