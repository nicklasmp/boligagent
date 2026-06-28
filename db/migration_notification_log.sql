create table if not exists notification_log (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  type       text not null check (type in ('new_listing', 'price_drop')),
  listing_id text,
  created_at timestamptz not null default now()
);

create index if not exists notification_log_created_at_idx on notification_log (created_at desc);

-- Called after each insert to keep max 50 rows
create or replace function trim_notification_log()
returns void language sql as $$
  delete from notification_log
  where id not in (
    select id from notification_log order by created_at desc limit 50
  );
$$;
