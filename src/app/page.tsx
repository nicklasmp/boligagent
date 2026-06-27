export const dynamic = "force-dynamic";

import { getListings, getCounts } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import TabNav from "@/components/TabNav";
import FeedShell from "@/components/FeedShell";

export default async function NyePage() {
  const [listings, counts] = await Promise.all([
    getListings("new"),
    getCounts(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <TabNav counts={counts} />
      <main className="flex-1 pt-[104px] pb-8 px-4 max-w-xl mx-auto w-full">
        <FeedShell>
          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
              <svg width="40" height="40" viewBox="0 0 120 120" fill="none" opacity="0.25">
                <path d="M22 54 60 20l38 34v44a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V54Z" stroke="#0F4F3C" strokeWidth="9" strokeLinejoin="round"/>
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
        </FeedShell>
      </main>
    </div>
  );
}
