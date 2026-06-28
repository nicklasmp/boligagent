// Standalone backfill script — run with: node scripts/backfill-coords.mjs
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchNeighborhood(address, zip, city) {
  const q = `${address}, ${zip} ${city}, Denmark`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Boligagent/1.0 (nicklas-pedersen@outlook.com)" },
  });
  if (!res.ok) return { neighborhood: null, lat: null, lon: null };
  const data = await res.json();
  const hit = data[0];
  if (!hit) return { neighborhood: null, lat: null, lon: null };
  const a = hit.address;
  return {
    neighborhood: a?.neighbourhood ?? a?.hamlet ?? null,
    lat: hit.lat ? parseFloat(hit.lat) : null,
    lon: hit.lon ? parseFloat(hit.lon) : null,
  };
}

const { data: rows, error } = await supabase
  .from("listings")
  .select("boliga_id, address, zip, city, neighborhood, lat")
  .or("lat.is.null,neighborhood.is.null");

if (error) { console.error(error.message); process.exit(1); }
if (!rows.length) { console.log("Alle listings har allerede koordinater."); process.exit(0); }

console.log(`Backfiller ${rows.length} listings...\n`);

let updated = 0;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  process.stdout.write(`[${i + 1}/${rows.length}] ${row.address} ... `);

  const { neighborhood, lat, lon } = await fetchNeighborhood(row.address, row.zip, row.city ?? "Nyborg");

  const updates = {};
  if (!row.neighborhood && neighborhood) updates.neighborhood = neighborhood;
  if (!row.lat && lat) { updates.lat = lat; updates.lon = lon; }

  if (Object.keys(updates).length === 0) {
    console.log("ingen data fra Nominatim");
  } else {
    const { error: upErr } = await supabase
      .from("listings")
      .update(updates)
      .eq("boliga_id", row.boliga_id);

    if (upErr) {
      console.log(`FEJL: ${upErr.message}`);
    } else {
      console.log(`OK (lat=${lat?.toFixed(4)}, lon=${lon?.toFixed(4)})`);
      updated++;
    }
  }

  if (i < rows.length - 1) await new Promise((r) => setTimeout(r, 1100));
}

console.log(`\nFærdig: ${updated}/${rows.length} opdateret.`);
