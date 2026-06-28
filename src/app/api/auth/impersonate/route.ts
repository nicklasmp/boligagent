import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SESSION_COOKIE, REAL_SESSION_COOKIE, SESSION_DAYS, getSessionMeta } from "@/lib/auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * SESSION_DAYS,
  path: "/",
};

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

// POST { userId } — impersonate target user
// POST { revert: true } — switch back to Nicklas
export async function POST(req: NextRequest) {
  const meta = await getSessionMeta();
  if (!meta?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const cookieStore = await cookies();
  const res = NextResponse.json({ ok: true });

  if (body.revert) {
    // Restore Nicklas's real session
    const realToken = cookieStore.get(REAL_SESSION_COOKIE)?.value;
    if (!realToken) return NextResponse.json({ error: "Not impersonating" }, { status: 400 });

    // Delete the impersonation session
    const activeToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (activeToken) await supabase.from("sessions").delete().eq("token", activeToken);

    res.cookies.set(SESSION_COOKIE, realToken, COOKIE_OPTS);
    res.cookies.delete(REAL_SESSION_COOKIE);
    return res;
  }

  // Start impersonating
  const { userId } = body as { userId: string };
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const newToken = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await supabase.from("sessions").insert({
    user_id: userId,
    token: newToken,
    expires_at: expiresAt.toISOString(),
  });

  const currentToken = cookieStore.get(SESSION_COOKIE)?.value!;
  // Save real session only if not already impersonating
  const existingReal = cookieStore.get(REAL_SESSION_COOKIE)?.value ?? currentToken;

  res.cookies.set(REAL_SESSION_COOKIE, existingReal, COOKIE_OPTS);
  res.cookies.set(SESSION_COOKIE, newToken, COOKIE_OPTS);
  return res;
}
