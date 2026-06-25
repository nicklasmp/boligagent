# Boligagent — CLAUDE.md

## Formål
PWA der monitorerer boligmarkedet for rækkehuse i Nyborg (postnr. 5800) og sender
push-notifikationer når et nyt rækkehus dukker op på Boliga.

## Stack
- **Frontend/Backend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase (Postgres, EU/Frankfurt)
- **Hosting:** Vercel
- **Push:** Web Push API + VAPID (fase 2)
- **Cron:** cron-job.org (fase 2)

## Datakilde
Boligas uofficielle API:
```
https://api.boliga.dk/api/v2/search/results?propertyType=<N>&zipCodes=5800&pageSize=100&page=1&sort=daysForSale-asc
```
Kør `npm run verify:boliga` for at finde korrekt `propertyType` for rækkehuse.

## Faseplanen

### Fase 1 — Datalag (lokal) ✅
- Scaffold Next.js + Supabase
- Boliga API-klient (`src/lib/boliga.ts`)
- DB schema (`db/schema.sql`) med `listings` og `push_subscriptions`
- Cron-route (`/api/cron/poll`) beskyttet med `CRON_SECRET`
- Verificeringsscript til at finde rigtig propertyType

### Fase 2 — Monitorering + Push
- Koble cron-routen til cron-job.org (gratis, 1-min interval)
- Web Push: VAPID-nøgler, subscribe-endpoint, send notifikation ved ny listing
- Service Worker til at modtage push i PWA

### Fase 3 — Feed-UI
- Tre faner: **Nye** / **Ja tak** (👍) / **Nej tak** (👎)
- Swipe/knap til at skifte status på en listing
- Minimalistisk dark-mode UI

## Konventioner
- Commit-beskeder: conventional commits, imperativ engelsk
- Git email: nicklas-pedersen@outlook.com
- Ingen secrets i repo — brug `.env.local`
- Beløb i databasen som integers (øre hvis relevant)
