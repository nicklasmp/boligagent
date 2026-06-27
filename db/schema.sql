-- Boligagent schema
-- Run this in the Supabase SQL editor (project: EU/Frankfurt)

create table if not exists listings (
  boliga_id       bigint primary key,
  status          text not null default 'new'
                    check (status in ('new', 'liked', 'disliked')),
  address         text not null,
  zip             text not null,
  city            text not null,
  price           bigint,
  sqm             integer,
  lot_size        integer,
  rooms           integer,
  build_year      integer,
  energy_class    text,
  days_on_market  integer,
  sqm_price       bigint,
  url             text not null,
  image_url       text,
  image_urls      jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  boliga_created  timestamptz,
  updated_at      timestamptz not null default now()
);

create index if not exists listings_status_idx     on listings (status);
create index if not exists listings_created_at_idx on listings (created_at desc);

-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger listings_updated_at
  before update on listings
  for each row execute procedure set_updated_at();

-- Push subscriptions (fase 2)
-- Migration: run if table already exists
-- alter table listings add column if not exists image_urls jsonb;

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
