import { createClient } from "@supabase/supabase-js";

export type ListingStatus = "new" | "liked" | "disliked";

export interface ListingRow {
  boliga_id: number;
  address: string;
  zip: string;
  city: string;
  price: number | null;
  sqm: number | null;
  rooms: number | null;
  energy_class: string | null;
  days_on_market: number | null;
  url: string;
  image_url: string | null;
  status: ListingStatus;
  created_at: string;
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getListings(status: ListingStatus): Promise<ListingRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select("boliga_id,address,zip,city,price,sqm,rooms,energy_class,days_on_market,url,image_url,status,created_at")
    .eq("status", status)
    .order("days_on_market", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ListingRow[];
}

export async function getCounts(): Promise<Record<ListingStatus, number>> {
  const supabase = getSupabase();
  const [r1, r2, r3] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "liked"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "disliked"),
  ]);
  return {
    new: r1.count ?? 0,
    liked: r2.count ?? 0,
    disliked: r3.count ?? 0,
  };
}
