import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePageTitle } from "./router";
import { formatCedis } from "./data";

const STATUSES = [
  ["paid", "Paid"],
  ["in_production", "In production"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
] as const;

type Status = (typeof STATUSES)[number][0];

type Order = {
  id: string;
  reference: string;
  status: Status;
  amount_ghs: number;
  subtotal_ghs: number;
  delivery_fee_ghs: number;
  delivery_zone: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  items: { name: string; finish: string; qty: number; unitPrice: number }[];
  created_at: string;
};

const statusLabel = (status: string) => STATUSES.find(([value]) => value === status)?.[1] ?? status;

export default function AdminPage() {
  usePageTitle("Admin");
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Keep this page out of search engines.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/orders");
      if (response.status === 401) {
        setPhase("login");
        return;
      }
      const data = (await response.json()) as { orders?: Order[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Couldn't load orders.");
      setOrders(data.orders ?? []);
      setError("");
      setPhase("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load orders.");
      setPhase("ready");
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Couldn't sign in.");
      setPassword("");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setOrders([]);
    setPhase("login");
  };

  const changeStatus = async (order: Order, status: Status) => {
    const previous = order.status;
    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status } : item)));
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status }),
      });
      if (response.status === 401) return setPhase("login");
      if (!response.ok) throw new Error();
    } catch {
      setError("Couldn't update that order. Please try again.");
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status: previous } : item)),
      );
    }
  };

  if (phase === "checking") {
    return (
      <section className="site-container py-24 text-center text-sm text-[#5b625b]" role="status">
        Loading…
      </section>
    );
  }

  if (phase === "login") {
    return (
      <section className="site-container max-w-md py-24 sm:py-32">
        <p className="eyebrow mb-5 text-[#9b7139]">Studio admin</p>
        <h1 className="page-title mb-10">
          Sign <em>in.</em>
        </h1>
        <form onSubmit={login} className="bg-[#ddd8cc] p-7 sm:p-10">
          <label className="form-field">
            <span>Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="mt-5 text-sm text-[#8a3b2a]">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="mt-8 w-full bg-[#1d241f] px-6 py-5 text-xs font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139] disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    );
  }

  const visible = filter === "all" ? orders : orders.filter((order) => order.status === filter);
  const revenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + Number(order.amount_ghs), 0);

  return (
    <section className="site-container py-16 sm:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-5 text-[#9b7139]">Studio admin</p>
          <h1 className="page-title">
            <em>Orders.</em>
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void loadOrders()}
            className="border border-[#1d241f]/30 px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em]"
          >
            Refresh
          </button>
          <button
            onClick={logout}
            className="bg-[#1d241f] px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-px bg-[#1d241f]/15 sm:grid-cols-3">
        {[
          ["Orders", String(orders.length)],
          ["Awaiting production", String(orders.filter((order) => order.status === "paid").length)],
          ["Total paid (excl. cancelled)", formatCedis(revenue)],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#f2efe8] p-6">
            <span className="eyebrow text-[#8b918b]">{label}</span>
            <p className="mt-3 font-display text-3xl">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-6 text-sm text-[#8a3b2a]">
          {error}
        </p>
      )}

      <div
        className="mb-8 flex flex-wrap gap-2 border-y border-[#1d241f]/15 py-4"
        role="group"
        aria-label="Filter by status"
      >
        {([["all", "All"], ...STATUSES] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[.15em] transition ${filter === value ? "bg-[#1d241f] text-white" : "hover:bg-[#ddd8cc]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="border-b border-[#1d241f]/20 py-16 text-center text-sm text-[#5b625b]">
          {orders.length === 0
            ? "No orders yet. Paid orders will appear here."
            : `No orders with status “${statusLabel(filter)}”.`}
        </p>
      ) : (
        <ul className="space-y-5">
          {visible.map((order) => (
            <li key={order.id} className="border border-[#1d241f]/20 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl">{order.reference}</p>
                  <p className="mt-1 text-xs text-[#686f68]">
                    {new Date(order.created_at).toLocaleString("en-GH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <label className="text-xs">
                  <span className="eyebrow mb-2 block text-[#8b918b]">Status</span>
                  <select
                    value={order.status}
                    onChange={(event) => void changeStatus(order, event.target.value as Status)}
                    className="border border-[#1d241f]/30 bg-transparent px-3 py-2 text-sm"
                  >
                    {STATUSES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-6 grid gap-8 text-sm leading-7 md:grid-cols-2">
                <div>
                  <span className="eyebrow text-[#8b918b]">Items</span>
                  <ul className="mt-2">
                    {order.items.map((item) => (
                      <li key={`${item.name}-${item.finish}`}>
                        {item.qty} × {item.name} · {item.finish} —{" "}
                        {formatCedis(item.unitPrice * item.qty)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[#686f68]">
                    Subtotal {formatCedis(Number(order.subtotal_ghs))} · Delivery{" "}
                    {formatCedis(Number(order.delivery_fee_ghs))}
                    {order.delivery_zone ? ` (${order.delivery_zone})` : ""}
                  </p>
                  <p className="mt-1 font-semibold">Total {formatCedis(Number(order.amount_ghs))}</p>
                </div>
                <div>
                  <span className="eyebrow text-[#8b918b]">Customer</span>
                  <p className="mt-2">
                    {order.customer_name}
                    <br />
                    {order.customer_email && (
                      <a href={`mailto:${order.customer_email}`} className="underline">
                        {order.customer_email}
                      </a>
                    )}
                    <br />
                    {order.customer_phone && (
                      <a href={`tel:${order.customer_phone}`} className="underline">
                        {order.customer_phone}
                      </a>
                    )}
                  </p>
                  <p className="mt-3">
                    {order.address}
                    {order.city ? `, ${order.city}` : ""}
                  </p>
                  {order.notes && <p className="mt-3 text-[#686f68]">Notes: {order.notes}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
