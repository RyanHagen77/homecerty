// app/api/pro/contractor/invitations/[id]/accept/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/pro/contractor/invitations/:id/accept
 * Homeowner accepts contractor's invitation to claim property
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: invitationId } = await ctx.params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            proProfile: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation has already been processed" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Verify the logged-in user's email matches the invitation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.email !== invitation.invitedEmail) {
      return NextResponse.json(
        { error: "This invitation was not sent to your email" },
        { status: 403 }
      );
    }

    // Parse the address from invitation (assume it was stored somewhere)
    // You might need to add address fields to Invitation model
    // For now, we'll need the address from the request body
    const body = await req.json();
    const { address, city, state, zip } = body;

    if (!address || !city || !state || !zip) {
      return NextResponse.json(
        { error: "Address details required to accept invitation" },
        { status: 400 }
      );
    }

    // Find or create the home
    const normalizedAddress = normalizeAddress({ line1: address, city, state, zip });

    // Try to find by normalized address first
    let home = await prisma.home.findFirst({
      where: { normalizedAddress },
    });

    // If not found, try finding by address components (for existing homes without normalizedAddress)
    if (!home) {
      home = await prisma.home.findFirst({
        where: {
          address: { contains: address, mode: 'insensitive' },
          city: { equals: city, mode: 'insensitive' },
          state: { equals: state, mode: 'insensitive' },
          zip,
        },
      });

      // If found via address components, update it with normalizedAddress
      if (home) {
        home = await prisma.home.update({
          where: { id: home.id },
          data: { normalizedAddress },
        });
      }
    }

    if (!home) {
      // Create home and assign to this homeowner
      home = await prisma.home.create({
        data: {
          address,
          city,
          state,
          zip,
          normalizedAddress,
          ownerId: session.user.id,
        },
      });
    } else if (!home.ownerId) {
      // Home exists but unclaimed - claim it
      home = await prisma.home.update({
        where: { id: home.id },
        data: { ownerId: session.user.id },
      });
    } else if (home.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "This home is already claimed by another user" },
        { status: 400 }
      );
    }

    // Create the connection
    const connection = await prisma.connection.create({
      data: {
        homeownerId: session.user.id,
        contractorId: invitation.invitedBy,
        homeId: home.id,
        status: "ACTIVE",
        invitedBy: session.user.id,
        establishedVia: "INVITATION",
        sourceRecordId: invitation.id,
        verifiedWorkCount: 0,
        totalSpent: 0,
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted and connection established",
      invitation: {
        id: invitation.id,
        status: "ACCEPTED",
      },
      connection: {
        id: connection.id,
        contractorName: invitation.inviter.name,
      },
      home: {
        id: home.id,
        address: home.address,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

// Helper function
function normalizeAddress(address: {
  line1: string;
  city: string;
  state: string;
  zip: string;
}): string {
  return [
    address.line1.toLowerCase().replace(/\W/g, ""),
    address.city.toLowerCase().replace(/\W/g, ""),
    address.state.toLowerCase(),
    address.zip.replace(/\D/g, "").slice(0, 5),
  ].join("");
}