export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchListings } from "@/lib/boliga";
import webpush from "web-push";

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
    .select("boliga_id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const existingIds = new Set((existing ?? []).map((r) => r.boliga_id));
  const newListings = listings.filter((l) => !existingIds.has(l.boliga_id));

  if (newListings.length > 0) {
    const { error: insertError } = await supabase
      .from("listings")
      .insert(newListings.map((l) => ({ ...l, status: "new" })));

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

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
        title: `${newListings.length === 1 ? "Nyt rækkehus" : `${newListings.length} nye rækkehuse`} i ${process.env.BOLIGA_ZIP ?? "5800"}`,
        body: newListings[0].address,
        url: newListings[0].url,
      });

      await Promise.allSettled(
        prefs.map(async (pref) => {
          try {
            await webpush.sendNotification(
              { endpoint: pref.push_subscription.endpoint, keys: pref.push_subscription.keys },
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

  return NextResponse.json({
    checked: listings.length,
    new: newListings.length,
    addresses: newListings.map((l) => l.address),
  });
}
