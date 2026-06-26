"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ListingRow, ListingStatus } from "@/lib/listings";

const ENERGY_COLORS: Record<string, string> = {
  A2020: "#16a34a", A2015: "#22c55e", A2010: "#4ade80",
  A: "#84cc16", B: "#a3e635", C: "#facc15",
  D: "#fb923c", E: "#f87171", F: "#ef4444", G: "#dc2626",
};

function EnergyBadge({ label }: { label: string | null }) {
  if (!label) return null;
  const color = ENERGY_COLORS[label] ?? "#a0a0a0";
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none"
      style={{ background: color + "22", color }}
    >
      {label}
    </span>
  );
}

function formatPrice(p: number | null) {
  if (!p) return "—";
  return p.toLocaleString("da-DK") + " kr.";
}

function isNew(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 72 * 60 * 60 * 1000;
}

interface Props {
  listing: ListingRow;
  tab: ListingStatus;
  index: number;
}

export default function ListingCard({ listing, tab, index }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [imgError, setImgError] = useState(false);

  async function act(status: ListingStatus) {
    setVisible(false);
    const [, res] = await Promise.all([
      new Promise((r) => setTimeout(r, 220)),
      fetch(`/api/listings/${listing.boliga_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    ]);
    if (!(res as Response).ok) {
      setVisible(true);
      return;
    }
    router.refresh();
  }

  return (
    <div
      className="card-in rounded-2xl overflow-hidden bg-[#1c1c1c] border border-[#2a2a2a]"
      style={{
        animationDelay: `${index * 55}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px) scale(0.98)",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-[#232323]">
        {listing.image_url && !imgError ? (
          <Image
            src={listing.image_url}
            alt={listing.address}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 36 36" fill="none" opacity="0.2">
              <path d="M5 17L18 5L31 17V32H23V24H13V32H5V17Z" fill="#e8358a" />
            </svg>
          </div>
        )}
        {isNew(listing.created_at) && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#e8358a] text-white uppercase">
            Ny
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        {/* Address */}
        <div>
          <p className="font-semibold text-[#f5f5f5] leading-snug">{listing.address}</p>
          <p className="text-sm text-[#a0a0a0]">{listing.zip} {listing.city}</p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#a0a0a0]">
          <span className="text-[#f5f5f5] font-medium">{formatPrice(listing.price)}</span>
          {listing.sqm && <span>{listing.sqm} m²</span>}
          {listing.rooms && <span>{listing.rooms} vær.</span>}
          {listing.energy_class && <EnergyBadge label={listing.energy_class} />}
          {listing.days_on_market != null && (
            <span>{listing.days_on_market} dage</span>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between pt-1">
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#a0a0a0] hover:text-[#e8358a] transition-colors"
          >
            Se på Boliga ↗
          </a>

          {tab === "new" && (
            <div className="flex gap-2">
              <button
                onClick={() => act("disliked")}
                className="w-10 h-10 rounded-xl bg-[#232323] flex items-center justify-center text-[#a0a0a0] hover:text-[#f5f5f5] active:scale-90 transition"
                aria-label="Nej tak"
              >
                <ThumbDown />
              </button>
              <button
                onClick={() => act("liked")}
                className="w-10 h-10 rounded-xl bg-[#e8358a]/15 flex items-center justify-center text-[#e8358a] hover:bg-[#e8358a]/25 active:scale-90 transition"
                aria-label="Ja tak"
              >
                <ThumbUp />
              </button>
            </div>
          )}

          {tab !== "new" && (
            <div className="flex gap-2">
              <button
                onClick={() => act("new")}
                className="px-3 h-8 rounded-lg bg-[#232323] text-xs text-[#a0a0a0] hover:text-[#f5f5f5] active:scale-95 transition"
              >
                Fortryd
              </button>
              <button
                onClick={() => act(tab === "liked" ? "disliked" : "liked")}
                className="px-3 h-8 rounded-lg bg-[#232323] text-xs text-[#a0a0a0] hover:text-[#f5f5f5] active:scale-95 transition"
              >
                {tab === "liked" ? "Nej tak" : "Ja tak"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThumbUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}
