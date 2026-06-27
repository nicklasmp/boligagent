export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getListings, getCounts } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import TabNav from "@/components/TabNav";
import FeedShell from "@/components/FeedShell";

export default async function NejTakPage() {
  const userId = await getSessionUser();
  if (!userId) redirect("/login");

  const [listings, counts] = await Promise.all([
    getListings(userId, "disliked"),
    getCounts(userId),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <TabNav counts={counts} />
      <main className="flex-1 pt-[104px] pb-8 px-4 max-w-xl mx-auto w-full">
        <FeedShell>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="1.5" opacity="0.3">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <p className="text-[#a0a0a0] text-sm leading-relaxed max-w-xs">
                Ingen afviste boliger endnu.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4 py-4">
              {listings.map((l, i) => (
                <li key={l.boliga_id}>
                  <ListingCard listing={l} tab="disliked" index={i} />
                </li>
              ))}
            </ul>
          )}
        </FeedShell>
      </main>
    </div>
  );
}
