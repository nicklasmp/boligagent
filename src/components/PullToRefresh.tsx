"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 72;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    setPull(Math.min(delta * 0.45, THRESHOLD));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      router.refresh();
      await new Promise((r) => setTimeout(r, 900));
      setRefreshing(false);
    }
    startY.current = null;
    setPull(0);
  }, [pull, router]);

  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pull > 0 || refreshing ? (refreshing ? 44 : pull) : 0 }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e8358a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: refreshing ? 1 : progress,
            transform: refreshing ? "none" : `rotate(${progress * 180}deg)`,
            animation: refreshing ? "ptr-spin 0.8s linear infinite" : "none",
          }}
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </div>
      {children}
    </div>
  );
}
