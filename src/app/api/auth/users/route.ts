import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionMeta } from "@/lib/auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const meta = await getSessionMeta();
  if (!meta?.isAdmin) return NextResponse.json([], { status: 403 });

  const { data } = await supabase
    .from("users")
    .select("id, name")
    .order("created_at");

  return NextResponse.json(data ?? []);
}
