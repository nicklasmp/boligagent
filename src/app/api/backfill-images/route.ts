export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchBoligsidenMap, fetchNeighborhood } from "@/lib/boliga";

export async function POST() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find all listings missing image_urls OR neighborhood
  const { data: rows, error } = await supabase
    .from("listings")
    .select("boliga_id, address, zip, city, image_url, image_urls, neighborhood")
    .or("image_urls.is.null,neighborhood.is.null");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ updated: 0 });

  // Group by zip and fetch Boligsiden map per zip (usually just one)
  const zips = [...new Set(rows.map((r) => String(r.zip)))];
  const maps = new Map<string, Map<string, string[]>>();
  await Promise.all(zips.map(async (zip) => {
    maps.set(zip, await fetchBoligsidenMap(zip));
  }));

  let updated = 0;
  // Sequential to respect Nominatim 1 req/s rate limit
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const bsMap = maps.get(String(row.zip));

    const updates: Record<string, unknown> = {};

    if (!row.image_urls) {
      let image_urls: string[] = bsMap?.get(row.address.toLowerCase()) ?? [];
      if (image_urls.length === 0 && row.image_url) image_urls = [row.image_url];
      if (image_urls.length > 0) updates.image_urls = image_urls;
    }

    if (!row.neighborhood) {
      const neighborhood = await fetchNeighborhood(row.address, row.zip, row.city ?? "Nyborg");
      updates.neighborhood = neighborhood;
      if (i < rows.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }

    if (Object.keys(updates).length === 0) continue;

    const { error: upErr } = await supabase
      .from("listings")
      .update(updates)
      .eq("boliga_id", row.boliga_id);

    if (!upErr) updated++;
  }

  return NextResponse.json({ updated, total: rows.length });
}
