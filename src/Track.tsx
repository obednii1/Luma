import { useState, type FormEvent } from "react";
import { usePageTitle } from "./router";
import { formatCedis } from "./data";

type Tracked = {
  reference: string;
  status: string;
  created_at: string;
  items: { name: string; finish: string; qty: number; unitPrice: number }[];
  subtotal_ghs: number;
  delivery_fee_ghs: number;
  amount_ghs: number;
  delivery_zone: string | null;
  city: string | null;
  tracking_note?: string | null;
};

const STEPS = [
  ["paid", "Order received", "Payment confirmed."],
  ["in_production", "In production", "Your piece is being made to order."],
  ["shipped", "Shipped", "On its way to you."],
  ["delivered", "Delivered", "Enjoy your new lighting."],
] as const;

export function TrackPage() {
  usePageTitle("Track your order");
  const params = new URLSearchParams(window.location.search);
  const [reference, setReference] = useState(params.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Tracked | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
      });
      const data = (await response.json().catch(() => ({}))) as { order?: Tracked; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error ?? "Something went wrong.");
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = order ? STEPS.findIndex(([value]) => value === order.status) : -1;

  return (
    <section className="site-container max-w-3xl py-20 sm:py-28">
      <p className="eyebrow mb-5 text-[#9b7139]">Order status</p>
      <h1 className="page-title mb-6">
        Track your <em>order.</em>
      </h1>
      <p className="mb-10 max-w-xl text-[15px] leading-8 text-[#5b625b]">
        Enter your order number (it starts with LUMA-) and the email you used at checkout.
      </p>

      <form onSubmit={submit} className="grid gap-6 bg-[#ddd8cc] p-6 sm:p-10">
        <label className="form-field">
          <span>Order number</span>
          <input
            required
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="LUMA-ABCD1234"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-[#8a3b2a]">
            {error}
          </p>
        )}
        <button
          disabled={busy}
          className="w-full bg-[#1d241f] px-6 py-5 text-xs font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139] disabled:opacity-60"
        >
          {busy ? "Looking…" : "Track order"}
        </button>
      </form>

      {order && (
        <div className="mt-12 min-w-0 [overflow-wrap:anywhere]" role="status">
          <p className="font-display text-3xl">{order.reference}</p>
          <p className="mt-1 text-xs text-[#686f68]">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString("en-GH", { dateStyle: "long" })}
            {order.city ? ` · Delivering to ${order.city}` : ""}
          </p>

          {order.status === "cancelled" ? (
            <p className="mt-8 border border-[#8a3b2a]/40 p-5 text-sm text-[#8a3b2a]">
              This order was cancelled. Please contact us if you have questions.
            </p>
          ) : (
            <ol className="mt-8 border-l border-[#1d241f]/25">
              {STEPS.map(([value, label, text], index) => {
                const done = index <= stepIndex;
                const current = index === stepIndex;
                return (
                  <li key={value} className="relative pb-8 pl-8 last:pb-0" aria-current={current ? "step" : undefined}>
                    <span
                      className={`absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full border ${done ? "border-[#9b7139] bg-[#9b7139]" : "border-[#1d241f]/30 bg-[#f2efe8]"}`}
                    />
                    <p className={`text-sm font-semibold ${done ? "" : "text-[#8b918b]"}`}>
                      {label}
                      {current && <span className="ml-2 text-xs font-normal text-[#9b7139]">Current</span>}
                    </p>
                    <p className={`text-sm ${done ? "text-[#5b625b]" : "text-[#a3a8a2]"}`}>{text}</p>
                  </li>
                );
              })}
            </ol>
          )}

          {order.tracking_note && (
            <p className="mt-8 border-l-2 border-[#9b7139] bg-[#ddd8cc] p-5 text-sm leading-7">
              <b className="eyebrow mb-1 block text-[#8b918b]">Message from the studio</b>
              {order.tracking_note}
            </p>
          )}

          <ul className="mt-10 space-y-2 border-y border-[#1d241f]/20 py-6 text-sm">
            {order.items.map((item) => (
              <li key={`${item.name}-${item.finish}`} className="flex justify-between gap-4">
                <span>
                  {item.name} · {item.finish}
                </span>
                <span className="shrink-0">× {item.qty}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[#686f68]">
            Subtotal {formatCedis(Number(order.subtotal_ghs))} · Delivery{" "}
            {formatCedis(Number(order.delivery_fee_ghs))}
          </p>
          <p className="mt-1 text-sm font-semibold">Total {formatCedis(Number(order.amount_ghs))}</p>
        </div>
      )}
    </section>
  );
}
