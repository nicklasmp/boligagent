export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchListings } from "@/lib/boliga";
// import webpush from "web-push"; // Push deaktiveret — API afviser requests fra Vercel

function auth(req: NextRequest) {
  return req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let listings;
  try {
    listings = await fetchListings();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: existing, error } = await supabase
    .from("listings")
    .select("boliga_id, price");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const existingPriceMap = new Map((existing ?? []).map((r) => [r.boliga_id, r.price as number | null]));

  const newListings = listings.filter((l) => !existingPriceMap.has(l.boliga_id));
  const priceDrops = listings.filter((l) => {
    const old = existingPriceMap.get(l.boliga_id);
    return old != null && l.price != null && l.price < old;
  });

  // Insert new listings + record initial price
  if (newListings.length > 0) {
    const { error: insertError } = await supabase
      .from("listings")
      .insert(newListings.map((l) => ({ ...l, status: "new" })));
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await supabase.from("price_history").insert(
      newListings.map((l) => ({ listing_id: l.boliga_id, price: l.price }))
    );
  }

  // Handle price drops: update listing, record history, reset interactions
  const priceDropResults: { address: string; old: number; new: number }[] = [];
  for (const l of priceDrops) {
    const oldPrice = existingPriceMap.get(l.boliga_id)!;

    await Promise.all([
      supabase.from("listings").update({
        price: l.price,
        previous_price: oldPrice,
        price_changed_at: new Date().toISOString(),
      }).eq("boliga_id", l.boliga_id),
      supabase.from("price_history").insert({ listing_id: l.boliga_id, price: l.price }),
      supabase.from("listing_interactions").delete().eq("listing_id", l.boliga_id),
    ]);

    priceDropResults.push({ address: l.address, old: oldPrice, new: l.price });
  }

  // Push deaktiveret — API afviser requests fra Vercel

  return NextResponse.json({
    checked: listings.length,
    new: newListings.length,
    price_drops: priceDropResults.length,
    addresses: newListings.map((l) => l.address),
    price_drop_details: priceDropResults,
    _debug: listings.slice(0, 2).map((l) => ({ id: l.boliga_id, address: l.address })),
  });
}
