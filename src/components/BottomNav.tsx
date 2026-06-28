"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ListingStatus } from "@/lib/listings";

const LISTING_TABS = [
  {
    href: "/",
    label: "Nye",
    status: "new" as ListingStatus,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#0F4F3C" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/ja-tak",
    label: "Gemte",
    status: "liked" as ListingStatus,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#0F4F3C" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/nej-tak",
    label: "Nej tak",
    status: "disliked" as ListingStatus,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" fill={active ? "#EDF2F0" : "none"} />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
];

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#0F4F3C" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

interface Props {
  counts: Record<ListingStatus, number>;
}

export default function BottomNav({ counts }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#F7FAF9]/95 backdrop-blur-sm border-t border-[#DCE5E1]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {LISTING_TABS.map(({ href, label, status, icon }) => {
          const active = pathname === href;
          const count = counts[status];
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
            >
              <span className={active ? "text-[#0F4F3C]" : "text-[#6B7A74]"}>
                {icon(active)}
              </span>
              <span className={`text-[10px] font-medium ${active ? "text-[#0F4F3C]" : "text-[#6B7A74]"}`}>
                {label}
              </span>
              {count > 0 && (
                <span
                  className="absolute top-1.5 right-[calc(50%-18px)] min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{
                    background: status === "new" ? "#52E3A0" : "#DCE5E1",
                    color: status === "new" ? "#0E1512" : "#6B7A74",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}

        {/* Log tab */}
        <Link
          href="/log"
          className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
        >
          <span className={pathname === "/log" ? "text-[#0F4F3C]" : "text-[#6B7A74]"}>
            <BellIcon active={pathname === "/log"} />
          </span>
          <span className={`text-[10px] font-medium ${pathname === "/log" ? "text-[#0F4F3C]" : "text-[#6B7A74]"}`}>
            Log
          </span>
        </Link>
      </div>
    </nav>
  );
}
