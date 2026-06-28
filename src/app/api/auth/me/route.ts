import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionMeta } from "@/lib/auth";

export async function GET() {
  const meta = await getSessionMeta();
  if (!meta) return NextResponse.json(null, { status: 401 });

  if (!meta.isAdmin) return NextResponse.json({ ...meta, users: [] });

  // Fetch user list in same request to avoid client-side waterfall
  const { data: users } = await createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from("users")
    .select("id, name")
    .order("name");

  return NextResponse.json({ ...meta, users: users ?? [] });
}
