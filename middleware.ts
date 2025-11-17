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

    // Case 1: No cookie at all → redirect immediately
    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isAuthedRoute) {
        try {
            // await authAdmin.verifySessionCookie(sessionCookie || "", true);
            // Case 2: Cookie exists → verify with Firebase Admin SDK
            await authAdmin.verifySessionCookie(sessionCookie, true);

            // ✅ Valid cookie → allow request to continue
            return NextResponse.next();
        } catch {
            // ❌ Invalid/expired cookie → redirect to login
            return NextResponse.redirect(new URL("/auth", req.url));
        }
    }

    return NextResponse.next();
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
