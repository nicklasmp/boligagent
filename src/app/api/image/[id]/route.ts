export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const CANDIDATE_URLS = (id: string) => [
  `https://i.boliga.dk/dia/300/${id}.jpg`,
  `https://i.boliga.dk/dia/400/${id}.jpg`,
  `https://i.boliga.dk/dia/600/${id}.jpg`,
]

const HEADERS = {
  Referer: "https://www.boliga.dk/",
  Origin: "https://www.boliga.dk",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "da-DK,da;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "sec-fetch-dest": "image",
  "sec-fetch-mode": "no-cors",
  "sec-fetch-site": "same-site",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  for (const url of CANDIDATE_URLS(id)) {
    let upstream: Response
    try {
      upstream = await fetch(url, { headers: HEADERS })
    } catch {
      continue
    }

    if (!upstream.ok) continue

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) continue

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  return new NextResponse(null, { status: 404 });
}
