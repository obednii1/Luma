// Vercel serverless function: POST /api/track  { reference, email }
// Lets a customer check their order status. Both the order number AND the email used at
// checkout must match, so nobody can look up someone else's order. Only non-sensitive
// details are returned (no phone number or street address).

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const NOT_FOUND = "We couldn't find an order with those details. Check the order number and email.";

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return json({ error: "Order tracking isn't available yet." }, 500);

  let body: { reference?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const reference = typeof body.reference === "string" ? body.reference.trim().toUpperCase() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^LUMA-[A-Z0-9]{8}$/.test(reference) || !email) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return json({ error: NOT_FOUND }, 404);
  }

  const response = await fetch(
    `${url}/rest/v1/orders?reference=eq.${reference}&select=reference,status,created_at,items,subtotal_ghs,delivery_fee_ghs,amount_ghs,delivery_zone,city,customer_email,tracking_note&limit=1`,
    { headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) } },
  );
  if (!response.ok) {
    console.error("Track lookup failed", response.status, await response.text());
    return json({ error: "Something went wrong. Please try again shortly." }, 502);
  }

  const [order] = (await response.json()) as (Record<string, unknown> & { customer_email?: string | null })[];
  if (!order || (order.customer_email ?? "").trim().toLowerCase() !== email) {
    await new Promise((resolve) => setTimeout(resolve, 600)); // slow down guessing
    return json({ error: NOT_FOUND }, 404);
  }

  // Only hand back a fixed set of fields, whatever the database returned.
  const safe = Object.fromEntries(
    [
      "reference",
      "status",
      "created_at",
      "items",
      "subtotal_ghs",
      "delivery_fee_ghs",
      "amount_ghs",
      "delivery_zone",
      "city",
      "tracking_note",
    ].map((field) => [field, order[field]]),
  );
  return json({ order: safe });
}
