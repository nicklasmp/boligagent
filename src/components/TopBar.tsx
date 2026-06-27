"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type PushStatus = "loading" | "idle" | "subscribed" | "denied" | "unsupported" | "pwa-only";

function PushButton() {
  const [status, setStatus] = useState<PushStatus>("loading");

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as Record<string, unknown>).standalone === true);
    if (isIos && !isStandalone) { setStatus("pwa-only"); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setStatus("unsupported"); return; }
    if (Notification.permission === "denied") { setStatus("denied"); return; }
    if (Notification.permission === "granted") {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const j = sub.toJSON();
          fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
          }).catch(() => {});
          setStatus("subscribed");
          return;
        }
      } catch {}
    }
    setStatus("idle");
  }

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      });
      const j = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
      });
      setStatus("subscribed");
    } catch {
      setStatus("idle");
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("idle");
    } catch {
      setStatus("subscribed");
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  if (status === "pwa-only") return (
    <span style={{ color: "#9AA7A1", fontSize: "12px", textAlign: "right", lineHeight: "1.3" }}>
      Kræver PWA
    </span>
  );

  if (status === "denied") return (
    <span style={{ color: "#9AA7A1", fontSize: "12px" }}>Blokeret</span>
  );

  if (status === "subscribed") return (
    <button
      onClick={unsubscribe}
      style={{
        background: "transparent",
        color: "#6B7A74",
        fontWeight: 500,
        fontSize: "13px",
        padding: "7px 14px",
        borderRadius: "999px",
        border: "1px solid #DCE5E1",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#52E3A0", display: "inline-block", flexShrink: 0 }} />
      Aktiv
    </button>
  );

  return (
    <button
      onClick={subscribe}
      style={{
        background: "#0F4F3C",
        color: "white",
        fontWeight: 600,
        fontSize: "13px",
        padding: "8px 16px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
      }}
    >
      Notifikationer
    </button>
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

      <PushButton />
    </header>
  );
}
