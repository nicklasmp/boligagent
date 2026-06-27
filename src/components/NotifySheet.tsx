"use client";

import NotifyButton from "./NotifyButton";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotifySheet({ open, onClose }: Props) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 transition-opacity"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl border-t border-[#DCE5E1] transition-transform"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxShadow: "0 -4px 24px rgba(14,21,18,0.08)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE5E1]">
          <h2 className="font-semibold text-[#0E1512] text-sm">Notifikationer</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#EDF2F0] flex items-center justify-center text-[#6B7A74] hover:text-[#0E1512] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-6">
          <p className="text-sm text-[#6B7A74] mb-5 leading-relaxed">
            Slå notifikationer til for at få besked, når et nyt rækkehus dukker op i Nyborg (5800).
          </p>
          <NotifyButton />
        </div>
      </div>
    </>
  );
}
