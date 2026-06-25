"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "loading" | "denied" | "subscribed" | "idle";

export default function NotifyButton() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? "subscribed" : "idle");
      });
    });
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      setStatus("subscribed");
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-sm text-zinc-500">
        Push-notifikationer understøttes ikke i denne browser.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className="text-sm text-zinc-500">
        Notifikationer er blokeret. Tillad dem i browserindstillingerne.
      </p>
    );
  }
  if (status === "subscribed") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="w-2 h-2 rounded-full bg-[#e8358a] inline-block" />
        Notifikationer er slået til
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === "loading"}
      className="px-5 py-3 rounded-xl bg-[#e8358a] text-white font-medium text-sm hover:bg-[#d12d7a] active:scale-95 transition disabled:opacity-50"
    >
      {status === "loading" ? "Vent…" : "Slå notifikationer til"}
    </button>
  );
}
