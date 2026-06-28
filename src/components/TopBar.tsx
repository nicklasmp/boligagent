"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function PushButton() {
  return null;
}

function UserMenu() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((u) => u?.name && setName(u.name))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!name) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "#F0F5F3",
          border: "1px solid #DCE5E1",
          borderRadius: "999px",
          padding: "5px 12px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#0E1512",
          cursor: "pointer",
        }}
      >
        {name}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
            style={{ background: "white", border: "1px solid #DCE5E1", boxShadow: "0 4px 16px rgba(14,21,18,0.1)", minWidth: 120 }}
          >
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-[#F0F5F3] transition-colors"
              style={{ color: "#0E1512" }}
            >
              Log ud
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1] flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "#0F4F3C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 120 120" fill="none">
            <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#52E3A0" strokeWidth="11" strokeLinejoin="round"/>
            <text x="60" y="91" textAnchor="middle" fontFamily="Sora, system-ui, sans-serif" fontWeight="800" fontSize="56" fill="white">B</text>
          </svg>
        </div>
        <h1 className="font-semibold text-[#0E1512] text-base tracking-tight">Boligagent</h1>
      </div>

      <div className="flex items-center gap-2">
        <PushButton />
        <UserMenu />
      </div>
    </header>
  );
}
