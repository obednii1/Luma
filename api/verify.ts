// Vercel serverless function: GET /api/verify?reference=LUMA-XXXXXXXX
// Asks Paystack whether a payment really succeeded. Used only to show the
// customer a confirmation page; the order email is sent by the webhook.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function GET(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return json({ error: "Payments are not configured yet." }, 500);

  const reference = new URL(request.url).searchParams.get("reference") ?? "";
  if (!/^LUMA-[A-Z0-9]{8}$/.test(reference)) return json({ error: "Invalid reference." }, 400);

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const result = (await response.json().catch(() => null)) as {
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      reference?: string;
      metadata?: {
        customer?: { name?: string };
        items?: { name: string; finish: string; qty: number }[];
      };
    };
  } | null;

  if (!response.ok || !result?.data) {
    return json({ status: "unknown", reference }, 200);
  }

  const data = result.data;
  const paid = data.status === "success" && data.currency === "GHS";

  return json({
    status: paid ? "success" : (data.status ?? "unknown"),
    reference,
    amount: (data.amount ?? 0) / 100,
    customerName: data.metadata?.customer?.name?.split(" ")[0],
    items: data.metadata?.items?.map(({ name, finish, qty }) => ({ name, finish, qty })),
  });
}
