import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkAdmin(req: NextRequest) {
  const adminPin = req.headers.get("x-admin-pin");
  return adminPin === process.env.ADMIN_PIN;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  const { data } = await supabase.from("users").select("id, name, created_at").order("created_at");
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });

  const { name, pin } = await req.json();
  if (!name || !pin || pin.length !== 4) {
    return NextResponse.json({ error: "Navn og 4-cifret PIN er påkrævet" }, { status: 400 });
  }

  const pin_hash = await bcrypt.hash(pin, 12);
  const { error } = await supabase.from("users").insert({ name, pin_hash });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });

  const { id, pin } = await req.json();
  if (!id || !pin || pin.length !== 4) {
    return NextResponse.json({ error: "ID og 4-cifret PIN er påkrævet" }, { status: 400 });
  }

  const pin_hash = await bcrypt.hash(pin, 12);
  const { error } = await supabase.from("users").update({ pin_hash }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
