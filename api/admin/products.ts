// Vercel serverless functions for the admin Products tab:
//   GET    /api/admin/products          (saved product changes)
//   PUT    /api/admin/products          (save changes to one product)
//   DELETE /api/admin/products?slug=x   (reset one product to its defaults)
// Every request must carry a valid admin session cookie (see api/admin/login.ts).
// The database secret key only ever exists on the server.

import { createHmac, timingSafeEqual } from "node:crypto";

// IMPORTANT: keep in sync with the products in src/data.ts.
const SLUGS = ["arc-pendant-01", "opal-rise", "mori-globe", "nocturne-sconce", "halo-drop", "studio-cone"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/** Checks the signed cookie set by login.ts and that it hasn't expired. */
function isLoggedIn(request: Request): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("luma_admin="))
    ?.slice("luma_admin=".length);
  if (!token) return false;

  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;

  const expected = createHmac("sha256", secret).update(expires).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return {
    url,
    headers: {
      apikey: key,
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
    } as Record<string, string>,
  };
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return !origin || new URL(origin).host === host;
}

export async function GET(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);
  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  const response = await fetch(`${db.url}/rest/v1/product_overrides?select=*`, { headers: db.headers });
  if (!response.ok) {
    console.error("Listing products failed", response.status, await response.text());
    return json({ error: "Couldn't load products. Have you run supabase/products.sql?" }, 502);
  }
  return json({ overrides: await response.json() });
}

export async function PUT(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";
  const slug = text(body.slug, 80);
  const name = text(body.name, 80);
  const description = text(body.description, 800);
  const lead_time = text(body.lead_time, 40);
  const price = Number(body.price_ghs);

  if (!SLUGS.includes(slug)) return json({ error: "Unknown product." }, 400);
  if (!name || !description || !lead_time) return json({ error: "Please fill in every field." }, 400);
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000) {
    return json({ error: "Price must be a whole number of cedis between 1 and 1,000,000." }, 400);
  }

  const response = await fetch(`${db.url}/rest/v1/product_overrides?on_conflict=slug`, {
    method: "POST",
    headers: { ...db.headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      slug,
      name,
      price_ghs: price,
      description,
      lead_time,
      available: body.available !== false,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    console.error("Saving product failed", response.status, await response.text());
    return json({ error: "Couldn't save. Have you run supabase/products.sql?" }, 502);
  }
  const [saved] = (await response.json()) as unknown[];
  return json({ override: saved });
}

export async function DELETE(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!SLUGS.includes(slug)) return json({ error: "Unknown product." }, 400);

  const response = await fetch(`${db.url}/rest/v1/product_overrides?slug=eq.${slug}`, {
    method: "DELETE",
    headers: db.headers,
  });
  if (!response.ok) {
    console.error("Resetting product failed", response.status, await response.text());
    return json({ error: "Couldn't reset that product." }, 502);
  }
  return json({ ok: true });
}
