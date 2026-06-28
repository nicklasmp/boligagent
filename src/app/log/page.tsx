export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import TabNav from "@/components/TabNav";
import NotificationLog from "@/components/NotificationLog";

const EMPTY_COUNTS = { new: 0, liked: 0, disliked: 0 } as const;

export default async function LogPage() {
  const userId = await getSessionUser();
  if (!userId) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#F7FAF9]">
      <TabNav counts={EMPTY_COUNTS} />
      <main className="flex-1 pt-[104px] pb-8 px-4 max-w-xl mx-auto w-full">
        <h2 className="text-[13px] font-semibold text-[#9AA7A1] uppercase tracking-widest mb-4 mt-4">
          Pollerens log
        </h2>
        <NotificationLog />
      </main>
    </div>
  );
}
