export const dynamic = "force-dynamic";

import { getListings, getCounts } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";

export default async function JaTakPage() {
  const [listings, counts] = await Promise.all([
    getListings("liked"),
    getCounts(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pt-14 pb-24 px-4 max-w-xl mx-auto w-full">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e8358a" strokeWidth="1.5" opacity="0.3">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p className="text-[#a0a0a0] text-sm leading-relaxed max-w-xs">
              Ingen boliger her endnu — swipe til ja tak på noget du kan lide.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 py-4">
            {listings.map((l, i) => (
              <li key={l.boliga_id}>
                <ListingCard listing={l} tab="liked" index={i} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav counts={counts} />
    </div>
  );
}
