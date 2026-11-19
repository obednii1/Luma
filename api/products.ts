// Vercel serverless function: GET /api/products
// Public. Returns the product changes saved from the admin page (price, name, etc.).
// The website merges these over the built-in product list. If the database isn't set
// up or is unreachable, it returns an empty list and the site just uses its defaults.

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const headers = { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" };
  if (!url || !key) return new Response(JSON.stringify({ overrides: [] }), { headers });

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
    return new Response(JSON.stringify({ overrides: await response.json() }), { headers });
  } catch (error) {
    console.error("Loading product overrides failed", error);
    return new Response(JSON.stringify({ overrides: [] }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}
