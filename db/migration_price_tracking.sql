-- Prisændring-tracking
alter table listings add column if not exists previous_price bigint;
alter table listings add column if not exists price_changed_at timestamptz;

-- Fuld prishistorik per bolig
create table if not exists price_history (
  id          uuid primary key default gen_random_uuid(),
  listing_id  bigint not null references listings(boliga_id) on delete cascade,
  price       bigint not null,
  recorded_at timestamptz not null default now()
);

create index if not exists price_history_listing_idx on price_history (listing_id);
create index if not exists price_history_time_idx    on price_history (recorded_at desc);
