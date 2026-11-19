-- Run once in Supabase → SQL Editor → New query → Run.
-- Moves ALL products (the original six too) into the database so every product can be
-- fully edited from /admin: photo, finishes, price, text, and deleted if you wish.
-- Safe to run more than once. It keeps any price/name changes you already made.

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
alter table public.custom_products add column if not exists image_url text;
alter table public.custom_products add column if not exists sort_order integer not null default 1000;
alter table public.custom_products enable row level security;

create table if not exists public.shop_settings (
  key    text primary key,
  value  text not null
);
alter table public.shop_settings enable row level security;

-- The original six products (photos stay as the same links as before).
insert into public.custom_products
  (slug, name, type, price_ghs, description, lead_time, finishes, dimensions, warranty, image_url, sort_order)
values
  ('arc-pendant-01', 'Arc Pendant 01', 'Pendant', 10500, 'A sweeping arc of hand-finished metal suspends a soft opal diffuser, casting warm, reflected light that feels equally at home above a dining table or in a double-height hall.', '6–8 weeks', '["Aged brass","Blackened bronze","Natural aluminium"]'::jsonb, 'Ø 480mm', '5 years', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200', 1),
  ('opal-rise', 'Opal Rise', 'Pendant', 7700, 'A mouth-blown opal glass shade that glows from within. Its rising profile throws a gentle wash of light up and down, ideal over kitchen islands and reading corners.', '4–6 weeks', '["Aged brass","Polished nickel"]'::jsonb, 'Ø 360mm · H 420mm', '5 years', 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200', 2),
  ('mori-globe', 'Mori Globe', 'Table', 5000, 'A small, perfectly round table light with a frosted glass sphere and a weighted turned-wood base. Dimmable at the foot, it brings a quiet pool of warmth to a bedside or shelf.', '3–4 weeks', '["Natural oak","Smoked walnut"]'::jsonb, 'Ø 220mm · H 340mm', '3 years', 'https://images.unsplash.com/photo-1636368208791-17b81ed832d2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200', 3),
  ('nocturne-sconce', 'Nocturne Sconce', 'Wall', 4300, 'A slim, blackened-metal sconce that grazes walls with a tight band of light. Designed to flank mirrors, headboards and artwork without glare.', '4–6 weeks', '["Blackened bronze","Aged brass"]'::jsonb, 'W 120mm · H 260mm · D 95mm', '5 years', 'https://images.unsplash.com/photo-1592622515232-6e3e2a0d3d9a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200', 4),
  ('halo-drop', 'Halo Drop', 'Pendant', 8400, 'A ring of diffused light hangs from fine cables, creating a soft halo over tables and stair wells. Available in single or cluster configurations.', '8–10 weeks', '["Natural aluminium","Aged brass","Blackened bronze"]'::jsonb, 'Ø 600mm', '5 years', 'https://images.unsplash.com/photo-1559924508-1461423083c5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200', 5),
  ('studio-cone', 'Studio Cone', 'Floor', 11200, 'A tall, tapered floor light with a directional cone head that can be angled to wash a corner or light a reading chair. Finished by hand and made to order.', '6–8 weeks', '["Blackened bronze","Natural aluminium"]'::jsonb, 'H 1620mm · Base Ø 280mm', '5 years', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200', 6)
on conflict (slug) do nothing;

-- Carry over any edits you already made from the old Products tab.
do $$
begin
  -- Only the first time; later runs must not undo edits made in the new editor.
  if to_regclass('public.product_overrides') is not null
     and not exists (select 1 from public.shop_settings where key = 'catalog_mode' and value = 'database') then
    update public.custom_products c
       set name = o.name, price_ghs = o.price_ghs, description = o.description,
           lead_time = o.lead_time, available = o.available
      from public.product_overrides o
     where c.slug = o.slug;
  end if;
end $$;

-- Switch the website over to the database catalogue.
insert into public.shop_settings (key, value) values ('catalog_mode', 'database')
on conflict (key) do update set value = 'database';
