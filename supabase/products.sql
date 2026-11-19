-- Run this once in Supabase → SQL Editor → New query → Run.
-- Stores the changes you make to products on the /admin page.
-- The original products still live in the website code; a row here simply overrides one.

create table if not exists public.product_overrides (
  slug         text primary key,
  name         text not null,
  price_ghs    integer not null check (price_ghs > 0),
  description  text not null,
  lead_time    text not null,
  available    boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- Locked down like the orders table: only our server (secret key) can use it.
alter table public.product_overrides enable row level security;
