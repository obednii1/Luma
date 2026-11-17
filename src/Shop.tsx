import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "./Layout";
import { Link, usePageTitle } from "./router";
import { MAX_QTY, useCart } from "./cart";
import { deliveryZones, formatCedis } from "./data";
import { postJson } from "./api";

function DemoBanner() {
  return (
    <div
      role="note"
      className="mb-10 border border-[#9b7139]/40 bg-[#ddd8cc] px-5 py-4 text-xs leading-6 text-[#5b625b]"
    >
      <b className="text-[#1d241f]">Portfolio demo.</b> Checkout runs in Paystack test mode, so no
      real money is taken and nothing will be delivered.
    </div>
  );
}

export function CartPage() {
  usePageTitle("Cart");
  const { items, subtotal, setQty, remove } = useCart();

  return (
    <section className="site-container py-16 sm:py-24">
      <p className="eyebrow mb-5 text-[#9b7139]">Your selection</p>
      <h1 className="page-title mb-12">
        Your <em>cart.</em>
      </h1>
      <DemoBanner />

      {items.length === 0 ? (
        <div className="border-y border-[#1d241f]/20 py-20 text-center">
          <p className="font-display text-3xl">Your cart is empty.</p>
          <Link to="/collections" className="text-link mt-8">
            Browse the collection <Icon name="arrow" size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1.5fr_.5fr] lg:gap-20">
          <ul className="border-t border-[#1d241f]/20">
            {items.map(({ slug, finish, qty, product }) => (
              <li
                key={`${slug}-${finish}`}
                className="grid grid-cols-[88px_1fr] gap-5 border-b border-[#1d241f]/20 py-6 sm:grid-cols-[110px_1fr_auto]"
              >
                <Link to={`/collections/${slug}`} className="block aspect-[4/5] bg-[#ddd8cc]">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </Link>
                <div>
                  <Link to={`/collections/${slug}`} className="font-display text-2xl">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-[10px] uppercase tracking-[.15em] text-[#777d77]">
                    {product.type} · {finish}
                  </p>
                  <div className="mt-5 inline-flex items-center border border-[#1d241f]/25">
                    <button
                      onClick={() => setQty(slug, finish, qty - 1)}
                      disabled={qty <= 1}
                      aria-label={`Decrease quantity of ${product.name}`}
                      className="h-10 w-10 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(slug, finish, qty + 1)}
                      disabled={qty >= MAX_QTY}
                      aria-label={`Increase quantity of ${product.name}`}
                      className="h-10 w-10 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:block sm:text-right">
                  <p className="text-sm">{formatCedis(product.price * qty)}</p>
                  <button
                    onClick={() => remove(slug, finish)}
                    className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9b7139] sm:mt-4"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="self-start bg-[#ddd8cc] p-7">
            <span className="eyebrow">Order summary</span>
            <div className="mt-6 flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCedis(subtotal)}</span>
            </div>
            <p className="mt-3 text-xs leading-6 text-[#686f68]">
              Delivery is calculated at checkout.
            </p>
            <Link
              to="/checkout"
              className="mt-8 flex w-full items-center justify-between bg-[#1d241f] px-6 py-5 text-xs font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139]"
            >
              Checkout <Icon name="arrow" size={18} />
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

const emptyForm = { name: "", email: "", phone: "", address: "", city: "", notes: "" };

export function CheckoutPage() {
  usePageTitle("Checkout");
  const { items, subtotal } = useCart();
  const [form, setForm] = useState(emptyForm);
  const [zone, setZone] = useState(deliveryZones[0].id);
  const [website, setWebsite] = useState(""); // honeypot, left empty by real visitors
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fee = deliveryZones.find((item) => item.id === zone)?.fee ?? 0;

  const field =
    (key: keyof typeof emptyForm) =>
    (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const { url } = await postJson<{ url: string }>("/api/checkout", {
        items: items.map(({ slug, finish, qty }) => ({ slug, finish, qty })),
        customer: form,
        zone,
        website,
      });
      window.location.href = url; // hand over to Paystack's hosted payment page
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="site-container py-24 text-center">
        <p className="font-display text-3xl">Your cart is empty.</p>
        <Link to="/collections" className="text-link mt-8">
          Browse the collection <Icon name="arrow" size={18} />
        </Link>
      </section>
    );
  }

  return (
    <section className="site-container py-16 sm:py-24">
      <p className="eyebrow mb-5 text-[#9b7139]">Almost there</p>
      <h1 className="page-title mb-12">
        <em>Checkout.</em>
      </h1>
      <DemoBanner />

      <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr] lg:gap-20">
        <form onSubmit={submit} className="bg-[#ddd8cc] p-7 sm:p-12">
          <div className="grid gap-7 sm:grid-cols-2">
            <label className="form-field">
              <span>Full name *</span>
              <input required autoComplete="name" value={form.name} onChange={field("name")} />
            </label>
            <label className="form-field">
              <span>Email *</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={field("email")}
              />
            </label>
            <label className="form-field">
              <span>Phone *</span>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={field("phone")}
              />
            </label>
            <label className="form-field">
              <span>Delivery area *</span>
              <select value={zone} onChange={(event) => setZone(event.target.value)}>
                {deliveryZones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field sm:col-span-2">
              <span>Delivery address *</span>
              <input
                required
                autoComplete="street-address"
                value={form.address}
                onChange={field("address")}
              />
            </label>
            <label className="form-field sm:col-span-2">
              <span>Town / city *</span>
              <input
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={field("city")}
              />
            </label>
            <label className="form-field sm:col-span-2">
              <span>Notes (optional)</span>
              <textarea rows={3} value={form.notes} onChange={field("notes")} />
            </label>
          </div>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          {error && (
            <p role="alert" className="mt-6 text-sm text-[#8a3b2a]">
              {error}
            </p>
          )}
          <button
            disabled={sending}
            className="mt-8 flex w-full items-center justify-between bg-[#1d241f] px-6 py-5 text-xs font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139] disabled:opacity-60"
          >
            {sending ? "Redirecting to Paystack…" : `Pay ${formatCedis(subtotal + fee)}`}
            <Icon name="arrow" size={18} />
          </button>
        </form>

        <aside className="self-start border border-[#1d241f]/20 p-7">
          <span className="eyebrow">Your order</span>
          <ul className="mt-6 space-y-4 text-sm">
            {items.map(({ slug, finish, qty, product }) => (
              <li key={`${slug}-${finish}`} className="flex justify-between gap-4">
                <span>
                  {product.name} × {qty}
                  <span className="block text-[10px] uppercase tracking-[.15em] text-[#777d77]">
                    {finish}
                  </span>
                </span>
                <span>{formatCedis(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-[#1d241f]/20 pt-5 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCedis(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatCedis(fee)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatCedis(subtotal + fee)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

type Verified = {
  status: string;
  reference: string;
  amount: number;
  customerName?: string;
  items?: { name: string; finish: string; qty: number }[];
};

export function SuccessPage() {
  usePageTitle("Order");
  const { clear } = useCart();
  const reference = new URLSearchParams(window.location.search).get("reference") ?? "";
  const [state, setState] = useState<"loading" | "paid" | "failed" | "error">(
    reference ? "loading" : "error",
  );
  const [order, setOrder] = useState<Verified | null>(null);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    fetch(`/api/verify?reference=${encodeURIComponent(reference)}`)
      .then((response) => response.json())
      .then((data: Verified) => {
        if (cancelled) return;
        setOrder(data);
        if (data.status === "success") {
          clear();
          setState("paid");
        } else {
          setState("failed");
        }
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [reference, clear]);

  return (
    <section className="site-container max-w-3xl py-24 text-center sm:py-32">
      {state === "loading" && (
        <p role="status" className="text-sm text-[#5b625b]">
          Confirming your payment…
        </p>
      )}

      {state === "paid" && order && (
        <>
          <p className="eyebrow mb-5 text-[#9b7139]">Payment received</p>
          <h1 className="page-title">
            Thank <em>you.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-md text-sm leading-8 text-[#5b625b]">
            {order.customerName ? `${order.customerName}, your` : "Your"} test order{" "}
            <b>{order.reference}</b> for {formatCedis(order.amount)} was paid successfully. This is
            a portfolio demo, so nothing will actually be made or delivered.
          </p>
          {order.items && (
            <ul className="mx-auto mt-8 max-w-sm space-y-2 border-y border-[#1d241f]/20 py-6 text-left text-sm">
              {order.items.map((item) => (
                <li key={`${item.name}-${item.finish}`} className="flex justify-between">
                  <span>
                    {item.name} · {item.finish}
                  </span>
                  <span>× {item.qty}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/collections" className="text-link mt-10">
            Continue browsing <Icon name="arrow" size={18} />
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <p className="eyebrow mb-5 text-[#9b7139]">Payment not completed</p>
          <h1 className="page-title">
            Not <em>quite.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-md text-sm leading-8 text-[#5b625b]">
            We couldn’t confirm that payment, and you haven’t been charged. Your cart is still
            saved.
          </p>
          <Link to="/cart" className="text-link mt-10">
            Back to cart <Icon name="arrow" size={18} />
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <p className="eyebrow mb-5 text-[#9b7139]">Order status</p>
          <h1 className="page-title">
            Something <em>went wrong.</em>
          </h1>
          <p className="mx-auto mt-8 max-w-md text-sm leading-8 text-[#5b625b]">
            We couldn’t check your order just now. If you completed a payment, please contact us
            with your payment reference.
          </p>
          <Link to="/contact" className="text-link mt-10">
            Contact us <Icon name="arrow" size={18} />
          </Link>
        </>
      )}
    </section>
  );
}
