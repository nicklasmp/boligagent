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

export async function fetchListings(
  propertyType = PROPERTY_TYPE,
  zip = ZIP
): Promise<Listing[]> {
  const url =
    `https://api.boliga.dk/api/v2/search/results` +
    `?propertyType=${propertyType}&zipCodes=${zip}&pageSize=100&page=1&sort=daysForSale-asc`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Boliga API ${res.status}: ${await res.text()}`);
  }

  const data: BoligaResponse = await res.json();
  return (data.results ?? []).map((r) => ({
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
  }));
}
