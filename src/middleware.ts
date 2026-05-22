import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("__Secure-authjs.session-token") ??
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token") ??
    request.cookies.get("next-auth.session-token");
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isCron = request.nextUrl.pathname.startsWith("/api/recurring/run") || request.nextUrl.pathname.startsWith("/api/bank/sync");

  if (isCron) return NextResponse.next();

  if (!token && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (token && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
