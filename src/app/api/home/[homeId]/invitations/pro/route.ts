import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";

export async function POST(
  req: Request,
  { params }: { params: { homeId: string } }
) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const homeId = params.homeId;

  // Ensure this user actually has access to the home
  await requireHomeAccess(homeId, session.user.id);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, message } = body as { email?: string; message?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // 2 weeks, tweak as needed

  // IMPORTANT: relation name here is `inviter` (you already use it in includes)
  const invitation = await prisma.invitation.create({
    data: {
      invitedEmail: email.toLowerCase(),
      invitedName: null,
      role: "PRO",              // homeowner is inviting a PRO
      message: message || null,
      status: "PENDING",
      expiresAt,
      home: {
        connect: { id: homeId },
      },
      inviter: {
        connect: { id: session.user.id },
      },
    },
  });

  return NextResponse.json({ invitation }, { status: 201 });
}