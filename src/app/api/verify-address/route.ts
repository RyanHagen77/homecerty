// app/api/verify-address/route.ts
import { NextResponse } from "next/server";
import { verifyAddress } from "@/lib/address-verification";

export const runtime = "nodejs";

/**
 * POST /api/verify-address
 * Verify address against USPS database
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { street, city, state, zip, unit } = body;

    if (!street || !city || !state || !zip) {
      return NextResponse.json(
        { error: "Missing required address fields" },
        { status: 400 }
      );
    }

    const result = await verifyAddress(street, city, state, zip, unit);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Address verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify address" },
      { status: 500 }
    );
  }
}