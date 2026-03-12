import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith("/auth");
  const isOnboardingRoute = path === "/auth/onboarding";
  const isPrivateRoute = !isAuthRoute && path !== "/";

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasToken = accessToken || refreshToken;
  console.log("Has Token:", hasToken);

  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${protocol}://${host}`;

  if (!hasToken) {
    if (isPrivateRoute) {
      return NextResponse.redirect(new URL("/", origin));
    }
    return NextResponse.next();
  }

  if (hasToken) {
    if ((isAuthRoute && !isOnboardingRoute) || path === "/") {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
