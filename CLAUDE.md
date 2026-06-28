# Boligagent — CLAUDE.md

## Formål
PWA der monitorerer boligmarkedet for rækkehuse i Nyborg (postnr. 5800) og viser
nye listings i et feed med mulighed for at markere dem som interessante eller uinteressante.

## Stack
- **Frontend/Backend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres, EU/Frankfurt)
- **Hosting:** Vercel
- **Cron:** cron-job.org → `/api/cron/poll` (beskyttet med `CRON_SECRET`)

## Auth
PIN-baseret login (`/login`). Brugere oprettes manuelt i Supabase-tabellen `users`.
Session gemmes i en HTTP-only cookie (`session`).

## Datakilde
Boligsiden API (uofficielt):
```
https://api.boligsiden.dk/search/cases?zipCodes=5800&per_page=500&page=1&addressTypes=terraced%20house
```
API-klient: `src/lib/boliga.ts` — `fetchListings()` henter kun `terraced house`.

## Push-notifikationer
**Deaktiveret.** Boligsiden/web-push API afviser requests fra Vercel.
Koden er udkommenteret i `src/app/api/cron/poll/route.ts` og `src/app/api/refresh/route.ts`.
`PushButton` i `TopBar.tsx` returnerer `null`.

## Feed-UI
- Tre faner: **Nye** / **Ja tak** / **Nej tak**
- Swipe/knap til at skifte status på en listing
- Listing-interaktioner gemmes i `listing_interactions`-tabellen per bruger
- Light mode UI med grøn accentfarve (`#0F4F3C` / `#52E3A0`)

## DB-tabeller
- `listings` — boliger hentet fra Boligsiden
- `listing_interactions` — brugerens swipe-status (`new`/`liked`/`disliked`) + note
- `users` — brugere med PIN

## Konventioner
- Commit-beskeder: conventional commits, imperativ engelsk
- Git email: nicklas-pedersen@outlook.com
- Ingen secrets i repo — brug `.env.local`
- Beløb i databasen som integers (øre hvis relevant)
