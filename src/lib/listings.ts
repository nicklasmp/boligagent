import { createClient } from "@supabase/supabase-js";

export type ListingStatus = "new" | "liked" | "disliked";

export interface ListingRow {
  boliga_id: number;
  address: string;
  zip: string;
  city: string;
  price: number | null;
  sqm: number | null;
  lot_size: number | null;
  rooms: number | null;
  build_year: number | null;
  energy_class: string | null;
  days_on_market: number | null;
  sqm_price: number | null;
  neighborhood: string | null;
  lat: number | null;
  lon: number | null;
  url: string;
  image_url: string | null;
  image_urls: string[] | null;
  status: ListingStatus;
  note: string | null;
  created_at: string;
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getListings(userId: string, status: ListingStatus): Promise<ListingRow[]> {
  const supabase = getSupabase();
  const [{ data: listings, error }, { data: interactions }] = await Promise.all([
    supabase
      .from("listings")
      .select("boliga_id,address,zip,city,price,sqm,lot_size,rooms,build_year,energy_class,days_on_market,sqm_price,neighborhood,lat,lon,url,image_url,image_urls,created_at")
      .order("days_on_market", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("listing_interactions")
      .select("listing_id, status, note")
      .eq("user_id", userId),
  ]);

  if (error) throw new Error(error.message);

  const interactionMap = new Map(
    (interactions ?? []).map((i) => [i.listing_id, i])
  );

  return (listings ?? [])
    .filter((l) => {
      const interaction = interactionMap.get(l.boliga_id);
      return (interaction?.status ?? "new") === status;
    })
    .map((l) => {
      const interaction = interactionMap.get(l.boliga_id);
      return {
        ...l,
        status: (interaction?.status ?? "new") as ListingStatus,
        note: interaction?.note ?? null,
      };
    });
}

export async function getCounts(userId: string): Promise<Record<ListingStatus, number>> {
  const supabase = getSupabase();
  const [{ count: total }, { data: interactions }] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase
      .from("listing_interactions")
      .select("listing_id, status")
      .eq("user_id", userId),
  ]);

  const liked = (interactions ?? []).filter((i) => i.status === "liked").length;
  const disliked = (interactions ?? []).filter((i) => i.status === "disliked").length;
  const newCount = (total ?? 0) - liked - disliked;

  return { new: newCount, liked, disliked };
}
