export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });

  const body = await req.json();
  const endpoint: string = body?.endpoint;
  const p256dh: string = body?.keys?.p256dh;
  const auth: string = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const pushSubscription = { endpoint, keys: { p256dh, auth } };

  const { error } = await getSupabase()
    .from("user_preferences")
    .upsert(
      { user_id: userId, push_subscription: pushSubscription, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });

  const { error } = await getSupabase()
    .from("user_preferences")
    .upsert(
      { user_id: userId, push_subscription: null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
