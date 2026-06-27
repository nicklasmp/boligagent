export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchListings } from "@/lib/boliga";
import { sendToAll } from "@/lib/push";

export async function POST() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const listings = await fetchListings();

  const { data: existing, error } = await supabase
    .from("listings")
    .select("boliga_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const existingIds = new Set((existing ?? []).map((r) => r.boliga_id));
  const newListings = listings.filter((l) => !existingIds.has(l.boliga_id));

  if (newListings.length > 0) {
    const { error: insertError } = await supabase
      .from("listings")
      .insert(newListings.map((l) => ({ ...l, status: "new" })));

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await Promise.allSettled(
      newListings.map((l) =>
        sendToAll({
          title: "Nyt rækkehus i 5800",
          body: `${l.address} – ${l.price?.toLocaleString("da-DK")} kr.`,
          url: l.url,
        })
      )
    );
  }

  return NextResponse.json({ checked: listings.length, new: newListings.length });
}
