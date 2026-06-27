import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const { data } = await supabase
    .from("user_preferences")
    .select("max_price, push_subscription")
    .eq("user_id", userId)
    .single();

  return NextResponse.json(data ?? { max_price: null, push_subscription: null });
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });

  const body = await req.json();

  const { error } = await supabase.from("user_preferences").upsert(
    { user_id: userId, ...body, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
