// Vercel serverless function: POST /api/contact
// Handles both the enquiry form and the newsletter sign-up, and emails the
// studio through Resend (https://resend.com). Needs RESEND_API_KEY and ENQUIRY_TO.

const MAX = { name: 120, email: 200, phone: 40, projectType: 60, message: 5000 };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

async function sendMail(options: {
  subject: string;
  replyTo?: string;
  lines: [label: string, value: string][];
}) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  if (!key || !to) throw new Error("Email service is not configured.");

  const html = options.lines
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const text = options.lines.map(([label, value]) => `${label}: ${value}`).join("\n\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM || "Luma Website <onboarding@resend.dev>",
      to: [to],
      subject: options.subject,
      reply_to: options.replyTo,
      html,
      text,
    }),
  });

  if (!response.ok) {
    console.error("Resend error", response.status, await response.text());
    throw new Error("Email provider rejected the message.");
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  // Honeypot: real visitors never see or fill this field. Pretend success to bots.
  if (clean(body.website, 200)) return json({ ok: true });

  const email = clean(body.email, MAX.email);
  if (!isEmail(email)) return json({ error: "Please enter a valid email address." }, 400);

  try {
    if (body.type === "subscribe") {
      await sendMail({
        subject: "New newsletter sign-up",
        replyTo: email,
        lines: [["Email", email]],
      });
      return json({ ok: true });
    }

    if (body.type === "enquiry") {
      const name = clean(body.name, MAX.name);
      const phone = clean(body.phone, MAX.phone);
      const projectType = clean(body.projectType, MAX.projectType);
      const message = clean(body.message, MAX.message);
      if (!name || !projectType || !message) {
        return json({ error: "Please fill in all required fields." }, 400);
      }
      await sendMail({
        subject: `New enquiry from ${name} (${projectType})`,
        replyTo: email,
        lines: [
          ["Name", name],
          ["Email", email],
          ["Phone", phone || "Not provided"],
          ["Project type", projectType],
          ["Message", message],
        ],
      });
      return json({ ok: true });
    }

    return json({ error: "Unknown request type." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "We couldn't send that just now. Please try again shortly." }, 500);
  }
}
