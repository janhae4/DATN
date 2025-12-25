import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith("/auth");
  const isPrivateRoute = !isAuthRoute && path !== "/";

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  
  if (isPrivateRoute) {
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    
    return NextResponse.next();
  }
  if (path.startsWith("/")) {
    if (accessToken || refreshToken) {
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
