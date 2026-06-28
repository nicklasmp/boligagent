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
  user_id: string | null;
  event: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UserRow {
  id: string;
  name: string;
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

const DK_TZ = "Europe/Copenhagen";

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
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short", timeZone: DK_TZ });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    weekday: "long", day: "numeric", month: "long", timeZone: DK_TZ,
  });
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("da-DK", {
    hour: "2-digit", minute: "2-digit", timeZone: DK_TZ,
  });
}

function eventDescription(event: string, metadata: Record<string, unknown> | null): string {
  const label = EVENT_LABELS[event] ?? event;
  if (event === "page_view" && metadata?.tab) {
    return `${label}: ${TAB_LABELS[metadata.tab as string] ?? metadata.tab}`;
  }
  if ((event === "listing_liked" || event === "listing_disliked") && metadata?.address) {
    return `${label}: ${metadata.address}`;
  }
  return label;
}

const USER_COLORS: Record<string, string> = {
  nicklas: "#0F4F3C",
  far: "#2563EB",
  mor: "#9333EA",
};

function userColor(name: string) {
  return USER_COLORS[name.toLowerCase()] ?? "#6B7A74";
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const user = await getSessionUserWithName();
  if (!user || user.name.toLowerCase() !== "nicklas") redirect("/");

  const { user: userFilter } = await searchParams;

  const supabase = getSupabase();

  const [{ data: rawEvents }, { data: allUsers }] = await Promise.all([
    supabase
      .from("events")
      .select("id, user_id, event, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("users").select("id, name"),
  ]);

  const events = (rawEvents ?? []) as EventRow[];
  const users = (allUsers ?? []) as UserRow[];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const getUserName = (userId: string | null) =>
    userId ? (userMap.get(userId) ?? "Ukendt") : "Ukendt";

  // Filter by selected user
  const filteredEvents = userFilter
    ? events.filter((e) => getUserName(e.user_id).toLowerCase() === userFilter.toLowerCase())
    : events;

  // Last seen per user (exclude "Ukendt")
  const lastSeen = new Map<string, { name: string; time: string }>();
  for (const e of events) {
    const name = getUserName(e.user_id);
    if (name !== "Ukendt" && !lastSeen.has(name)) {
      lastSeen.set(name, { name, time: e.created_at });
    }
  }

  // Today's action counts per user (exclude page_views), DK midnight
  const nowDK = new Date(new Date().toLocaleString("en-US", { timeZone: DK_TZ }));
  nowDK.setHours(0, 0, 0, 0);
  const todayStartUTC = new Date(nowDK.getTime() - nowDK.getTimezoneOffset() * 60000);

  const actionCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event === "page_view") continue;
    if (new Date(e.created_at) < todayStartUTC) continue;
    const name = getUserName(e.user_id);
    if (name === "Ukendt") continue;
    actionCounts.set(name, (actionCounts.get(name) ?? 0) + 1);
  }

  // Group filtered events by DK date
  type EnrichedEvent = EventRow & { userName: string };
  const groups: { date: string; events: EnrichedEvent[] }[] = [];
  let currentDate = "";
  for (const e of filteredEvents) {
    const date = formatDate(e.created_at);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, events: [] });
    }
    groups[groups.length - 1].events.push({ ...e, userName: getUserName(e.user_id) });
  }

  const uniqueUserNames = [
    ...new Set(
      events.map((e) => getUserName(e.user_id)).filter((n) => n !== "Ukendt")
    ),
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF9]">
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1] flex items-center px-4 gap-3">
        <a href="/" style={{ color: "#6B7A74", fontSize: 13, textDecoration: "none" }}>← Tilbage</a>
        <span style={{ color: "#DCE5E1" }}>|</span>
        <h1 className="font-semibold text-[#0E1512] text-base">Aktivitet</h1>
      </header>

      <main className="pt-20 pb-10 px-4 max-w-xl mx-auto">

        {/* Last seen cards */}
        <div className="flex gap-3 mb-5">
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

        {/* User filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <a
            href="/tracking"
            style={{
              fontSize: 13, fontWeight: 500, padding: "5px 14px",
              borderRadius: 99, textDecoration: "none",
              background: !userFilter ? "#0F4F3C" : "white",
              color: !userFilter ? "white" : "#6B7A74",
              border: `1px solid ${!userFilter ? "#0F4F3C" : "#DCE5E1"}`,
            }}
          >
            Alle
          </a>
          {uniqueUserNames.map((name) => {
            const active = userFilter?.toLowerCase() === name.toLowerCase();
            return (
              <a
                key={name}
                href={`/tracking?user=${encodeURIComponent(name)}`}
                style={{
                  fontSize: 13, fontWeight: 500, padding: "5px 14px",
                  borderRadius: 99, textDecoration: "none",
                  background: active ? userColor(name) : "white",
                  color: active ? "white" : "#6B7A74",
                  border: `1px solid ${active ? userColor(name) : "#DCE5E1"}`,
                }}
              >
                {name}
              </a>
            );
          })}
        </div>

        {/* Event feed */}
        {groups.map(({ date, events: groupEvents }) => (
          <div key={date} className="mb-6">
            <div
              style={{
                fontSize: 11, fontWeight: 600, color: "#9AA7A1",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
              }}
            >
              {date}
            </div>
            <div className="rounded-2xl border border-[#DCE5E1] bg-white overflow-hidden divide-y divide-[#F0F5F3]">
              {groupEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: userColor(e.userName),
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span style={{ fontSize: 13, color: "#0E1512" }}>
                      {eventDescription(e.event, e.metadata)}
                    </span>
                    {!userFilter && (
                      <span style={{ fontSize: 12, color: "#9AA7A1", marginLeft: 6 }}>
                        — {e.userName}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#B0BDB8", flexShrink: 0 }}>
                    {formatClock(e.created_at)}
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
