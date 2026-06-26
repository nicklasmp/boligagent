"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NotifySheet from "./NotifySheet";

export default function TopBar() {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newCount, setNewCount] = useState<number | null>(null);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setNewCount(null);
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNewCount(data.new ?? 0);
        router.refresh();
      }
    } finally {
      setRefreshing(false);
      setTimeout(() => setNewCount(null), 3000);
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#141414]/90 backdrop-blur-sm border-b border-[#2a2a2a] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
            <path d="M5 17L18 5L31 17V32H23V24H13V32H5V17Z" fill="#e8358a" />
          </svg>
          <h1 className="font-semibold text-[#f5f5f5] text-base tracking-tight">Boligagent</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Opdater nu */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: newCount !== null && newCount > 0 ? "#e8358a" : "#1c1c1c",
              color: newCount !== null && newCount > 0 ? "#fff" : "#a0a0a0",
            }}
            aria-label="Opdater nu"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: refreshing ? "ptr-spin 0.8s linear infinite" : "none" }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {newCount !== null
              ? newCount > 0
                ? `${newCount} nye`
                : "Opdateret"
              : refreshing
              ? "Henter…"
              : "Opdater nu"}
          </button>

          <button
            onClick={() => setSheetOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#a0a0a0] hover:text-[#f5f5f5] active:scale-90 transition"
            aria-label="Notifikationer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </header>
      <NotifySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
