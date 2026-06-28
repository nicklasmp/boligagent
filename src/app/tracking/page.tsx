export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionUserWithName } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface EventRow {
  id: string;
  event: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  users: { name: string }[] | null;
}

const EVENT_LABELS: Record<string, string> = {
  session_start: "Loggede ind",
  page_view: "Åbnede fane",
  listing_liked: "Gemte bolig",
  listing_disliked: "Afviste bolig",
  listing_reset: "Nulstillede bolig",
};

const TAB_LABELS: Record<string, string> = {
  new: "Nye",
  liked: "Gemte",
  disliked: "Nej tak",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "Lige nu";
  if (diffMin < 60) return `${diffMin} min siden`;
  if (diffH < 24) return `${diffH} t siden`;
  if (diffD === 1) return "I går";
  if (diffD < 7) return `${diffD} dage siden`;
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function eventDescription(row: EventRow): string {
  const label = EVENT_LABELS[row.event] ?? row.event;
  const meta = row.metadata;
  if (row.event === "page_view" && meta?.tab) {
    return `${label}: ${TAB_LABELS[meta.tab as string] ?? meta.tab}`;
  }
  if ((row.event === "listing_liked" || row.event === "listing_disliked") && meta?.address) {
    return `${label}: ${meta.address}`;
  }
  return label;
}

export default async function TrackingPage() {
  const user = await getSessionUserWithName();
  if (!user || user.name.toLowerCase() !== "nicklas") redirect("/");

  const supabase = getSupabase();

  const { data: rawEvents } = await supabase
    .from("events")
    .select("id, event, metadata, created_at, users(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const events = (rawEvents ?? []) as EventRow[];

  // Last seen per user
  const lastSeen = new Map<string, { name: string; time: string }>();
  for (const e of events) {
    const name = e.users?.[0]?.name;
    if (name && !lastSeen.has(name)) lastSeen.set(name, { name, time: e.created_at });
  }

  // Today's action counts per user (exclude page_views)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const actionCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event === "page_view") continue;
    if (new Date(e.created_at) < todayStart) continue;
    const name = e.users?.[0]?.name ?? "Ukendt";
    actionCounts.set(name, (actionCounts.get(name) ?? 0) + 1);
  }

  // Group events by date
  const groups: { date: string; events: EventRow[] }[] = [];
  let currentDate = "";
  for (const e of events) {
    const date = formatDate(e.created_at);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, events: [] });
    }
    groups[groups.length - 1].events.push(e);
  }

  const userColors: Record<string, string> = {
    nicklas: "#0F4F3C",
    default: "#6B7A74",
  };
  function userColor(name: string) {
    return userColors[name.toLowerCase()] ?? userColors.default;
  }

  return (
    <div className="min-h-screen bg-[#F7FAF9]">
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1] flex items-center px-4 gap-3">
        <a href="/" style={{ color: "#6B7A74", fontSize: 13, textDecoration: "none" }}>← Tilbage</a>
        <span style={{ color: "#DCE5E1" }}>|</span>
        <h1 className="font-semibold text-[#0E1512] text-base">Aktivitet</h1>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-xl mx-auto">

        {/* Last seen cards */}
        <div className="flex gap-3 mb-6">
          {[...lastSeen.values()].map(({ name, time }) => (
            <div
              key={name}
              className="flex-1 rounded-2xl border border-[#DCE5E1] bg-white p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: userColor(name), flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0E1512" }}>{name}</span>
              </div>
              <div style={{ fontSize: 12, color: "#9AA7A1" }}>Sidst set</div>
              <div style={{ fontSize: 13, color: "#6B7A74", marginTop: 2 }}>{formatTime(time)}</div>
              {actionCounts.has(name) && (
                <div style={{ fontSize: 12, color: "#52B888", marginTop: 4 }}>
                  {actionCounts.get(name)} handlinger i dag
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Event feed */}
        {groups.map(({ date, events: groupEvents }) => (
          <div key={date} className="mb-6">
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9AA7A1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              {date}
            </div>
            <div className="rounded-2xl border border-[#DCE5E1] bg-white overflow-hidden divide-y divide-[#F0F5F3]">
              {groupEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: userColor(e.users?.[0]?.name ?? ""),
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: 13, color: "#0E1512" }}>
                      {eventDescription(e)}
                    </span>
                    <span style={{ fontSize: 12, color: "#9AA7A1", marginLeft: 6 }}>
                      — {e.users?.[0]?.name ?? "Ukendt"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#B0BDB8", flexShrink: 0 }}>
                    {new Date(e.created_at).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-16 text-[#9AA7A1] text-sm">
            Ingen aktivitet endnu.
          </div>
        )}
      </main>
    </div>
  );
}
