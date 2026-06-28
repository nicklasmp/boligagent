import bcrypt from "bcryptjs";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const SESSION_COOKIE = "ba_session";
export const SESSION_EXP_COOKIE = "ba_session_exp";
export const REAL_SESSION_COOKIE = "ba_real_session";
export const SESSION_DAYS = 90;

export function sessionCookieOpts(maxAge = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Single query: session + user joined — avoids a second round-trip
async function resolveToken(token: string): Promise<{ id: string; name: string } | null> {
  const { data } = await getSupabase()
    .from("sessions")
    .select("expires_at, users!inner(id, name)")
    .eq("token", token)
    .single();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data.users as unknown as { id: string; name: string };
}

export async function loginWithPin(
  name: string,
  pin: string
): Promise<{ userId: string; token: string } | null> {
  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id, pin_hash")
    .eq("name", name)
    .single();

  if (!user) return null;

  const valid = await bcrypt.compare(pin, user.pin_hash);
  if (!valid) return null;

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await supabase.from("sessions").insert({
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  return { userId: user.id, token };
}

export async function getSessionUser(): Promise<string | null> {
  const user = await getSessionUserWithName();
  return user?.id ?? null;
}

export async function getSessionUserWithName(): Promise<{ id: string; name: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveToken(token);
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getSupabase().from("sessions").delete().eq("token", token);
  }
}

// cache() deduplicates calls within the same server-render pass
export const getSessionMeta = cache(async (): Promise<{
  id: string;
  name: string;
  isAdmin: boolean;
  isImpersonating: boolean;
} | null> => {
  const cookieStore = await cookies();
  const activeToken = cookieStore.get(SESSION_COOKIE)?.value;
  const realToken = cookieStore.get(REAL_SESSION_COOKIE)?.value;

  if (!activeToken) return null;

  // Resolve both tokens in parallel — each is now a single joined query
  const [activeUser, realUser] = await Promise.all([
    resolveToken(activeToken),
    realToken ? resolveToken(realToken) : Promise.resolve(null),
  ]);

  if (!activeUser) return null;

  const isImpersonating = !!realToken && !!realUser;
  const isAdmin = (isImpersonating ? realUser! : activeUser).name.toLowerCase() === "nicklas";

  return { id: activeUser.id, name: activeUser.name, isAdmin, isImpersonating };
});

