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
  listing_liked: "Gemte bolig",
  listing_disliked: "Afviste bolig",
  listing_reset: "Nulstillede bolig",
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

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("da-DK", {
    hour: "2-digit", minute: "2-digit", timeZone: DK_TZ,
  });
}

function formatSessionHeader(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const clock = formatClock(iso);

  // Compare DK calendar dates
  const dDK = d.toLocaleDateString("da-DK", { timeZone: DK_TZ });
  const nowDK = now.toLocaleDateString("da-DK", { timeZone: DK_TZ });
  const yesterdayDK = new Date(now.getTime() - 86400000).toLocaleDateString("da-DK", { timeZone: DK_TZ });

  if (dDK === nowDK) return `I dag kl. ${clock}`;
  if (dDK === yesterdayDK) return `I går kl. ${clock}`;
  return `${d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "short", timeZone: DK_TZ })} kl. ${clock}`;
}

function eventLabel(event: string, metadata: Record<string, unknown> | null): string {
  const label = EVENT_LABELS[event] ?? event;
  if ((event === "listing_liked" || event === "listing_disliked") && metadata?.address) {
    return `${label}: ${metadata.address as string}`;
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

// ── Session building ─────────────────────────────────────────────────────────

interface CollapsedItem {
  event: string;
  metadata: Record<string, unknown> | null;
  count: number;
  time: string;
}

interface SessionGroup {
  id: string;
  userName: string;
  startTime: string;
  items: CollapsedItem[];
  pageViewCount: number;
}

function buildSessions(
  events: EventRow[],
  getUserName: (id: string | null) => string
): SessionGroup[] {
  // Events arrive DESC from DB — process in chronological order
  const asc = [...events].reverse();
  const sessions: SessionGroup[] = [];
  let current: SessionGroup | null = null;

  for (const e of asc) {
    const userName = getUserName(e.user_id);

    if (e.event === "session_start") {
      current = { id: e.id, userName, startTime: e.created_at, items: [], pageViewCount: 0 };
      sessions.push(current);
      continue;
    }

    // Ensure we have a bucket
    if (!current) {
      current = { id: `implicit-${e.id}`, userName, startTime: e.created_at, items: [], pageViewCount: 0 };
      sessions.push(current);
    }

    if (e.event === "page_view") {
      current.pageViewCount++;
      continue;
    }

    // Collapse consecutive same event type
    const last = current.items[current.items.length - 1];
    if (last && last.event === e.event) {
      last.count++;
    } else {
      current.items.push({ event: e.event, metadata: e.metadata, count: 1, time: e.created_at });
    }
  }

  // Return newest first
  return sessions.reverse();
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const user = await getSessionUserWithName();
  if (!user || user.name.toLowerCase() !== "nicklas") redirect("/");

  const { user: userFilter } = await searchParams;
  const activeUser = userFilter ?? null;

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
  const getUserName = (id: string | null) => (id ? (userMap.get(id) ?? "Ukendt") : "Ukendt");

  const uniqueUserNames = [
    ...new Set(events.map((e) => getUserName(e.user_id)).filter((n) => n !== "Ukendt")),
  ];

  // Last seen + today action counts (across all events, unfiltered)
  const lastSeen = new Map<string, { name: string; time: string }>();
  for (const e of events) {
    const name = getUserName(e.user_id);
    if (name !== "Ukendt" && !lastSeen.has(name)) lastSeen.set(name, { name, time: e.created_at });
  }

  const nowDK = new Date(new Date().toLocaleString("en-US", { timeZone: DK_TZ }));
  nowDK.setHours(0, 0, 0, 0);
  const todayStartUTC = new Date(nowDK.getTime() - nowDK.getTimezoneOffset() * 60000);
  const actionCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event === "page_view" || e.event === "session_start") continue;
    if (new Date(e.created_at) < todayStartUTC) continue;
    const name = getUserName(e.user_id);
    if (name === "Ukendt") continue;
    actionCounts.set(name, (actionCounts.get(name) ?? 0) + 1);
  }

  // Build and filter sessions
  const allSessions = buildSessions(events, getUserName);
  const sessions = activeUser
    ? allSessions.filter((s) => s.userName.toLowerCase() === activeUser.toLowerCase())
    : allSessions;

  const tabs = [
    { key: null, label: "Alle", href: "/tracking" },
    ...uniqueUserNames.map((name) => ({
      key: name,
      label: name,
      href: `/tracking?user=${encodeURIComponent(name)}`,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF9]">
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1] flex items-center px-4 gap-3">
        <a href="/" style={{ color: "#6B7A74", fontSize: 13, textDecoration: "none" }}>← Tilbage</a>
        <span style={{ color: "#DCE5E1" }}>|</span>
        <h1 className="font-semibold text-[#0E1512] text-base">Aktivitet</h1>
      </header>

      {/* User tabs */}
      <nav className="fixed top-14 left-0 right-0 z-30 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1]">
        <div className="flex max-w-2xl mx-auto">
          {tabs.map(({ key, label, href }) => {
            const active = (activeUser?.toLowerCase() ?? null) === (key?.toLowerCase() ?? null);
            return (
              <a
                key={label}
                href={href}
                className="flex-1 flex items-center justify-center h-11 text-sm font-medium relative"
                style={{ color: active ? "#0F4F3C" : "#6B7A74", textDecoration: "none" }}
              >
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 left-4 right-4 rounded-full"
                    style={{ height: 2, background: key ? userColor(key) : "#0F4F3C" }}
                  />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      <main className="pt-[116px] pb-10 px-4 max-w-2xl mx-auto">

        {/* Summary cards */}
        {!activeUser ? (
          <div className="flex gap-3 mb-6">
            {[...lastSeen.values()].map(({ name, time }) => (
              <div key={name} className="flex-1 rounded-2xl border border-[#DCE5E1] bg-white p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: userColor(name), flexShrink: 0 }} />
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
        ) : lastSeen.has(activeUser) ? (() => {
          const { name, time } = lastSeen.get(activeUser)!;
          return (
            <div className="rounded-2xl border border-[#DCE5E1] bg-white p-4 mb-6 flex items-center gap-4">
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: userColor(name), flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: "#9AA7A1" }}>Sidst set</div>
                <div style={{ fontSize: 13, color: "#6B7A74" }}>{formatTime(time)}</div>
              </div>
              {actionCounts.has(name) && (
                <div style={{ marginLeft: "auto", fontSize: 12, color: "#52B888" }}>
                  {actionCounts.get(name)} handlinger i dag
                </div>
              )}
            </div>
          );
        })() : null}

        {/* Session feed */}
        <div className="flex flex-col gap-4">
          {sessions.map((session) => {
            const hasActions = session.items.length > 0;
            const hasViews = session.pageViewCount > 0;
            if (!hasActions && !hasViews) return null;

            return (
              <div key={session.id} className="rounded-2xl border border-[#DCE5E1] bg-white overflow-hidden">
                {/* Session header */}
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F5F3]"
                  style={{ background: "#FAFCFB" }}
                >
                  {!activeUser && (
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: userColor(session.userName), flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7A74" }}>
                    {!activeUser && `${session.userName} · `}{formatSessionHeader(session.startTime)}
                  </span>
                </div>

                {/* Actions */}
                {hasActions && (
                  <div className="divide-y divide-[#F0F5F3]">
                    {session.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <span style={{ fontSize: 13, color: "#0E1512" }}>
                            {eventLabel(item.event, item.metadata)}
                          </span>
                          {item.count > 1 && (
                            <span
                              className="inline-flex items-center justify-center rounded-full ml-2"
                              style={{ fontSize: 11, fontWeight: 600, color: "#6B7A74", background: "#EEF2F0", padding: "1px 7px" }}
                            >
                              × {item.count}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#B0BDB8", flexShrink: 0 }}>
                          {formatClock(item.time)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Page view footer */}
                {hasViews && (
                  <div
                    className="px-4 py-2"
                    style={{ borderTop: hasActions ? "1px solid #F0F5F3" : undefined }}
                  >
                    <span style={{ fontSize: 11, color: "#B0BDB8" }}>
                      {session.pageViewCount} fane-skift
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-16 text-[#9AA7A1] text-sm">
            Ingen aktivitet endnu.
          </div>
        )}
      </main>
    </div>
  );
}
