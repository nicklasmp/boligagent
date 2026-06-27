const ZIP = process.env.BOLIGA_ZIP ?? "5800";
const PROPERTY_TYPE = process.env.BOLIGA_PROPERTY_TYPE ?? "2";

export interface Listing {
  boliga_id: number;
  address: string;
  zip: string;
  city: string;
  price: number;
  sqm: number | null;
  lot_size: number | null;
  rooms: number | null;
  build_year: number | null;
  energy_class: string | null;
  days_on_market: number | null;
  sqm_price: number | null;
  is_active: boolean;
  boliga_created: string | null;
  url: string;
  image_url: string | null;
  image_urls: string[];
  neighborhood: string | null;
  lat: number | null;
  lon: number | null;
}

interface BoligaResult {
  id: number;
  street: string;
  zipCode: string;
  city: string;
  price: number;
  size: number | null;
  lotSize: number | null;
  rooms: number | null;
  buildYear: number | null;
  energyClass: string | null;
  daysForSale: number | null;
  squaremeterPrice: number | null;
  isActive: boolean;
  createdDate: string | null;
  images: { id: number; url: string }[] | null;
}

interface BoligaResponse {
  results: BoligaResult[];
  meta?: { totalCount?: number };
}

interface BoligsidenImageSource {
  url: string;
  size: { width: number; height: number };
}

interface BoligsidenCase {
  address: {
    roadName: string;
    houseNumber: string;
    zipCode: number;
    slugAddress: string;
  };
  images: { imageSources: BoligsidenImageSource[] }[];
}

interface BoligsidenResponse {
  cases: BoligsidenCase[];
  totalHits: number;
}

function pickImageUrl(img: { imageSources: BoligsidenImageSource[] }): string {
  return (
    img.imageSources.find((s) => s.size.width === 600 && s.size.height === 400)?.url ??
    img.imageSources.at(-1)?.url ??
    ""
  );
}

// Fetch neighborhood + coordinates from Nominatim for a Danish address.
// Nominatim ToS: max 1 req/s.
export async function fetchNeighborhood(
  address: string,
  zip: string,
  city: string
): Promise<{ neighborhood: string | null; lat: number | null; lon: number | null }> {
  try {
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
  } catch {
    return { neighborhood: null, lat: null, lon: null };
  }
}

// Fetch all Boligsiden cases for a zip and return a map keyed by
// lowercase "roadname housenumber" for O(1) lookup per listing.
export async function fetchBoligsidenMap(zip: string): Promise<Map<string, string[]>> {
  const url =
    `https://api.boligsiden.dk/search/cases` +
    `?zipCodes=${encodeURIComponent(zip)}&per_page=200&page=1`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return new Map();
    const data: BoligsidenResponse = await res.json();

    const map = new Map<string, string[]>();
    for (const c of data.cases ?? []) {
      const key = `${c.address.roadName} ${c.address.houseNumber}`.toLowerCase();
      const urls = (c.images ?? []).map(pickImageUrl).filter(Boolean);
      if (urls.length > 0) map.set(key, urls);
    }
    return map;
  } catch {
    return new Map();
  }
}

function mapResult(r: BoligaResult): Omit<Listing, "image_urls" | "neighborhood" | "lat" | "lon"> {
  return {
    boliga_id: r.id,
    address: r.street,
    zip: r.zipCode,
    city: r.city,
    price: r.price,
    sqm: r.size ?? null,
    lot_size: r.lotSize ?? null,
    rooms: r.rooms ?? null,
    build_year: r.buildYear ?? null,
    energy_class: r.energyClass ?? null,
    days_on_market: r.daysForSale ?? null,
    sqm_price: r.squaremeterPrice ?? null,
    is_active: r.isActive ?? true,
    boliga_created: r.createdDate ?? null,
    url: `https://www.boliga.dk/bolig/${r.id}`,
    image_url: r.images?.[0]?.url ?? null,
  };
}

// Called by the POST handler with raw Boliga API JSON (fetched by GitHub Actions)
export function mapBoligaResponse(raw: unknown, boligsidenMap: Map<string, string[]>): Listing[] {
  const data = raw as BoligaResponse;
  return (data.results ?? []).map((r) => {
    const base = mapResult(r);
    const key = base.address.toLowerCase();
    let image_urls = boligsidenMap.get(key) ?? [];
    if (image_urls.length === 0 && base.image_url) image_urls = [base.image_url];
    return { ...base, image_urls, neighborhood: null, lat: null, lon: null };
  });
}
