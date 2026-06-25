import NotifyButton from "@/components/NotifyButton";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1c1c1c] flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M5 17L18 5L31 17V32H23V24H13V32H5V17Z" fill="#e8358a" />
            <rect x="14.5" y="24" width="7" height="8" rx="1" fill="#141414" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Boligagent</h1>
        <p className="text-zinc-400 text-sm max-w-xs leading-relaxed">
          Overvåger rækkehuse til salg i Nyborg (5800) og sender dig en
          notifikation, når et nyt dukker op på Boliga.
        </p>
      </div>

      <NotifyButton />

      <p className="text-xs text-zinc-600 text-center max-w-xs">
        Feed med Nye / Ja tak / Nej tak kommer i fase 3.
      </p>
    </main>
  );
}
