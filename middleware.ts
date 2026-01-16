import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const userRole = token.role as string

    // Patient routes
    if (path.startsWith("/patient")) {
      if (userRole !== "PATIENT") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Provider routes
    if (path.startsWith("/provider")) {
      if (userRole !== "PROVIDER") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Allow access to public routes and API routes
        const publicPaths = ["/", "/login", "/register"]
        if (publicPaths.includes(path) || path.startsWith("/api/")) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/patient/:path*",
    "/provider/:path*",
    "/dashboard/:path*",
    "/availability/:path*",
  ],
}
