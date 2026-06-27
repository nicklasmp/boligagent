import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await supabase
    .from("users")
    .select("name")
    .order("created_at");

  return NextResponse.json((data ?? []).map((u) => u.name));
}
