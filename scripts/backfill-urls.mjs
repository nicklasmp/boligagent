// Fixes stale boliga.dk URLs in the listings table.
// Run with: node scripts/backfill-urls.mjs
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

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

// Fetch current Boligsiden data
const apiUrl =
  "https://api.boligsiden.dk/search/cases?zipCodes=5800&per_page=500&page=1&addressTypes=terraced%20house";
const res = await fetch(apiUrl, {
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});
if (!res.ok) { console.error("Boligsiden API fejlede:", res.status); process.exit(1); }
const data = await res.json();
const cases = (data.cases ?? []).filter((c) => c.addressType === "terraced house");
console.log(`Hentet ${cases.length} cases fra Boligsiden`);

// Build lookup: address (lower) → boligsiden URL
const urlByAddress = new Map();
for (const c of cases) {
  const addr = `${c.address.roadName} ${c.address.houseNumber}`.toLowerCase();
  urlByAddress.set(addr, `https://www.boligsiden.dk/adresse/${c.slugAddress}`);
}

// Fetch all DB listings with boliga.dk URLs
const { data: stale, error } = await supabase
  .from("listings")
  .select("boliga_id, address, url")
  .ilike("url", "%boliga.dk%");

if (error) { console.error("DB fejl:", error.message); process.exit(1); }
console.log(`Fandt ${stale.length} listings med boliga.dk URL`);

let updated = 0;
let notFound = 0;
for (const row of stale) {
  const key = row.address.toLowerCase();
  const newUrl = urlByAddress.get(key);
  if (!newUrl) { notFound++; continue; }

  const { error: upErr } = await supabase
    .from("listings")
    .update({ url: newUrl })
    .eq("boliga_id", row.boliga_id);

  if (upErr) { console.error(`Fejl ved ${row.address}:`, upErr.message); }
  else { console.log(`  ✓ ${row.address}  →  ${newUrl}`); updated++; }
}

console.log(`\nOpdateret: ${updated}  |  Ingen match fundet: ${notFound}`);
