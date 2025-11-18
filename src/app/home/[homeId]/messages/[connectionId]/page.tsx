/**
 * HOMEOWNER INDIVIDUAL CHAT PAGE
 *
 * Real-time messaging interface for homeowner chatting with a contractor.
 * Shows message history and allows sending new messages.
 *
 * Location: app/home/[homeId]/messages/[connectionId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { textMeta } from "@/lib/glass";
import { MessageThread } from "@/app/pro/messages/[connectionId]/_components/MessageThread";

export default async function HomeownerChatPage({
  params,
}: {
  params: Promise<{ homeId: string; connectionId: string }>;
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId, connectionId } = await params;
  const userId = session.user.id;

  // Get connection details - verify homeowner owns this home and connection
  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      homeId,
      homeownerId: userId,
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
            },
          },
        },
      },
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!connection || !connection.contractor) {
    notFound();
  }

  // Get messages
  const messages = await prisma.message.findMany({
    where: { connectionId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
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
        where: { userId },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const otherUser = {
    id: connection.contractor.id,
    name: connection.contractor.proProfile?.businessName || connection.contractor.name || connection.contractor.email || "Contractor",
    image: connection.contractor.image,
  };

  const property = {
    address: connection.home.address,
    city: connection.home.city,
    state: connection.home.state,
  };

  return (
    <main className="relative flex h-screen flex-col text-white">
      <Bg />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 p-4">
          <Link
            href={`/home/${homeId}/messages`}
            className="text-white/70 hover:text-white"
          >
            ← Back
          </Link>
          <div className="flex flex-1 items-center gap-3 min-w-0">
            {otherUser.image ? (
              <Image
                src={otherUser.image}
                alt={otherUser.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-medium">
                  {otherUser.name[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-white truncate">{otherUser.name}</p>
              <p className={`text-sm ${textMeta} truncate`}>
                {property.address}
                {property.city && `, ${property.city}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageThread
          connectionId={connectionId}
          initialMessages={messages}
          currentUserId={userId}
          otherUser={otherUser}
        />
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