export const dynamic = "force-dynamic";

import { getListings, getCounts } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import TabNav from "@/components/TabNav";
import PullToRefresh from "@/components/PullToRefresh";

export default async function NyePage() {
  const [listings, counts] = await Promise.all([
    getListings("new"),
    getCounts(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <TabNav counts={counts} />
      <main className="flex-1 pt-[104px] pb-8 px-4 max-w-xl mx-auto w-full">
        <PullToRefresh>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <svg width="40" height="40" viewBox="0 0 36 36" fill="none" opacity="0.2">
                <path d="M5 17L18 5L31 17V32H23V24H13V32H5V17Z" fill="#e8358a" />
              </svg>
              <p className="text-[#a0a0a0] text-sm leading-relaxed max-w-xs">
                Ingen nye rækkehuse lige nu — du får en notifikation, når et nyt dukker op.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4 py-4">
              {listings.map((l, i) => (
                <li key={l.boliga_id}>
                  <ListingCard listing={l} tab="new" index={i} />
                </li>
              ))}
            </ul>
          )}
        </PullToRefresh>
      </main>
    </div>
  );
}
