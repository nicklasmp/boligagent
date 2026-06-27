-- Fase 4: Multi-bruger PIN-auth
-- Kør i Supabase SQL Editor

-- Brugere med PIN-hash
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

-- Session tokens (90 dage)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
create index if not exists sessions_token_idx on sessions(token);

-- Interaktioner per bruger per listing
-- OBS: listing_id er bigint (ikke UUID) fordi listings.boliga_id er bigint PK
create table if not exists listing_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  listing_id bigint references listings(boliga_id) on delete cascade,
  status text check (status in ('liked', 'disliked')) not null,
  note text,
  updated_at timestamptz default now(),
  unique(user_id, listing_id)
);

-- Præferencer per bruger (inkl. push subscription)
create table if not exists user_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  max_price integer,
  push_subscription jsonb,
  updated_at timestamptz default now()
);

-- RLS: ingen public adgang — alt via service role key server-side
alter table users enable row level security;
alter table sessions enable row level security;
alter table listing_interactions enable row level security;
alter table user_preferences enable row level security;

create policy "no public access" on users for all using (false);
create policy "no public access" on sessions for all using (false);
create policy "no public access" on listing_interactions for all using (false);
create policy "no public access" on user_preferences for all using (false);
