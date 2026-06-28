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
  const existingListings = listings.filter((l) => existingPriceMap.has(l.boliga_id));
  const priceDrops = existingListings.filter((l) => {
    const old = existingPriceMap.get(l.boliga_id);
    return old != null && l.price != null && l.price < old;
  });

  // Insert new listings + record initial price + log
  if (newListings.length > 0) {
    const { error: insertError } = await supabase
      .from("listings")
      .insert(newListings.map((l) => ({ ...l, status: "new" })));
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    await Promise.all([
      supabase.from("price_history").insert(
        newListings.map((l) => ({ listing_id: l.boliga_id, price: l.price }))
      ),
      supabase.from("notification_log").insert(
        newListings.map((l) => ({
          title: `Nyt rækkehus i ${l.zip}`,
          body: `${l.address} · ${l.price ? l.price.toLocaleString("da-DK") + " kr." : "—"}`,
          type: "new_listing",
          listing_id: String(l.boliga_id),
        }))
      ),
    ]);

    // Keep max 50 rows
    await supabase.rpc("trim_notification_log");
  }

  // Handle price drops: update listing, record history, reset interactions
  const priceDropResults: { address: string; old: number; new: number }[] = [];
  for (const l of priceDrops) {
    const oldPrice = existingPriceMap.get(l.boliga_id)!;

    const diff = oldPrice - l.price;
    await Promise.all([
      supabase.from("listings").update({
        price: l.price,
        previous_price: oldPrice,
        price_changed_at: new Date().toISOString(),
      }).eq("boliga_id", l.boliga_id),
      supabase.from("price_history").insert({ listing_id: l.boliga_id, price: l.price }),
      supabase.from("listing_interactions").delete().eq("listing_id", l.boliga_id),
      supabase.from("notification_log").insert({
        title: `Prisfald på ${l.zip}-bolig`,
        body: `${l.address} · ↓ ${diff.toLocaleString("da-DK")} kr. (nu ${l.price.toLocaleString("da-DK")} kr.)`,
        type: "price_drop",
        listing_id: String(l.boliga_id),
      }),
    ]);

    priceDropResults.push({ address: l.address, old: oldPrice, new: l.price });
  }

  // Keep url/image fields fresh for existing listings (fixes stale boliga.dk URLs)
  if (existingListings.length > 0) {
    await Promise.all(
      existingListings.map((l) =>
        supabase
          .from("listings")
          .update({ url: l.url, image_url: l.image_url, image_urls: l.image_urls })
          .eq("boliga_id", l.boliga_id)
      )
    );
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
