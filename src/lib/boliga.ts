import { chromium } from "playwright";

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

interface BoligsidenCase {
  roadName: string;
  houseNumber: string;
  zipCode: string;
  images: { imageSources: { url: string; size: { width: number; height: number } }[] }[];
}

interface BoligsidenResponse {
  cases: BoligsidenCase[];
}

export async function fetchBoligsidenImages(
  address: string,
  zip: string
): Promise<string[]> {
  // address from Boliga is typically "Vejnavn 12" — split off house number
  const match = address.match(/^(.+?)\s+(\d+\S*)$/);
  if (!match) return [];
  const [, roadName, houseNumber] = match;

  const url =
    `https://api.boligsiden.dk/search/cases` +
    `?zipCodes=${encodeURIComponent(zip)}` +
    `&roadName=${encodeURIComponent(roadName)}` +
    `&houseNumber=${encodeURIComponent(houseNumber)}` +
    `&per_page=1`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return [];
    const data: BoligsidenResponse = await res.json();
    const c = data.cases?.[0];
    if (!c) return [];

    // Pick the 600x400 variant for each image (good balance of quality vs size)
    return (c.images ?? []).map((img) => {
      const src =
        img.imageSources.find((s) => s.size.width === 600 && s.size.height === 400)?.url ??
        img.imageSources.at(-1)?.url ??
        "";
      return src;
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function mapResult(r: BoligaResult): Omit<Listing, "image_urls"> {
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

export async function fetchListings(
  propertyType = PROPERTY_TYPE,
  zip = ZIP
): Promise<Listing[]> {
  const apiUrl =
    `https://api.boliga.dk/api/v2/search/results` +
    `?propertyType=${propertyType}&zipCodes=${zip}&pageSize=100&page=1&sort=daysForSale-asc`;

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      locale: "da-DK",
      extraHTTPHeaders: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
        Referer: "https://www.boliga.dk/",
      },
    });
    const page = await context.newPage();

    const responsePromise = page.waitForResponse(
      (r) => r.url().startsWith("https://api.boliga.dk/api/v2/search/results"),
      { timeout: 30000 }
    );
    await page.goto(apiUrl, { waitUntil: "commit" });
    const response = await responsePromise;

    if (!response.ok()) {
      throw new Error(`Boliga API ${response.status()}`);
    }

    const data: BoligaResponse = await response.json();
    const base = (data.results ?? []).map(mapResult);

    // Enrich with Boligsiden images in parallel (best-effort)
    // Falls back to Boliga's own image if Boligsiden has no match
    const enriched = await Promise.all(
      base.map(async (l) => {
        let image_urls = await fetchBoligsidenImages(l.address, l.zip);
        if (image_urls.length === 0 && l.image_url) {
          image_urls = [l.image_url];
        }
        return { ...l, image_urls };
      })
    );

    return enriched;
  } finally {
    await browser.close();
  }
}
