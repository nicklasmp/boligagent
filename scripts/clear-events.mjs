// Run with: node scripts/clear-events.mjs
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

const { error, count } = await supabase
  .from("events")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000");

if (error) {
  console.error("Fejl:", error.message);
  process.exit(1);
}

console.log(`Slettet ${count ?? "alle"} rækker fra events-tabellen.`);
