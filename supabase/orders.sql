-- Run this once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,            -- Paystack reference, e.g. LUMA-1A2B3C4D (prevents duplicates)
  status           text not null default 'paid'
                   check (status in ('paid', 'in_production', 'shipped', 'delivered', 'cancelled')),
  amount_ghs       numeric(12, 2) not null,         -- total paid
  subtotal_ghs     numeric(12, 2) not null,
  delivery_fee_ghs numeric(12, 2) not null,
  delivery_zone    text,
  customer_name    text,
  customer_email   text,
  customer_phone   text,
  address          text,
  city             text,
  notes            text,
  items            jsonb not null,                  -- [{ name, finish, qty, unitPrice }]
  created_at       timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Lock the table down. With row level security on and no policies, the public
-- (browser) keys cannot read or write it. Only our server, using the secret key, can.
alter table public.orders enable row level security;
