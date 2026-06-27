export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });

  const { id } = await params;
  const boligaId = Number(id);
  if (isNaN(boligaId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json();
  const { status, note } = body;

  if (!["new", "liked", "disliked"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // "new" means remove the interaction (undo)
  if (status === "new") {
    const { error } = await supabase
      .from("listing_interactions")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", boligaId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("listing_interactions").upsert(
    {
      user_id: userId,
      listing_id: boligaId,
      status,
      note: note ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,listing_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
