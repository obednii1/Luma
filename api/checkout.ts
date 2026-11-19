// Vercel serverless function: POST /api/checkout
// Prices are decided HERE, never taken from the browser, so a customer can't
// edit their cart total. Creates a Paystack transaction and returns its payment URL.
// Needs PAYSTACK_SECRET_KEY (use a test key, sk_test_..., for the demo).

// IMPORTANT: keep these in sync with src/data.ts (products and deliveryZones).
const PRODUCTS: Record<string, { name: string; price: number; finishes: string[] }> = {
  "arc-pendant-01": {
    name: "Arc Pendant 01",
    price: 10500,
    finishes: ["Aged brass", "Blackened bronze", "Natural aluminium"],
  },
  "opal-rise": { name: "Opal Rise", price: 7700, finishes: ["Aged brass", "Polished nickel"] },
  "mori-globe": { name: "Mori Globe", price: 5000, finishes: ["Natural oak", "Smoked walnut"] },
  "nocturne-sconce": {
    name: "Nocturne Sconce",
    price: 4300,
    finishes: ["Blackened bronze", "Aged brass"],
  },
  "halo-drop": {
    name: "Halo Drop",
    price: 8400,
    finishes: ["Natural aluminium", "Aged brass", "Blackened bronze"],
  },
  "studio-cone": {
    name: "Studio Cone",
    price: 11200,
    finishes: ["Blackened bronze", "Natural aluminium"],
  },
};

/** Prices/availability edited in the admin page (saved in the database). */
async function loadOverrides(): Promise<
  Record<string, { name: string; price_ghs: number; available: boolean }> | null
> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return {}; // no database yet: use the built-in prices
  try {
    const response = await fetch(`${url}/rest/v1/product_overrides?select=slug,name,price_ghs,available`, {
      headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) },
    });
    if (!response.ok) {
      // Table not created yet (404) is fine; anything else we can't trust.
      return response.status === 404 ? {} : null;
    }
    const rows = (await response.json()) as { slug: string; name: string; price_ghs: number; available: boolean }[];
    return Object.fromEntries(rows.map((row) => [row.slug, row]));
  } catch {
    return null;
  }
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

/** Products added from the admin page. Returns null if we can't check (so we never guess a price). */
async function loadCustom(): Promise<Record<string, { name: string; price: number; finishes: string[]; available: boolean }> | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return {};
  try {
    const response = await fetch(`${url}/rest/v1/custom_products?select=slug,name,price_ghs,finishes,available`, {
      headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) },
    });
    if (!response.ok) return response.status === 404 ? {} : null;
    const rows = (await response.json()) as { slug: string; name: string; price_ghs: number; finishes: string[]; available: boolean }[];
    return Object.fromEntries(
      rows.map((row) => [row.slug, { name: row.name, price: Number(row.price_ghs), finishes: row.finishes, available: row.available }]),
    );
  } catch {
    return null;
  }
}

const DELIVERY: Record<string, { label: string; fee: number }> = {
  accra: { label: "Greater Accra", fee: 150 },
  other: { label: "Other regions in Ghana", fee: 400 },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return json({ error: "Payments are not configured yet." }, 500);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (clean(body.website, 200)) return json({ error: "Request rejected." }, 400); // honeypot

  // ---- customer details
  const c = (body.customer ?? {}) as Record<string, unknown>;
  const customer = {
    name: clean(c.name, 120),
    email: clean(c.email, 200),
    phone: clean(c.phone, 40),
    address: clean(c.address, 300),
    city: clean(c.city, 120),
    notes: clean(c.notes, 1000),
  };
  if (!customer.name || !customer.phone || !customer.address || !customer.city) {
    return json({ error: "Please fill in all required fields." }, 400);
  }
  if (!isEmail(customer.email)) return json({ error: "Please enter a valid email address." }, 400);
  if (customer.phone.replace(/\D/g, "").length < 9) {
    return json({ error: "Please enter a valid phone number." }, 400);
  }

  const zone = DELIVERY[clean(body.zone, 20)];
  if (!zone) return json({ error: "Please choose a delivery area." }, 400);

  // ---- cart lines, priced on the server
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 20) {
    return json({ error: "Your cart is empty." }, 400);
  }

  const overrides = await loadOverrides();
  const custom = await loadCustom();
  const dbUrl = process.env.SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_KEY;
  const mode =
    dbUrl && dbKey
      ? await loadMode(dbUrl, { apikey: dbKey, ...(dbKey.startsWith("eyJ") ? { Authorization: `Bearer ${dbKey}` } : {}) })
      : "builtin";
  if (!overrides || !custom || !mode) return json({ error: "We couldn't check prices just now. Please try again." }, 503);

  const items: { name: string; finish: string; qty: number; unitPrice: number }[] = [];
  for (const raw of rawItems as Record<string, unknown>[]) {
    const slug = clean(raw?.slug, 80);
    // Once the catalog lives in the database, the code's built-in list is no longer used.
    const base = mode === "builtin" && Object.hasOwn(PRODUCTS, slug) ? PRODUCTS[slug] : undefined;
    const override = base ? overrides[slug] : undefined;
    const product = base
      ? {
          ...base,
          name: override?.name ?? base.name,
          price: override ? Number(override.price_ghs) : base.price,
          available: override ? override.available : true,
        }
      : Object.hasOwn(custom, slug)
        ? custom[slug]
        : undefined;
    const finish = clean(raw?.finish, 60);
    const qty = Number(raw?.qty);
    if (!product || !product.available || !product.finishes.includes(finish) || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return json({ error: "Something in your cart is no longer available. Please review it." }, 400);
    }
    items.push({ name: product.name, finish, qty, unitPrice: product.price });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const total = subtotal + zone.fee;
  const reference = `LUMA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const origin =
    request.headers.get("origin") ??
    `https://${request.headers.get("x-forwarded-host") ?? request.headers.get("host")}`;

  // ---- ask Paystack for a payment page (amount is in pesewas: GH₵1 = 100)
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: customer.email,
      amount: Math.round(total * 100),
      currency: "GHS",
      reference,
      callback_url: `${origin}/checkout/success`,
      metadata: {
        cancel_action: `${origin}/cart`,
        customer,
        items,
        delivery: { zone: zone.label, fee: zone.fee },
        subtotal,
      },
    }),
  });

  const result = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string };
  } | null;

  if (!response.ok || !result?.status || !result.data?.authorization_url) {
    console.error("Paystack initialize failed", response.status, result);
    return json({ error: "We couldn't start the payment. Please try again shortly." }, 502);
  }

  return json({ url: result.data.authorization_url, reference });
}
