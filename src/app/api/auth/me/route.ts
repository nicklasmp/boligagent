import { NextResponse } from "next/server";
import { getSessionMeta } from "@/lib/auth";

export async function GET() {
  const meta = await getSessionMeta();
  if (!meta) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(meta);
}
