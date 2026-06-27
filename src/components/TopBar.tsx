"use client";

import { useState } from "react";
import NotifySheet from "./NotifySheet";

export default function TopBar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1] flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#0F4F3C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 120 120" fill="none">
              <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#52E3A0" strokeWidth="11" strokeLinejoin="round"/>
              <text x="60" y="91" textAnchor="middle" fontFamily="Sora, system-ui, sans-serif" fontWeight="800" fontSize="56" fill="white">B</text>
            </svg>
          </div>
          <h1 className="font-semibold text-[#0E1512] text-base tracking-tight">Boligagent</h1>
        </div>

        {/* Bell */}
        <button
          onClick={() => setSheetOpen(true)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#6B7A74] hover:text-[#0E1512] active:scale-90 transition"
          aria-label="Notifikationer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {subscribed && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#52E3A0] ring-2 ring-[#F7FAF9]" />
          )}
        </button>
      </header>

      <NotifySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onStatusChange={setSubscribed}
      />
    </>
  );
}
