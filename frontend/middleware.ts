import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith("/auth");
  const isPrivateRoute = !isAuthRoute && path !== "/";

  const token =
    request.cookies.get("connect.sid")?.value ||
    request.cookies.get("accessToken")?.value;

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPrivateRoute && !token) {
    return NextResponse.redirect(new URL("/auth#login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Chạy trên mọi route TRỪ các file tĩnh (ảnh, font, css...)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
