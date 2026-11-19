// Vercel serverless function: GET /api/products
// Public. Returns the product changes saved from the admin page (price, name, etc.).
// The website merges these over the built-in product list. If the database isn't set
// up or is unreachable, it returns an empty list and the site just uses its defaults.

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

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const headers = { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" };
  if (!url || !key) return new Response(JSON.stringify({ overrides: [], custom: [], mode: "builtin" }), { headers });

  const dbHeaders: Record<string, string> = {
    apikey: key,
    ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
  };

  try {
    const response = await fetch(
      `${url}/rest/v1/product_overrides?select=slug,name,price_ghs,description,lead_time,available`,
      {
        headers: {
          apikey: key,
          ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
        },
      },
    );
    if (!response.ok) throw new Error(`Database ${response.status}`);
    const overrides = await response.json();

    // Products added from the admin page (a missing table just means none yet).
    let custom: unknown[] = [];
    const extra = await fetch(
      `${url}/rest/v1/custom_products?select=slug,name,type,price_ghs,description,lead_time,finishes,dimensions,warranty,available,image_version,image_url&order=sort_order.asc,created_at.asc`,
      { headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) } },
    );
    if (extra.ok) {
      // Never send the (large) photo data in the list; photos come from /api/product-image.
      custom = ((await extra.json()) as Record<string, unknown>[]).map(({ image: _image, ...rest }) => rest);
    }

    const mode = (await loadMode(url, dbHeaders)) ?? "builtin";
    return new Response(JSON.stringify({ overrides, custom, mode }), { headers });
  } catch (error) {
    console.error("Loading product overrides failed", error);
    return new Response(JSON.stringify({ overrides: [], custom: [], mode: "builtin" }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
