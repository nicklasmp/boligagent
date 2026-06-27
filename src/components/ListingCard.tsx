"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ListingRow, ListingStatus } from "@/lib/listings";

const ENERGY_COLOR: Record<string, { bg: string; text: string }> = {
  A2020: { bg: "#dcfce7", text: "#15803d" },
  A2015: { bg: "#dcfce7", text: "#16a34a" },
  A2010: { bg: "#dcfce7", text: "#22c55e" },
  A:     { bg: "#dcfce7", text: "#4ade80" },
  B:     { bg: "#d9f99d", text: "#65a30d" },
  C:     { bg: "#fef9c3", text: "#a16207" },
  D:     { bg: "#ffedd5", text: "#c2410c" },
  E:     { bg: "#fee2e2", text: "#dc2626" },
  F:     { bg: "#fee2e2", text: "#b91c1c" },
  G:     { bg: "#fecaca", text: "#991b1b" },
};

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

const CUTOFF_KEY = "boligagent_cutoff";

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
  const touchStartY = useRef<number | null>(null);

  const validImages = images.filter((_, i) => !imgErrors[i]);
  const effectiveIndex = Math.min(index, Math.max(validImages.length - 1, 0));

  function prev() { setIndex((i) => (i - 1 + validImages.length) % validImages.length); }
  function next() { setIndex((i) => (i + 1) % validImages.length); }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
    touchStartY.current = null;
  }

  if (validImages.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#EDF2F0]">
        <svg width="40" height="40" viewBox="0 0 120 120" fill="none" opacity="0.18">
          <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#0F4F3C" strokeWidth="9" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute inset-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
              const idx = images.indexOf(src);
              setImgErrors((prev) => ({ ...prev, [idx]: true }));
            }}
          />
        </div>
      ))}

      {validImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Forrige billede"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Næste billede"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/35 text-white text-[11px] font-medium backdrop-blur-sm tracking-wide">
            {effectiveIndex + 1} / {validImages.length}
          </div>
        </>
      )}
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: { bg: string; text: string } }) {
  return (
    <div className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl" style={{ background: accent?.bg ?? "#F0F5F3" }}>
      <span className="text-[13px] font-semibold leading-none" style={{ color: accent?.text ?? "#0E1512" }}>{value}</span>
      <span className="text-[10px] mt-1 leading-none" style={{ color: accent ? accent.text + "bb" : "#9AA7A1" }}>{label}</span>
    </div>
  );
}

function IconPin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 mt-px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
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
  const [acting, setActing] = useState(false);
  const isNew = useIsNew(listing.created_at);

  const images: string[] =
    listing.image_urls && listing.image_urls.length > 0
      ? listing.image_urls
      : ([fixImageUrl(listing.image_url)].filter(Boolean) as string[]);

  const energyAccent = listing.energy_class ? ENERGY_COLOR[listing.energy_class] : undefined;

  const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(listing.address + ", " + listing.zip + " " + listing.city)}`;

  async function act(status: ListingStatus) {
    if (acting) return;
    setActing(true);
    setVisible(false);
    const [, res] = await Promise.all([
      new Promise((r) => setTimeout(r, 200)),
      fetch(`/api/listings/${listing.boliga_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    ]);
    if (!(res as Response).ok) {
      setVisible(true);
      setActing(false);
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
        transform: visible ? "translateY(0)" : "translateY(-8px) scale(0.97)",
        transition: "opacity 200ms ease, transform 200ms ease",
        boxShadow: "0 2px 8px rgba(14,21,18,0.07), 0 0 0 0 transparent",
      }}
    >
      {/* Image */}
      <div className="relative w-full bg-[#EDF2F0]" style={{ aspectRatio: "16/9" }}>
        <ImageSlider images={images} address={listing.address} />
        {isNew && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#52E3A0] text-[#0A3328] uppercase z-10">
            Ny
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">

        {/* Price + address */}
        <div>
          <p className="text-[22px] font-bold text-[#0E1512] leading-none tracking-tight">
            {formatPrice(listing.price)}
          </p>
          <p className="text-[15px] font-medium text-[#0E1512] mt-1.5 leading-snug">
            {listing.address}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[#9AA7A1]"><IconPin /></span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6B7A74] hover:text-[#0F4F3C] transition-colors"
            >
              {listing.neighborhood
                ? `${listing.neighborhood}, ${listing.city}`
                : `${listing.zip} ${listing.city}`}
            </a>
            {listing.days_on_market != null && (
              <span className="text-[13px] text-[#9AA7A1]">
                &nbsp;·&nbsp;{listing.days_on_market === 0 ? "Ny i dag" : `${listing.days_on_market} dage til salg`}
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        {(listing.sqm || listing.rooms || listing.build_year || listing.energy_class) && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${[listing.sqm, listing.rooms, listing.build_year, listing.energy_class].filter(Boolean).length}, 1fr)` }}>
            {listing.sqm && <StatCell label="Areal" value={`${listing.sqm} m²`} />}
            {listing.rooms && <StatCell label="Rum" value={`${listing.rooms}`} />}
            {listing.build_year && <StatCell label="Opført" value={`${listing.build_year}`} />}
            {listing.energy_class && <StatCell label="Energi" value={listing.energy_class} accent={energyAccent} />}
          </div>
        )}

        {/* m²-pris */}
        {listing.sqm_price && (
          <p className="text-[12px] text-[#9AA7A1]">
            {listing.sqm_price.toLocaleString("da-DK")} kr./m²
            {listing.lot_size ? ` · Grund ${listing.lot_size.toLocaleString("da-DK")} m²` : ""}
          </p>
        )}

        {/* Actions */}
        {tab === "new" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => act("disliked")}
              disabled={acting}
              className="flex-1 h-11 rounded-xl border border-[#DCE5E1] text-[13px] font-medium text-[#6B7A74] hover:border-[#B0BDB8] hover:text-[#0E1512] active:scale-[0.98] transition-all disabled:opacity-40"
            >
              Ikke interesseret
            </button>
            <button
              onClick={() => act("liked")}
              disabled={acting}
              className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ background: "#0F4F3C" }}
            >
              Gem bolig
            </button>
          </div>
        )}

        {tab !== "new" && (
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-2 text-[13px] text-[#6B7A74]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: tab === "liked" ? "#52E3A0" : "#DCE5E1" }}
              />
              {tab === "liked" ? "Gemt" : "Ikke interesseret"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => act("new")}
                disabled={acting}
                className="h-8 px-3 rounded-lg border border-[#DCE5E1] text-[12px] text-[#6B7A74] hover:border-[#B0BDB8] hover:text-[#0E1512] active:scale-[0.98] transition-all disabled:opacity-40"
              >
                Fortryd
              </button>
              <button
                onClick={() => act(tab === "liked" ? "disliked" : "liked")}
                disabled={acting}
                className="h-8 px-3 rounded-lg border border-[#DCE5E1] text-[12px] text-[#6B7A74] hover:border-[#B0BDB8] hover:text-[#0E1512] active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {tab === "liked" ? "Ikke interesseret" : "Gem bolig"}
              </button>
            </div>
          </div>
        )}

        {/* Boliga link */}
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[12px] text-[#9AA7A1] hover:text-[#0F4F3C] transition-colors pt-0.5"
        >
          Se fuldt opslag på Boliga
        </a>
      </div>
    </div>
  );
}
