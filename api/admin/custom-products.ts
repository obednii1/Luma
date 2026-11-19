// Vercel serverless functions for products you ADD from the admin page:
//   GET    /api/admin/custom-products           (list)
//   PUT    /api/admin/custom-products           (create, or edit when "slug" is given)
//   DELETE /api/admin/custom-products?slug=x    (remove)
// Every request needs the admin session cookie. The photo arrives already shrunk by the
// browser as a JPEG data URL and is stored in the database (served by /api/product-image).

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

/** "database" once supabase/catalog.sql has been run; "builtin" before that. null = couldn't check. */
async function loadMode(url: string, headers: Record<string, string>): Promise<"database" | "builtin" | null> {
  try {
    const response = await fetch(`${url}/rest/v1/shop_settings?key=eq.catalog_mode&select=value`, { headers });
    if (response.status === 404) return "builtin";
    if (!response.ok) return null;
    const [row] = (await response.json()) as { value?: string }[];
    return row?.value === "database" ? "database" : "builtin";
  } catch {
    return null;
  }
}

const TYPES = ["Pendant", "Wall", "Table", "Floor"];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export async function GET(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);
  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  const response = await fetch(
    `${db.url}/rest/v1/custom_products?select=slug,name,type,price_ghs,description,lead_time,finishes,dimensions,warranty,available,image_version,image_url&order=sort_order.asc,created_at.asc`,
    { headers: db.headers },
  );
  if (!response.ok) {
    console.error("Listing custom products failed", response.status, await response.text());
    return json({ error: "Couldn't load your added products. Have you run supabase/custom_products.sql?" }, 502);
  }
  const mode = (await loadMode(db.url, db.headers)) ?? "builtin";
  return json({
    mode,
    custom: ((await response.json()) as Record<string, unknown>[]).map(({ image: _image, ...rest }) => rest),
  });
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
  const name = text(body.name, 80);
  const type = text(body.type, 20);
  const description = text(body.description, 800);
  const lead_time = text(body.lead_time, 40);
  const dimensions = text(body.dimensions, 60);
  const warranty = text(body.warranty, 40);
  const price = Number(body.price_ghs);
  const finishes = (Array.isArray(body.finishes) ? body.finishes : [])
    .map((item) => text(item, 40))
    .filter(Boolean)
    .slice(0, 6);

  if (!name || !description || !lead_time || !dimensions || !warranty) {
    return json({ error: "Please fill in every field." }, 400);
  }
  if (!TYPES.includes(type)) return json({ error: "Choose a type." }, 400);
  if (finishes.length === 0) return json({ error: "Add at least one finish." }, 400);
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000) {
    return json({ error: "Price must be a whole number of cedis between 1 and 1,000,000." }, 400);
  }

  let image: string | undefined;
  if (body.image !== undefined) {
    if (typeof body.image !== "string" || body.image.length > 900_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.image)) {
      return json({ error: "That photo couldn't be used. Try a different image." }, 400);
    }
    image = body.image;
  }

  const exists = async (slug: string) => {
    const response = await fetch(`${db.url}/rest/v1/custom_products?slug=eq.${slug}&select=slug`, { headers: db.headers });
    if (!response.ok) throw new Error(`Database ${response.status}`);
    return ((await response.json()) as unknown[]).length > 0;
  };

  let slug = typeof body.slug === "string" ? body.slug : "";
  try {
    if (slug) {
      if (!/^[a-z0-9-]{1,60}$/.test(slug) || !(await exists(slug))) return json({ error: "Unknown product." }, 404);
    } else {
      if (!image) return json({ error: "Please add a photo." }, 400);
      slug = slugify(name) || "product";
      if (SLUGS.includes(slug) || (await exists(slug))) slug = `${slug}-${Math.random().toString(16).slice(2, 6)}`;
    }
  } catch (error) {
    console.error("Custom product check failed", error);
    return json({ error: "Couldn't reach the database. Have you run supabase/custom_products.sql?" }, 502);
  }

  const row: Record<string, unknown> = {
    slug,
    name,
    type,
    price_ghs: price,
    description,
    lead_time,
    finishes,
    dimensions,
    warranty,
    available: body.available !== false,
  };
  if (image) {
    row.image = image;
    row.image_url = null; // a newly uploaded photo replaces any original photo link
    row.image_version = Date.now();
  }

  const response = await fetch(`${db.url}/rest/v1/custom_products?on_conflict=slug`, {
    method: "POST",
    headers: { ...db.headers, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    console.error("Saving custom product failed", response.status, await response.text());
    return json({ error: "Couldn't save. Have you run supabase/custom_products.sql?" }, 502);
  }
  const [saved] = (await response.json()) as Record<string, unknown>[];
  if (saved) delete saved.image; // never send the big photo back
  return json({ product: saved });
}

export async function DELETE(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return json({ error: "Unknown product." }, 400);

  const response = await fetch(`${db.url}/rest/v1/custom_products?slug=eq.${slug}`, {
    method: "DELETE",
    headers: db.headers,
  });
  if (!response.ok) {
    console.error("Deleting custom product failed", response.status, await response.text());
    return json({ error: "Couldn't delete that product." }, 502);
  }
  return json({ ok: true });
}
