export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUser();
  if (!userId) return NextResponse.json({ error: "Ikke logget ind" }, { status: 401 });

  const { id } = await params;
  const listingId = Number(id);
  if (isNaN(listingId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("listing_id", listingId)
    .order("recorded_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
