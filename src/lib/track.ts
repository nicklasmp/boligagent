import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function logEvent(
  userId: string,
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await getSupabase().from("events").insert({ user_id: userId, event, metadata });
}
