// Vercel serverless function: POST /api/admin/logout
// Clears the admin session cookie.

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Set-Cookie": "luma_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    },
  });
}
