"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ListingStatus } from "@/lib/listings";

const LISTING_TABS = [
  { href: "/",        label: "Nye",     status: "new"      as ListingStatus },
  { href: "/ja-tak",  label: "Gemte",   status: "liked"    as ListingStatus },
  { href: "/nej-tak", label: "Nej tak", status: "disliked" as ListingStatus },
];

interface Props {
  counts: Record<ListingStatus, number>;
}

export default function TabNav({ counts }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-14 left-0 right-0 z-30 bg-[#F7FAF9]/90 backdrop-blur-sm border-b border-[#DCE5E1]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex max-w-xl mx-auto">
        {LISTING_TABS.map(({ href, label, status }) => {
          const active = pathname === href;
          const count = counts[status];
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex items-center justify-center gap-1.5 h-11 text-sm font-medium relative transition-colors ${
                active ? "text-[#0F4F3C]" : "text-[#6B7A74] hover:text-[#0E1512]"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: status === "new" ? "#52E3A0" : "#DCE5E1",
                    color: status === "new" ? "#0E1512" : "#6B7A74",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
              {active && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[#0F4F3C]" />
              )}
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
