export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mapBoligaResponse, fetchBoligsidenMap, fetchNeighborhood } from "@/lib/boliga";
import webpush from "web-push";

function auth(req: NextRequest) {
  return req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

async function processListings(rawData: unknown) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const zip = process.env.BOLIGA_ZIP ?? "5800";
  const boligsidenMap = await fetchBoligsidenMap(zip);
  const listings = mapBoligaResponse(rawData, boligsidenMap);

  const { data: existing, error } = await supabase
    .from("listings")
    .select("boliga_id, image_urls");

  if (error) throw new Error(error.message);

  const existingMap = new Map(
    (existing ?? []).map((r) => [r.boliga_id, r.image_urls])
  );

  const newListings = listings.filter((l) => !existingMap.has(l.boliga_id));
  const toBackfill = listings.filter(
    (l) => existingMap.has(l.boliga_id) && !existingMap.get(l.boliga_id) && l.image_urls.length > 0
  );

  if (newListings.length > 0) {
    const withNeighborhoods = [];
    for (let i = 0; i < newListings.length; i++) {
      const l = newListings[i];
      const { neighborhood, lat, lon } = await fetchNeighborhood(l.address, l.zip, l.city);
      withNeighborhoods.push({ ...l, neighborhood, lat, lon, status: "new" });
      if (i < newListings.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }

    const { error: insertError } = await supabase.from("listings").insert(withNeighborhoods);
    if (insertError) throw new Error(insertError.message);

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("push_subscription")
      .not("push_subscription", "is", null);

    if (prefs && prefs.length > 0) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT!,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      const payload = JSON.stringify({
        title: `${newListings.length === 1 ? "Nyt rækkehus" : `${newListings.length} nye rækkehuse`} i 5800`,
        body: newListings[0].address,
        url: newListings[0].url,
      });

      await Promise.allSettled(
        prefs.map(async (pref) => {
          const sub = pref.push_subscription;
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              payload
            );
          } catch (err: unknown) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status !== 404 && status !== 410) console.error("[push] Failed:", err);
          }
        })
      );
    }
  }

  if (toBackfill.length > 0) {
    await Promise.allSettled(
      toBackfill.map((l) =>
        supabase.from("listings").update({ image_urls: l.image_urls }).eq("boliga_id", l.boliga_id)
      )
    );
  }

  return { checked: listings.length, new: newListings.length, backfilled: toBackfill.length };
}

// POST: called by GitHub Actions with raw Boliga API response body
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rawData = await req.json();
    const result = await processListings(rawData);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: kept for manual triggers (fetches Boliga directly — only works from non-blocked IPs)
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    { error: "Use POST with Boliga API data, or trigger via GitHub Actions" },
    { status: 405 }
  );
}
