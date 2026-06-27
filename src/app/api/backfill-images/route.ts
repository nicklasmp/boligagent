export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchBoligsidenMap } from "@/lib/boliga";

export async function POST() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find all listings missing image_urls
  const { data: rows, error } = await supabase
    .from("listings")
    .select("boliga_id, address, zip, image_url")
    .is("image_urls", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ updated: 0 });

  // Group by zip and fetch Boligsiden map per zip (usually just one)
  const zips = [...new Set(rows.map((r) => String(r.zip)))];
  const maps = new Map<string, Map<string, string[]>>();
  await Promise.all(zips.map(async (zip) => {
    maps.set(zip, await fetchBoligsidenMap(zip));
  }));

  let updated = 0;
  await Promise.allSettled(
    rows.map(async (row) => {
      const bsMap = maps.get(String(row.zip));
      let image_urls: string[] = bsMap?.get(row.address.toLowerCase()) ?? [];
      if (image_urls.length === 0 && row.image_url) {
        image_urls = [row.image_url];
      }
      if (image_urls.length === 0) return;

      const { error } = await supabase
        .from("listings")
        .update({ image_urls })
        .eq("boliga_id", row.boliga_id);

      if (!error) updated++;
    })
  );

  return NextResponse.json({ updated, total: rows.length });
}
