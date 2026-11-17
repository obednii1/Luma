// Vercel serverless function: POST /api/paystack-webhook
// Paystack calls this when a payment succeeds. We check the signature so only
// Paystack can trigger it, save the order in the database (once), then email the studio.
// Set the webhook URL in the Paystack dashboard (Settings → API Keys & Webhooks).

import { createHmac, timingSafeEqual } from "node:crypto";

type Metadata = {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    notes?: string;
  };
  items?: { name: string; finish: string; qty: number; unitPrice: number }[];
  delivery?: { zone?: string; fee?: number };
  subtotal?: number;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cedis = (amount: number) => `GH₵${amount.toLocaleString("en-GH")}`;

async function sendMail(to: string, subject: string, lines: string[], replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM || "Luma Website <onboarding@resend.dev>",
      to: [to],
      subject,
      reply_to: replyTo,
      html: lines.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`).join(""),
      text: lines.join("\n\n"),
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

/**
 * Saves the order. Returns true if it was newly saved, false if we already had it
 * (Paystack can send the same event more than once). If no database is configured
 * yet, returns true so the email still goes out.
 */
async function saveOrder(row: Record<string, unknown>): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return true;

  const response = await fetch(`${url}/rest/v1/orders?on_conflict=reference`, {
    method: "POST",
    headers: {
      apikey: key,
      ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) throw new Error(`Database ${response.status}: ${await response.text()}`);
  const inserted = (await response.json()) as unknown[];
  return inserted.length > 0;
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return new Response("Not configured", { status: 500 });

  // Verify the request really came from Paystack (HMAC-SHA512 of the raw body).
  const raw = await request.text();
  const signature = Buffer.from(request.headers.get("x-paystack-signature") ?? "");
  const expected = Buffer.from(createHmac("sha512", secret).update(raw).digest("hex"));
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: {
    event?: string;
    data?: { reference?: string; amount?: number; currency?: string; metadata?: Metadata };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  // Ignore every event except a successful charge.
  if (event.event !== "charge.success" || !event.data) return new Response("ok");

  const { reference = "unknown", amount = 0, currency, metadata = {} } = event.data;
  if (currency !== "GHS" || !/^LUMA-[A-Z0-9]{8}$/.test(reference)) return new Response("ignored");

  const customer = metadata.customer ?? {};
  const items = metadata.items ?? [];

  // 1) Save the order. If this fails we return an error so Paystack retries later.
  let isNew: boolean;
  try {
    isNew = await saveOrder({
      reference,
      status: "paid",
      amount_ghs: amount / 100,
      subtotal_ghs: metadata.subtotal ?? 0,
      delivery_fee_ghs: metadata.delivery?.fee ?? 0,
      delivery_zone: metadata.delivery?.zone ?? null,
      customer_name: customer.name ?? null,
      customer_email: customer.email ?? null,
      customer_phone: customer.phone ?? null,
      address: customer.address ?? null,
      city: customer.city ?? null,
      notes: customer.notes || null,
      items,
    });
  } catch (error) {
    console.error("Saving order failed", error);
    return new Response("Database error", { status: 500 });
  }
  if (!isNew) return new Response("duplicate"); // already saved and emailed

  // 2) Email the studio. The order is already safe in the database, so a failed
  //    email is logged but doesn't make Paystack retry.
  const orderLines = items.map(
    (item) => `${item.qty} × ${item.name} (${item.finish}) — ${cedis(item.unitPrice * item.qty)}`,
  );
  const summary = [
    `Order ${reference} (Paystack test mode)`,
    `Items:\n${orderLines.join("\n") || "—"}`,
    `Subtotal: ${cedis(metadata.subtotal ?? 0)}\nDelivery (${metadata.delivery?.zone ?? "—"}): ${cedis(
      metadata.delivery?.fee ?? 0,
    )}\nTotal paid: ${cedis(amount / 100)}`,
  ];

  try {
    const owner = process.env.ENQUIRY_TO;
    if (owner) {
      await sendMail(
        owner,
        `New paid order ${reference} — ${cedis(amount / 100)}`,
        [
          ...summary,
          `Customer: ${customer.name ?? "—"}\nEmail: ${customer.email ?? "—"}\nPhone: ${customer.phone ?? "—"}`,
          `Deliver to: ${customer.address ?? "—"}, ${customer.city ?? "—"}`,
          `Notes: ${customer.notes || "None"}`,
        ],
        customer.email,
      );
    }

    // Customer confirmation only works once you've verified your own sending domain in Resend
    // and set ENQUIRY_FROM; the free test sender can only deliver to your own inbox.
    if (process.env.ENQUIRY_FROM && customer.email) {
      await sendMail(customer.email, `Your Luma order ${reference}`, [
        `Thank you${customer.name ? `, ${customer.name.split(" ")[0]}` : ""}. We've received your payment.`,
        ...summary,
        "This is a portfolio demo order, so nothing will be delivered.",
      ]);
    }
  } catch (error) {
    console.error("Order email failed (order is saved)", error);
  }

  return new Response("ok");
}
