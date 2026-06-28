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
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors active:scale-95"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            aria-label="Forrige billede"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors active:scale-95"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            aria-label="Næste billede"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-white text-[11px] font-semibold backdrop-blur-sm tracking-wide flex items-center gap-1" style={{ background: "rgba(0,0,0,0.5)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" opacity="0.8">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
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

// --- Price history modal ---

interface PricePoint { price: number; recorded_at: string }

function PriceHistoryModal({
  listingId,
  currentPrice,
  address,
  onClose,
}: {
  listingId: number;
  currentPrice: number | null;
  address: string;
  onClose: () => void;
}) {
  const [points, setPoints] = useState<PricePoint[] | null>(null);

  useEffect(() => {
    fetch(`/api/listings/${listingId}/price-history`)
      .then((r) => r.ok ? r.json() : [])
      .then(setPoints)
      .catch(() => setPoints([]));
  }, [listingId]);

  const allPoints = points ?? [];

  // Simple SVG spark chart
  function PriceChart() {
    if (allPoints.length < 2) return null;
    const prices = allPoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const W = 300, H = 60, PAD = 8;
    const xs = allPoints.map((_, i) => PAD + (i / (allPoints.length - 1)) * (W - PAD * 2));
    const ys = allPoints.map((p) => H - PAD - ((p.price - min) / range) * (H - PAD * 2));
    const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
    const isDown = prices[prices.length - 1] < prices[0];

    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polyline
          points={xs.map((x, i) => `${x},${ys[i]}`).join(" ")}
          fill="none"
          stroke={isDown ? "#22c55e" : "#f87171"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`${path} L${xs[xs.length - 1].toFixed(1)},${H} L${PAD},${H} Z`}
          fill={isDown ? "#22c55e" : "#f87171"}
          opacity="0.08"
        />
        {allPoints.map((p, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill={isDown ? "#22c55e" : "#f87171"} />
        ))}
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div
        className="relative w-full flex flex-col"
        style={{ background: "white", borderRadius: "20px 20px 0 0", maxHeight: "70vh", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "#DCE5E1" }} />
        </div>
        <div className="flex items-start justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "#F0F5F3" }}>
          <div>
            <p className="font-semibold text-[#0E1512] text-[15px]">Prishistorik</p>
            <p className="text-[13px] text-[#9AA7A1] mt-0.5">{address}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#F0F5F3", color: "#6B7A74" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4">
          {points === null ? (
            <p className="text-[13px] text-[#9AA7A1] text-center py-6">Henter…</p>
          ) : allPoints.length === 0 ? (
            <p className="text-[13px] text-[#9AA7A1] text-center py-6">
              Ingen prishistorik endnu — opdateres automatisk ved prisændringer.
            </p>
          ) : (
            <>
              {allPoints.length >= 2 && (
                <div className="mb-4 px-1">
                  <PriceChart />
                </div>
              )}
              <div className="flex flex-col gap-0 rounded-xl border border-[#DCE5E1] overflow-hidden divide-y divide-[#F0F5F3]">
                {[...allPoints].reverse().map((p, i) => {
                  const prev = [...allPoints].reverse()[i + 1];
                  const diff = prev ? p.price - prev.price : 0;
                  const isFirst = i === allPoints.length - 1;
                  return (
                    <div key={p.recorded_at} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="text-[14px] font-semibold text-[#0E1512]">
                          {p.price.toLocaleString("da-DK")} kr.
                        </span>
                        {!isFirst && diff !== 0 && (
                          <span
                            className="ml-2 text-[12px] font-medium"
                            style={{ color: diff < 0 ? "#22c55e" : "#f87171" }}
                          >
                            {diff < 0 ? "↓" : "↑"} {Math.abs(diff).toLocaleString("da-DK")} kr.
                          </span>
                        )}
                        {isFirst && (
                          <span className="ml-2 text-[11px] text-[#9AA7A1]">Udbudt</span>
                        )}
                      </div>
                      <span className="text-[12px] text-[#9AA7A1]">
                        {new Date(p.recorded_at).toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main component ---

interface Props {
  listing: ListingRow;
  tab: ListingStatus;
  index: number;
}

function StatusIcon({ status }: { status: "liked" | "disliked" }) {
  if (status === "liked") return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ListingCard({ listing, tab, index }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [acting, setActing] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const isNew = useIsNew(listing.created_at);

  const hasPriceDrop = listing.previous_price != null && listing.price != null && listing.price < listing.previous_price;
  const priceDiff = hasPriceDrop ? listing.previous_price! - listing.price! : 0;

  const mapUrl =
    listing.lat && listing.lon
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${listing.lon - 0.018},${listing.lat - 0.009},${listing.lon + 0.018},${listing.lat + 0.009}&layer=mapnik&marker=${listing.lat},${listing.lon}`
      : null;

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
        boxShadow: "0 2px 8px rgba(14,21,18,0.07)",
      }}
    >
      {/* Image */}
      <div className="relative w-full bg-[#EDF2F0]" style={{ aspectRatio: "16/9" }}>
        <ImageSlider images={images} address={listing.address} />

        {/* Prisfald badge — vises i stedet for Ny hvis prisen er sat ned */}
        {hasPriceDrop ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#22c55e] text-white uppercase z-10">
            Prisfald
          </span>
        ) : isNew && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-[#52E3A0] text-[#0A3328] uppercase z-10">
            Ny
          </span>
        )}

        {mapUrl && (
          <button
            onClick={() => setMapOpen(true)}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity active:opacity-70"
            style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <span className="text-[12px] font-medium">Kort</span>
          </button>
        )}
      </div>

      {/* Map bottom sheet */}
      {mapOpen && mapUrl && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setMapOpen(false)} />
          <div
            className="relative w-full flex flex-col"
            style={{ background: "white", borderRadius: "20px 20px 0 0", height: "80vh", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full" style={{ background: "#DCE5E1" }} />
            </div>
            <div className="flex items-start justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "#F0F5F3" }}>
              <div>
                <p className="font-semibold text-[#0E1512] text-[15px] leading-snug">{listing.address}</p>
                <p className="text-[13px] text-[#9AA7A1] mt-0.5">
                  {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.zip} {listing.city}
                </p>
              </div>
              <button
                onClick={() => setMapOpen(false)}
                className="ml-3 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#F0F5F3", color: "#6B7A74" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe src={mapUrl} width="100%" height="100%" style={{ border: 0, display: "block" }} title={`Kort over ${listing.address}`} />
            </div>
            <div className="flex-shrink-0 px-4 py-3 border-t flex gap-2" style={{ borderColor: "#F0F5F3" }}>
              <button
                onClick={() => setMapOpen(false)}
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl text-[13px] font-semibold transition-colors flex-1"
                style={{ background: "#0F4F3C", color: "white" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Tilbage
              </button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl text-[13px] font-medium transition-colors flex-1"
                style={{ background: "#F0F5F3", color: "#0E1512" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Apple Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Price history modal */}
      {priceHistoryOpen && (
        <PriceHistoryModal
          listingId={listing.boliga_id}
          currentPrice={listing.price}
          address={listing.address}
          onClose={() => setPriceHistoryOpen(false)}
        />
      )}

      {/* Content */}
      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">

        {/* Price + address */}
        <div>
          {/* Clickable price row */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              onClick={() => setPriceHistoryOpen(true)}
              className="text-[22px] font-bold text-[#0E1512] leading-none tracking-tight hover:text-[#0F4F3C] transition-colors active:scale-[0.98]"
            >
              {formatPrice(listing.price)}
            </button>
            {hasPriceDrop && (
              <span className="text-[13px] font-semibold" style={{ color: "#22c55e" }}>
                ↓ {priceDiff.toLocaleString("da-DK")} kr.
              </span>
            )}
          </div>

          {/* Previous price strikethrough */}
          {hasPriceDrop && (
            <p className="text-[12px] text-[#9AA7A1] mt-0.5 line-through">
              {formatPrice(listing.previous_price)}
            </p>
          )}

          <p className="text-[15px] font-medium text-[#0E1512] mt-1.5 leading-snug">
            {listing.address}
          </p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
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

        {/* Pris pr. m² + liggetid */}
        {(listing.sqm_price || listing.days_on_market != null) && (() => {
          const dom = listing.days_on_market;
          const domAccent =
            dom === 0 ? { bg: "#dcfce7", text: "#15803d" } :
            dom != null && dom <= 14 ? { bg: "#F0F5F3", text: "#0E1512" } :
            dom != null && dom <= 60 ? { bg: "#fff7ed", text: "#c2410c" } :
            dom != null ? { bg: "#fee2e2", text: "#dc2626" } : undefined;
          const domLabel =
            dom === 0 ? "Ny i dag" :
            dom != null ? `${dom} dage` : null;

          const cells = [
            listing.sqm_price ? { label: "kr./m²", value: listing.sqm_price.toLocaleString("da-DK"), accent: undefined } : null,
            listing.lot_size ? { label: "Grund", value: `${listing.lot_size.toLocaleString("da-DK")} m²`, accent: undefined } : null,
            domLabel ? { label: "Liggetid", value: domLabel, accent: domAccent } : null,
          ].filter(Boolean) as { label: string; value: string; accent?: { bg: string; text: string } }[];

          if (cells.length === 0) return null;
          return (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
              {cells.map((c) => <StatCell key={c.label} label={c.label} value={c.value} accent={c.accent} />)}
            </div>
          );
        })()}

        {/* Partner badges — kun liked */}
        {listing.other_interactions.some((o) => o.status === "liked") && (
          <div className="flex gap-2 flex-wrap">
            {listing.other_interactions.filter((o) => o.status === "liked").map((o) => (
              <span
                key={o.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
                style={{
                  background: o.status === "liked" ? "#dcfce7" : "#f1f5f9",
                  color: o.status === "liked" ? "#15803d" : "#64748b",
                }}
              >
                <StatusIcon status={o.status} />
                {o.name}
              </span>
            ))}
          </div>
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

        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[12px] text-[#9AA7A1] hover:text-[#0F4F3C] transition-colors pt-0.5"
        >
          Se fuldt opslag på Boligsiden
        </a>
      </div>
    </div>
  );
}
