import { NextResponse } from "next/server";
import { getSessionUserWithName } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUserWithName();
  if (!user) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(user);
}
