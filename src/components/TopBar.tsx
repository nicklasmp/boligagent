"use client";

import { useEffect, useState } from "react";

function PushButton() {
  return null;
}

interface UserMeta {
  id: string;
  name: string;
  isAdmin: boolean;
  isImpersonating: boolean;
  users: { id: string; name: string }[];
}

function UserMenu() {
  const [meta, setMeta] = useState<UserMeta | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((m) => { if (m) setMeta(m); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function impersonate(userId: string) {
    setOpen(false);
    await fetch("/api/auth/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    window.location.href = "/";
  }

  async function revert() {
    setOpen(false);
    await fetch("/api/auth/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revert: true }),
    });
    window.location.href = "/";
  }

  if (!meta) return null;

  const otherUsers = (meta.users ?? []).filter((u) => u.id !== meta.id);

  return (
    <div className="relative flex items-center gap-2">
      {/* Impersonation indicator */}
      {meta.isImpersonating && (
        <button
          onClick={revert}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
          style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Nicklas
        </button>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: meta.isImpersonating ? "#fef3c7" : "#F0F5F3",
          border: `1px solid ${meta.isImpersonating ? "#fcd34d" : "#DCE5E1"}`,
          borderRadius: "999px",
          padding: "5px 12px",
          fontSize: "13px",
          fontWeight: 500,
          color: meta.isImpersonating ? "#92400e" : "#0E1512",
          cursor: "pointer",
        }}
      >
        {meta.name}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
            style={{ background: "white", border: "1px solid #DCE5E1", boxShadow: "0 4px 16px rgba(14,21,18,0.1)", minWidth: 160 }}
          >
            {/* Admin: skift profil */}
            {meta.isAdmin && otherUsers.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1">
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#9AA7A1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Vis som
                  </span>
                </div>
                {otherUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => impersonate(u.id)}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F0F5F3] transition-colors flex items-center gap-2"
                    style={{ color: "#0E1512" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9AA7A1", flexShrink: 0 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {u.name}
                  </button>
                ))}
                <div style={{ height: 1, background: "#F0F5F3", margin: "4px 0" }} />
              </>
            )}

            {/* Aktivitet — kun for Nicklas selv, ikke ved impersonering */}
            {meta.isAdmin && !meta.isImpersonating && (
              <a
                href="/tracking"
                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F0F5F3] transition-colors flex items-center gap-2"
                style={{ color: "#0E1512", textDecoration: "none", display: "flex" }}
                onClick={() => setOpen(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9AA7A1", flexShrink: 0 }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Aktivitet
              </a>
            )}

            <div style={{ height: 1, background: "#F0F5F3", margin: "4px 0" }} />

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#F0F5F3] transition-colors"
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
