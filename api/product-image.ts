// Vercel serverless function: GET /api/product-image?slug=my-lamp&v=123
// Public. Serves the photo of a product added from the admin page. The "v" number changes
// whenever the photo changes, so browsers can cache each version for a long time.

export async function GET(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!url || !key || !/^[a-z0-9-]{1,60}$/.test(slug)) return new Response("Not found", { status: 404 });

  const response = await fetch(`${url}/rest/v1/custom_products?slug=eq.${slug}&select=image`, {
    headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) },
  });
  if (!response.ok) return new Response("Unavailable", { status: 502 });

  const [row] = (await response.json()) as { image?: string }[];
  const match = row?.image?.match(/^data:image\/jpeg;base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(match[1], "base64"), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
