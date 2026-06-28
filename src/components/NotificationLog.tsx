"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  title: string;
  body: string | null;
  type: "new_listing" | "price_drop";
  listing_id: string | null;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Lige nu";
  if (min < 60) return `${min}m siden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}t siden`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d siden`;
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function NewListingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PriceDropIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="flex gap-3 py-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: "#EDF2F0" }} />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-3 rounded-full w-2/3" style={{ background: "#EDF2F0" }} />
        <div className="h-2.5 rounded-full w-1/2" style={{ background: "#EDF2F0" }} />
      </div>
    </div>
  );
}

export default function NotificationLog() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);

  useEffect(() => {
    fetch("/api/notification-log")
      .then((r) => r.ok ? r.json() : [])
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return (
      <div className="rounded-2xl border border-[#DCE5E1] bg-white overflow-hidden divide-y divide-[#F0F5F3] px-4">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DCE5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <p className="text-[13px] text-[#9AA7A1] max-w-xs leading-relaxed">
          Ingen aktivitet endnu — polleren holder øje med markedet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#DCE5E1] bg-white overflow-hidden divide-y divide-[#F0F5F3]">
      {entries.map((e) => {
        const isNew = e.type === "new_listing";
        return (
          <div key={e.id} className="flex items-start gap-3 px-4 py-3.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: isNew ? "#dcfce7" : "#fff7ed",
                color: isNew ? "#15803d" : "#c2410c",
              }}
            >
              {isNew ? <NewListingIcon /> : <PriceDropIcon />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0E1512] leading-snug">{e.title}</p>
              {e.body && (
                <p className="text-[12px] text-[#6B7A74] mt-0.5 leading-snug">{e.body}</p>
              )}
            </div>
            <span className="text-[11px] text-[#B0BDB8] flex-shrink-0 pt-0.5">{relativeTime(e.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}
