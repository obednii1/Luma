import { useEffect, useState, type FormEvent } from "react";
import { formatCedis, products as defaults } from "./data";
import { applyOverrides, type Override } from "./products";

type Draft = { name: string; price: string; description: string; leadTime: string; available: boolean };

const toDraft = (p: { name: string; price: number; description: string; leadTime: string; available: boolean }): Draft => ({
  name: p.name,
  price: String(p.price),
  description: p.description,
  leadTime: p.leadTime,
  available: p.available,
});

function ProductEditor({
  slug,
  current,
  edited,
  onSaved,
  onReset,
  onUnauthorized,
}: {
  slug: string;
  current: ReturnType<typeof applyOverrides>[number];
  edited: boolean;
  onSaved: (override: Override) => void;
  onReset: () => void;
  onUnauthorized: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(toDraft(current));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // When saved/reset from outside, re-sync the form.
  useEffect(() => setDraft(toDraft(current)), [current]);

  const changed = JSON.stringify(draft) !== JSON.stringify(toDraft(current));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage(null);
  };

  const call = async (init: RequestInit, url = "/api/admin/products") => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, init);
      if (response.status === 401) {
        onUnauthorized();
        return null;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string; override?: Override };
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      return data;
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const data = await call({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        name: draft.name,
        price_ghs: Number(draft.price),
        description: draft.description,
        lead_time: draft.leadTime,
        available: draft.available,
      }),
    });
    if (data?.override) {
      onSaved(data.override);
      setMessage({ ok: true, text: "Saved. The shop now shows these changes." });
    }
  };

  const reset = async () => {
    if (!window.confirm("Reset this product to its original name, price and text?")) return;
    const data = await call({ method: "DELETE" }, `/api/admin/products?slug=${slug}`);
    if (data) {
      onReset();
      setMessage({ ok: true, text: "Reset to the original." });
    }
  };

  const original = defaults.find((p) => p.slug === slug);

  return (
    <li className="min-w-0 border border-[#1d241f]/20 p-5 sm:p-8">
      <form onSubmit={save} className="grid min-w-0 gap-6 md:grid-cols-[140px_minmax(0,1fr)] md:gap-8">
        <div className="flex items-start gap-4 md:block">
          <img
            src={current.image}
            alt=""
            className="aspect-[4/5] w-24 object-cover md:w-full"
          />
          <p className="text-xs text-[#686f68] md:mt-3">
            {current.type}
            {edited && <span className="mt-1 block font-bold text-[#9b7139]">Edited</span>}
            {!current.available && <span className="mt-1 block font-bold text-[#8a3b2a]">Hidden</span>}
          </p>
        </div>

        <div className="grid min-w-0 gap-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="form-field">
              <span>Name</span>
              <input required maxLength={80} value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="form-field">
              <span>Price (GH₵)</span>
              <input
                required
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft.price}
                onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
              />
            </label>
          </div>
          <label className="form-field">
            <span>Description</span>
            <textarea
              required
              rows={4}
              maxLength={800}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Lead time</span>
            <input required maxLength={40} value={draft.leadTime} onChange={(e) => set("leadTime", e.target.value)} />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0"
              checked={draft.available}
              onChange={(e) => set("available", e.target.checked)}
            />
            Available to buy (untick to hide it from the shop)
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={busy || !changed}
              className="bg-[#1d241f] px-6 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139] disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            {edited && (
              <button
                type="button"
                disabled={busy}
                onClick={reset}
                className="border border-[#1d241f]/30 px-5 py-4 text-[10px] font-bold uppercase tracking-[.16em] disabled:opacity-40"
              >
                Reset to original
              </button>
            )}
            {original && (
              <span className="text-xs text-[#686f68]">Original price {formatCedis(original.price)}</span>
            )}
          </div>
          {message && (
            <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-[#4a6b3a]" : "text-[#8a3b2a]"}`}>
              {message.text}
            </p>
          )}
        </div>
      </form>
    </li>
  );
}

export default function AdminProducts({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [overrides, setOverrides] = useState<Override[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/products")
      .then(async (response) => {
        if (response.status === 401) return onUnauthorized();
        const data = (await response.json()) as { overrides?: Override[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Couldn't load products.");
        if (!cancelled) setOverrides(data.overrides ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load products.");
      });
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  if (error) {
    return (
      <p role="alert" className="border-y border-[#1d241f]/15 py-10 text-sm text-[#8a3b2a]">
        {error}
      </p>
    );
  }
  if (!overrides) return <p className="py-10 text-center text-sm text-[#5b625b]">Loading…</p>;

  const merged = applyOverrides(overrides);

  return (
    <>
      <p className="mb-8 max-w-2xl text-sm leading-7 text-[#5b625b]">
        Change a product's name, price, description or lead time, or hide it from the shop. Changes
        reach the website within a few seconds. Photos and finishes stay as they are.
      </p>
      <ul className="space-y-5">
        {merged.map((product) => (
          <ProductEditor
            key={product.slug}
            slug={product.slug}
            current={product}
            edited={overrides.some((o) => o.slug === product.slug)}
            onSaved={(saved) =>
              setOverrides((list) => [...(list ?? []).filter((o) => o.slug !== saved.slug), saved])
            }
            onReset={() => setOverrides((list) => (list ?? []).filter((o) => o.slug !== product.slug))}
            onUnauthorized={onUnauthorized}
          />
        ))}
      </ul>
    </>
  );
}
