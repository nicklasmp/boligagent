-- Tracking: event log per user
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  event      text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_idx    on events (user_id);
create index if not exists events_created_at_idx on events (created_at desc);
