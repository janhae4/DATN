import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith("/auth");
  const isOnboardingRoute = path === "/auth/onboarding";
  const isPrivateRoute = !isAuthRoute && path !== "/";

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const hasToken = (accessToken && accessToken !== "undefined" && accessToken !== "null") ||
    (refreshToken && refreshToken !== "undefined" && refreshToken !== "null");

  if (isPrivateRoute && !hasToken) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (hasToken) {
    if (isAuthRoute && !isOnboardingRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (path === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
