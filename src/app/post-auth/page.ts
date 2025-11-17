import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role, ProStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SessionUser = {
  id: string;
  role?: Role | null;
  proStatus?: ProStatus | null;
  email?: string | null;
  name?: string | null;
};

export default async function PostAuth() {
  const session = await getServerSession(authConfig);

  if (!session?.user) redirect("/login");

  // Instead of (session.user as any)
  const userId = (session.user as SessionUser).id;

  if (!userId) redirect("/login");

  // Always trust DB for role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, proStatus: true },
  });

  /** --------------------------
   *  Admin
   * --------------------------- */
  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  /** --------------------------
   *  PRO Users
   * --------------------------- */
if (user?.role === "PRO") {
  switch (user.proStatus) {
    case "PENDING":
      return redirect("/pro/dashboard");

    case "APPROVED":
      return redirect("/pro/dashboard");

    case "REJECTED":
      return redirect("/pro/rejected");

    default:
      return redirect("/pro/dashboard");
  }
}

  /** --------------------------
   *  Homeowners
   * --------------------------- */
  redirect("/home");
}