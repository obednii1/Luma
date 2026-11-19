-- Run once in Supabase → SQL Editor → New query → Run.
-- Adds a short note you can write on an order (e.g. courier name and phone number)
-- which the customer sees on the "Track your order" page.

alter table public.orders add column if not exists tracking_note text;
