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
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1] flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0F4F3C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 120 120" fill="none">
              <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#52E3A0" strokeWidth="11" strokeLinejoin="round"/>
              <text x="60" y="91" textAnchor="middle" fontFamily="Sora, system-ui, sans-serif" fontWeight="800" fontSize="56" fill="white">B</text>
            </svg>
          </div>
          <h1 className="font-semibold text-[#0E1512] text-base tracking-tight">Boligagent</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
            style={{
              background: newCount !== null && newCount > 0 ? "#52E3A0" : "#EDF2F0",
              color: newCount !== null && newCount > 0 ? "#0E1512" : "#6B7A74",
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
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7A74] hover:text-[#0E1512] active:scale-90 transition"
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
