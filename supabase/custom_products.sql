-- Run once in Supabase → SQL Editor → New query → Run.
-- Stores products you add yourself from the /admin page (including their photo).

create table if not exists public.custom_products (
  slug           text primary key,
  name           text not null,
  type           text not null check (type in ('Pendant', 'Wall', 'Table', 'Floor')),
  price_ghs      integer not null check (price_ghs > 0),
  description    text not null,
  lead_time      text not null,
  finishes       jsonb not null,
  dimensions     text not null,
  warranty       text not null,
  image          text,
  image_version  bigint not null default 0,
  available      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Locked down like the other tables: only our server (secret key) can use it.
alter table public.custom_products enable row level security;
