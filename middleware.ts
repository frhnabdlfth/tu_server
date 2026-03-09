import { NextRequest, NextResponse } from "next/server"

const protectedRoutes = ["/dashboard", "/documents"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("tu_session")?.value

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/login",
  ],
}