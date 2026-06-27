const ZIP = process.env.BOLIGA_ZIP ?? "5800";

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

interface ImageSource {
  url: string;
  size: { width: number; height: number };
}

interface BoligsidenCase {
  caseID: string;
  addressType: string;
  priceCash: number;
  housingArea: number | null;
  lotArea: number | null;
  numberOfRooms: number | null;
  yearBuilt: number | null;
  daysListed: { days: number } | null;
  energyLabel: string | null;
  perAreaPrice: number | null;
  slugAddress: string;
  caseUrl: string;
  images: { imageSources: ImageSource[] }[];
  coordinates: { lat: number; lon: number } | null;
  address: {
    roadName: string;
    houseNumber: string;
    zipCode: number;
    cityName: string;
    placeName?: string;
  };
}

interface BoligsidenResponse {
  cases: BoligsidenCase[];
  totalHits: number;
}

// Kept for backfill of old Boliga rows — fetches images from Boligsiden by address key
export async function fetchBoligsidenMap(zip: string): Promise<Map<string, string[]>> {
  const url = `https://api.boligsiden.dk/search/cases?zipCodes=${encodeURIComponent(zip)}&per_page=200&page=1`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return new Map();
    const data: BoligsidenResponse = await res.json();
    const map = new Map<string, string[]>();
    for (const c of data.cases ?? []) {
      const key = `${c.address.roadName} ${c.address.houseNumber}`.toLowerCase();
      const urls = (c.images ?? []).map((img) => pickBestImage(img.imageSources)).filter(Boolean);
      if (urls.length > 0) map.set(key, urls);
    }
    return map;
  } catch {
    return new Map();
  }
}

// Kept for backfill of old Boliga rows — Boligsiden provides coordinates directly
export async function fetchNeighborhood(
  address: string, zip: string, city: string
): Promise<{ neighborhood: string | null; lat: number | null; lon: number | null }> {
  try {
    const q = `${address}, ${zip} ${city}, Denmark`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`,
      { headers: { "User-Agent": "Boligagent/1.0 (nicklas-pedersen@outlook.com)" } }
    );
    if (!res.ok) return { neighborhood: null, lat: null, lon: null };
    const data = await res.json();
    const hit = data[0];
    if (!hit) return { neighborhood: null, lat: null, lon: null };
    const a = hit.address;
    return { neighborhood: a?.neighbourhood ?? a?.hamlet ?? null, lat: parseFloat(hit.lat), lon: parseFloat(hit.lon) };
  } catch {
    return { neighborhood: null, lat: null, lon: null };
  }
}

function pickBestImage(sources: ImageSource[]): string {
  return (
    sources.find((s) => s.size.width === 600 && s.size.height === 400)?.url ??
    sources.at(-1)?.url ??
    ""
  );
}

// Stable numeric ID from Boligsiden caseID (UUID → first 12 hex chars → integer)
// Safe within JS Number precision and PostgreSQL bigint range.
function caseIdToInt(caseID: string): number {
  return parseInt(caseID.replace(/-/g, "").slice(0, 12), 16);
}

function mapCase(c: BoligsidenCase): Listing {
  const imageUrls = (c.images ?? [])
    .map((img) => pickBestImage(img.imageSources))
    .filter(Boolean);

  return {
    boliga_id: caseIdToInt(c.caseID),
    address: `${c.address.roadName} ${c.address.houseNumber}`,
    zip: String(c.address.zipCode),
    city: c.address.cityName,
    price: c.priceCash,
    sqm: c.housingArea ?? null,
    lot_size: c.lotArea ?? null,
    rooms: c.numberOfRooms ?? null,
    build_year: c.yearBuilt ?? null,
    energy_class: c.energyLabel ?? null,
    days_on_market: c.daysListed?.days ?? null,
    sqm_price: c.perAreaPrice ?? null,
    is_active: true,
    boliga_created: null,
    url: `https://www.boligsiden.dk/adresse/${c.slugAddress}`,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    neighborhood: c.address.placeName ?? null,
    lat: c.coordinates?.lat ?? null,
    lon: c.coordinates?.lon ?? null,
  };
}

export async function fetchListings(zip = ZIP): Promise<Listing[]> {
  const url =
    `https://api.boligsiden.dk/search/cases` +
    `?zipCodes=${encodeURIComponent(zip)}&per_page=200&page=1`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) throw new Error(`Boligsiden API ${res.status}`);

  const text = await res.text();
  // Throw with raw response so we can see what Boligsiden returns from Vercel
  let data: BoligsidenResponse;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Boligsiden parse error. Body: ${text.slice(0, 500)}`);
  }

  const all = data.cases ?? [];
  const types = [...new Set(all.map((c) => c.addressType))];
  if (all.length === 0) {
    throw new Error(`Boligsiden returned 0 cases. totalHits=${data.totalHits}. Body preview: ${text.slice(0, 300)}`);
  }

  return all
    .filter((c) => c.addressType === "terraced house")
    .map(mapCase);
}
