// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authAdmin } from '@/lib/firebaseAdmin';

export async function middleware(req: NextRequest) {
    const sessionCookie = req.cookies.get("session")?.value;
    const pathname = req.nextUrl.pathname;

    const isAuthedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/sessions") ||
        pathname.startsWith("/goals") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/export");

    const isAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/auth");

    // Case 1: No cookie → block protected routes, allow public
    if (!sessionCookie) {
        if (isAuthedRoute) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        return NextResponse.next();
    }
    // Case 2: Cookie exists → verify for protected routes
    try {
        await authAdmin.verifySessionCookie(sessionCookie, true);

        if (isAuthPage) {
            // ✅ Already authenticated → redirect away from login/signup
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        if (isAuthedRoute) {
            // ✅ Valid cookie → allow protected route
            return NextResponse.next();
        }

        // For other public routes, just continue
        return NextResponse.next();
    } catch {
        // ❌ Invalid/expired cookie → clear session and redirect to login
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

// Apply middleware only to protected routes
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/sessions/:path*",
        "/goals/:path*",
        "/analytics/:path*",
        "/export/:path*",
        "/login",
        "/signup",
        "/auth",
    ],
};
