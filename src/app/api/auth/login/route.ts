import { NextRequest, NextResponse } from "next/server";
import { loginWithPin, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { logEvent } from "@/lib/track";

export async function POST(req: NextRequest) {
  const { name, pin } = await req.json();

  if (!name || !pin) {
    return NextResponse.json({ error: "Mangler navn eller PIN" }, { status: 400 });
  }

  const result = await loginWithPin(name, pin);

  if (!result) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Forkert PIN" }, { status: 401 });
  }

  logEvent(result.userId, "session_start", { name }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: "/",
  });

  return res;
}
