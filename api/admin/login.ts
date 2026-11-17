// Vercel serverless function: POST /api/admin/login
// Single-owner login. Compares the password with ADMIN_PASSWORD and, if it matches,
// sets a signed, HttpOnly session cookie that lasts 8 hours.
// The cookie format here must match the check in api/admin/orders.ts.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SESSION_HOURS = 8;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });

const sha256 = (value: string) => createHash("sha256").update(value).digest();

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!adminPassword || !sessionSecret) return json({ error: "Admin is not configured." }, 500);

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Compare hashes in constant time so response timing doesn't leak anything.
  const ok = timingSafeEqual(sha256(password), sha256(adminPassword));
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 800)); // slows down guessing
    return json({ error: "Incorrect password." }, 401);
  }

  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const signature = createHmac("sha256", sessionSecret).update(expires).digest("hex");
  const cookie = [
    `luma_admin=${expires}.${signature}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${SESSION_HOURS * 60 * 60}`,
  ].join("; ");

  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
