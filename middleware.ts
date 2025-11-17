// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/api/auth",
    "/api/register",
    "/api/property",
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Allow public paths without any checks
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, check for session token
  const token =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // No token? Redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};