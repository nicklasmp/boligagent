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
  image_url: string;
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
}

interface BoligaResponse {
  results: BoligaResult[];
  meta?: { totalCount?: number };
}

function mapResult(r: BoligaResult): Listing {
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
    image_url: `https://i.boliga.dk/dia/300/${r.id}.jpg`,
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
    return (data.results ?? []).map(mapResult);
  } finally {
    await browser.close();
  }
}
