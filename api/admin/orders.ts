// Vercel serverless functions: GET /api/admin/orders   (list orders)
//                              PATCH /api/admin/orders (change an order's status)
// Every request must carry a valid admin session cookie (see api/admin/login.ts).
// The database secret key only ever exists on the server.

import { createHmac, timingSafeEqual } from "node:crypto";

const STATUSES = ["paid", "in_production", "shipped", "delivered", "cancelled"];

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

export async function GET(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);

  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  const response = await fetch(`${db.url}/rest/v1/orders?select=*&order=created_at.desc&limit=200`, {
    headers: db.headers,
  });
  if (!response.ok) {
    console.error("Listing orders failed", response.status, await response.text());
    return json({ error: "Couldn't load orders." }, 502);
  }
  return json({ orders: await response.json() });
}

export async function PATCH(request: Request) {
  if (!isLoggedIn(request)) return json({ error: "Not signed in." }, 401);

  // Extra protection against requests triggered from other websites.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && new URL(origin).host !== host) return json({ error: "Forbidden." }, 403);

  const db = database();
  if (!db) return json({ error: "The database is not configured yet." }, 500);

  let body: { id?: unknown; status?: unknown; tracking_note?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Invalid order." }, 400);

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.includes(body.status)) {
      return json({ error: "Invalid status." }, 400);
    }
    update.status = body.status;
  }
  if (body.tracking_note !== undefined) {
    if (typeof body.tracking_note !== "string") return json({ error: "Invalid note." }, 400);
    update.tracking_note = body.tracking_note.trim().slice(0, 500) || null;
  }
  if (Object.keys(update).length === 0) return json({ error: "Nothing to update." }, 400);

  const response = await fetch(`${db.url}/rest/v1/orders?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...db.headers, Prefer: "return=representation" },
    body: JSON.stringify(update),
  });
  if (!response.ok) {
    console.error("Updating order failed", response.status, await response.text());
    return json({ error: "Couldn't update the order." }, 502);
  }
  const [order] = (await response.json()) as unknown[];
  return order ? json({ order }) : json({ error: "Order not found." }, 404);
}
