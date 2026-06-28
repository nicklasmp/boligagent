export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json([], { status: 401 });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("notification_log")
    .select("id, title, body, type, listing_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
