// app/api/pro/contractor/invitations/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const createInvitationSchema = z.object({
  invitedEmail: z.string().email("Invalid email address"),
  invitedName: z.string().optional(),
  homeAddress: z.string().min(1, "Home address is required"),
  message: z.string().optional(),
  role: z.enum(["HOMEOWNER", "PRO"]),
});

/**
 * POST /api/pro/contractor/invitations
 * Contractor invites a homeowner to claim their property and verify work
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
      { error: "Only contractors can send invitations" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = createInvitationSchema.parse(body);

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.invitedEmail },
    });

    // If user exists and is a homeowner, check if connection already exists
    if (existingUser) {
      if (existingUser.role === "HOMEOWNER") {
        // Check if there's already a pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            invitedEmail: data.invitedEmail,
            invitedBy: session.user.id,
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        });

        if (existingInvitation) {
          return NextResponse.json(
            { error: "You already sent an invitation to this homeowner" },
            { status: 400 }
          );
        }

        // Allow invitation to existing homeowner
      } else {
        return NextResponse.json(
          { error: "This email belongs to a contractor account" },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        invitedEmail: data.invitedEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Parse the home address to extract components
    const addressParts = data.homeAddress.split(',').map(s => s.trim());
    const street = addressParts[0] || '';
    const city = addressParts[1] || '';
    const stateZip = addressParts[2]?.split(' ') || [];
    const state = stateZip[0] || '';
    const zip = stateZip[1] || '';

    // Create normalized address for matching
    const normalizedAddress = `${street}${city}${state}${zip}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Find or create the home
    let home = await prisma.home.findFirst({
      where: { normalizedAddress },
    });

    if (!home) {
      // Create home without owner (contractor doesn't own it)
      home = await prisma.home.create({
        data: {
          address: street,
          city,
          state,
          zip,
          normalizedAddress,
          ownerId: null, // No owner yet
        },
      });
    }

    // Create invitation (expires in 7 days)
    const invitation = await prisma.invitation.create({
      data: {
        invitedBy: session.user.id,
        invitedEmail: data.invitedEmail,
        invitedName: data.invitedName ?? null,
        role: data.role,
        message: data.message ?? null,
        homeId: home.id, // ← Link to home!
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Send invitation email
    // await sendInvitationEmail({
    //   to: data.invitedEmail,
    //   inviterName: user.name || "A contractor",
    //   inviterCompany: user.proProfile?.businessName || user.proProfile?.company || undefined,
    //   inviteeName: data.invitedName || undefined,
    //   message: data.message || undefined,
    //   token: invitation.token,
    //   role: data.role,
    //   homeAddress: data.homeAddress,
    // });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invitedEmail,
        status: invitation.status,
        token: invitation.token,
      },
    });
  } catch (error) {
    console.error("Error sending invitation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pro/contractor/invitations
 * List contractor's sent invitations
 */
export async function GET(req: Request) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const invitations = await prisma.invitation.findMany({
    where: {
      invitedBy: session.user.id,
      ...(status && {
        status: status as "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED",
      }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ invitations });
}