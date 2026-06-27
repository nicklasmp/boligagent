"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "loading" | "idle" | "subscribed" | "denied" | "unsupported" | "pwa-only";

interface Props {
  onStatusChange?: (subscribed: boolean) => void;
}

export default function NotifyButton({ onStatusChange }: Props) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    // iOS only supports push in standalone PWA mode
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as Record<string, unknown>).standalone === true);
    if (isIos && !isStandalone) {
      setStatus("pwa-only");
      onStatusChange?.(false);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      onStatusChange?.(false);
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      onStatusChange?.(false);
      return;
    }
    if (Notification.permission === "granted") {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Re-sync to DB in case it was lost after a server wipe
          const j = sub.toJSON();
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }),
          }).catch(() => {});
          setStatus("subscribed");
          onStatusChange?.(true);
          return;
        }
      } catch {}
    }
    setStatus("idle");
    onStatusChange?.(false);
  }

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        onStatusChange?.(false);
        return;
      }
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
      onStatusChange?.(true);
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
      onStatusChange?.(false);
    } catch {
      setStatus("subscribed");
    }
  }

  if (status === "loading") {
    return (
      <div className="h-10 w-36 rounded-xl bg-[#EDF2F0] animate-pulse" />
    );
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-[#6B7A74]">
        Push-notifikationer understøttes ikke i denne browser.
      </p>
    );
  }

  if (status === "pwa-only") {
    return (
      <p className="text-sm text-[#6B7A74] leading-snug">
        Tilføj appen til hjemmeskærmen for at modtage notifikationer.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-[#6B7A74]">
        Notifikationer er blokeret — tillad dem i browserindstillingerne.
      </p>
    );
  }

  if (status === "subscribed") {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#DCE5E1] text-sm text-[#6B7A74] hover:text-[#0E1512] hover:border-[#B0C0BA] active:scale-95 transition"
      >
        <span className="w-2 h-2 rounded-full bg-[#52E3A0] flex-shrink-0" />
        Aktiv — tryk for at slå fra
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      className="h-10 px-5 rounded-xl bg-[#0F4F3C] text-white font-medium text-sm hover:bg-[#0A3A2C] active:scale-95 transition"
    >
      Slå notifikationer til
    </button>
  );
}
