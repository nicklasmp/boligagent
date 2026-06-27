"use client";

import { useState, useRef, useEffect } from "react";
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
  const color = ENERGY_COLORS[label] ?? "#6B7A74";
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

function fixImageUrl(url: string | null) {
  if (!url) return null;
  const old = url.match(/i\.boliga\.dk\/\S+?\/(\d+)\.jpg/);
  if (old) {
    const id = old[1];
    return `https://i.boliga.org/dk/550x/${id.substring(0, 4)}/${id}.jpg`;
  }
  return url;
}

const CUTOFF_KEY = 'boligagent_cutoff';

function useIsNew(createdAt: string) {
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    let cutoff = localStorage.getItem(CUTOFF_KEY);
    if (!cutoff) {
      cutoff = new Date().toISOString();
      localStorage.setItem(CUTOFF_KEY, cutoff);
    }
    setIsNew(new Date(createdAt).getTime() > new Date(cutoff).getTime());
  }, [createdAt]);
  return isNew;
}

function ImageSlider({ images, address }: { images: string[]; address: string }) {
  const [index, setIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const validImages = images.filter((_, i) => !imgErrors[i]);
  const effectiveIndex = Math.min(index, Math.max(validImages.length - 1, 0));

  function prev() {
    setIndex((i) => (i - 1 + validImages.length) % validImages.length);
  }
  function next() {
    setIndex((i) => (i + 1) % validImages.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  }

  if (validImages.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 120 120" fill="none" opacity="0.2">
          <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#0F4F3C" strokeWidth="9" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {validImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: i === effectiveIndex ? 1 : 0, pointerEvents: i === effectiveIndex ? "auto" : "none" }}
        >
          <Image
            src={src}
            alt={`${address} — billede ${i + 1}`}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
            onError={() => {
              const originalIndex = images.indexOf(src);
              setImgErrors((prev) => ({ ...prev, [originalIndex]: true }));
            }}
          />
        </div>
      ))}

      {validImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/60 transition"
            aria-label="Forrige billede"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/60 transition"
            aria-label="Næste billede"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {validImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: i === effectiveIndex ? "#fff" : "rgba(255,255,255,0.5)",
                  transform: i === effectiveIndex ? "scale(1.25)" : "scale(1)",
                }}
                aria-label={`Billede ${i + 1}`}
              />
            ))}
          </div>

          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 text-white text-[10px] font-medium backdrop-blur-sm">
            {effectiveIndex + 1}/{validImages.length}
          </div>
        </>
      )}
    </div>
  );
}

interface Props {
  listing: ListingRow;
  tab: ListingStatus;
  index: number;
}

export default function ListingCard({ listing, tab, index }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const isNew = useIsNew(listing.created_at);

  const images: string[] =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : [fixImageUrl(listing.image_url)].filter(Boolean) as string[];

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
      className="card-in rounded-2xl overflow-hidden bg-white border border-[#DCE5E1]"
      style={{
        animationDelay: `${index * 55}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px) scale(0.98)",
        transition: "opacity 220ms ease, transform 220ms ease",
        boxShadow: "0 1px 4px rgba(14,21,18,0.06)",
      }}
    >
      <div className="relative w-full h-48 bg-[#EDF2F0]">
        <ImageSlider images={images} address={listing.address} />
        {isNew && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#52E3A0] text-[#0E1512] uppercase z-10">
            Ny
          </span>
        )}
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
        <div>
          <p className="font-semibold text-[#0E1512] leading-snug">{listing.address}</p>
          <p className="text-sm text-[#6B7A74]">{listing.zip} {listing.city}</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6B7A74]">
          <span className="text-[#0E1512] font-medium">{formatPrice(listing.price)}</span>
          {listing.sqm && <span>{listing.sqm} m²</span>}
          {listing.rooms && <span>{listing.rooms} vær.</span>}
          {listing.energy_class && <EnergyBadge label={listing.energy_class} />}
          {listing.days_on_market != null && (
            <span>{listing.days_on_market} dage</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6B7A74] hover:text-[#0F4F3C] transition-colors"
          >
            Se på Boliga ↗
          </a>

          {tab === "new" && (
            <div className="flex gap-2">
              <button
                onClick={() => act("disliked")}
                className="w-10 h-10 rounded-xl bg-[#EDF2F0] flex items-center justify-center text-[#6B7A74] hover:text-[#0E1512] active:scale-90 transition"
                aria-label="Nej tak"
              >
                <ThumbDown />
              </button>
              <button
                onClick={() => act("liked")}
                className="w-10 h-10 rounded-xl bg-[#C5F4DE] flex items-center justify-center text-[#0F4F3C] hover:bg-[#52E3A0]/40 active:scale-90 transition"
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
                className="px-3 h-8 rounded-lg bg-[#EDF2F0] text-xs text-[#6B7A74] hover:text-[#0E1512] active:scale-95 transition"
              >
                Fortryd
              </button>
              <button
                onClick={() => act(tab === "liked" ? "disliked" : "liked")}
                className="px-3 h-8 rounded-lg bg-[#EDF2F0] text-xs text-[#6B7A74] hover:text-[#0E1512] active:scale-95 transition"
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
