import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_EXP_COOKIE, REAL_SESSION_COOKIE, SESSION_DAYS, sessionCookieOpts } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/admin", "/api/auth/login", "/api/auth/users", "/api/admin", "/api/cron/poll"];

// Extend session when less than this many days remain
const REFRESH_THRESHOLD_DAYS = 30;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.next();

  // Only extend sessions on page navigations — skip API routes
  const isPageNav = !pathname.startsWith("/api/");
  // Don't extend impersonation sessions
  const isImpersonating = !!req.cookies.get(REAL_SESSION_COOKIE)?.value;

  if (isPageNav && !isImpersonating) {
    const expCookie = req.cookies.get(SESSION_EXP_COOKIE)?.value;
    const daysLeft = expCookie
      ? (new Date(expCookie).getTime() - Date.now()) / 86_400_000
      : 0;

    if (daysLeft < REFRESH_THRESHOLD_DAYS) {
      await extendSession(sessionToken, res);
    }
  }

  return res;
}

async function extendSession(token: string, res: NextResponse) {
  const newExpiry = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  try {
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/sessions?token=eq.${token}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ expires_at: newExpiry.toISOString() }),
      }
    );
  } catch {
    // Never block the request if extension fails
    return;
  }

  const opts = sessionCookieOpts();
  res.cookies.set(SESSION_COOKIE, token, opts);
  res.cookies.set(SESSION_EXP_COOKIE, newExpiry.toISOString(), opts);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
