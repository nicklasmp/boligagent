import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const SESSION_COOKIE = "ba_session";
export const REAL_SESSION_COOKIE = "ba_real_session";
const SESSION_DAYS = 90;

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data: session } = await getSupabase()
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return session.user_id;
}

export async function getSessionUserWithName(): Promise<{ id: string; name: string } | null> {
  const userId = await getSessionUser();
  if (!userId) return null;

  const { data: user } = await getSupabase()
    .from("users")
    .select("id, name")
    .eq("id", userId)
    .single();

  return user ?? null;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getSupabase().from("sessions").delete().eq("token", token);
  }
}

export async function getSessionMeta(): Promise<{
  id: string;
  name: string;
  isAdmin: boolean;
  isImpersonating: boolean;
} | null> {
  const cookieStore = await cookies();
  const activeToken = cookieStore.get(SESSION_COOKIE)?.value;
  const realToken = cookieStore.get(REAL_SESSION_COOKIE)?.value;

  if (!activeToken) return null;

  const supabase = getSupabase();

  async function resolveUser(token: string) {
    const { data: session } = await supabase
      .from("sessions")
      .select("user_id, expires_at")
      .eq("token", token)
      .single();
    if (!session || new Date(session.expires_at) < new Date()) return null;
    const { data: user } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", session.user_id)
      .single();
    return user ?? null;
  }

  const activeUser = await resolveUser(activeToken);
  if (!activeUser) return null;

  if (realToken) {
    const realUser = await resolveUser(realToken);
    const isAdmin = realUser?.name.toLowerCase() === "nicklas";
    return { id: activeUser.id, name: activeUser.name, isAdmin, isImpersonating: true };
  }

  const isAdmin = activeUser.name.toLowerCase() === "nicklas";
  return { id: activeUser.id, name: activeUser.name, isAdmin, isImpersonating: false };
}

export { SESSION_DAYS };
