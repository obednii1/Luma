import { useEffect, useState, type FormEvent } from "react";
import { formatCedis } from "./data";
import { customImage, type CustomProduct } from "./products";

type Draft = {
  name: string;
  type: string;
  price: string;
  description: string;
  leadTime: string;
  finishes: string;
  dimensions: string;
  warranty: string;
  available: boolean;
};

const EMPTY: Draft = {
  name: "",
  type: "Pendant",
  price: "",
  description: "",
  leadTime: "6–8 weeks",
  finishes: "",
  dimensions: "",
  warranty: "5 years",
  available: true,
};

const toDraft = (p: CustomProduct): Draft => ({
  name: p.name,
  type: p.type,
  price: String(p.price_ghs),
  description: p.description,
  leadTime: p.lead_time,
  finishes: p.finishes.join(", "),
  dimensions: p.dimensions,
  warranty: p.warranty,
  available: p.available,
});

/** Shrinks a photo in the browser so it uploads quickly: max 1200px, JPEG. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file isn't a photo we can read."));
      el.src = url;
    });
    const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process the photo.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.75, 0.65, 0.5]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length < 800_000) return data;
    }
    throw new Error("That photo is too large. Try a smaller one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CustomEditor({
  product,
  onSaved,
  onDeleted,
  onCancel,
  onUnauthorized,
}: {
  product?: CustomProduct;
  onSaved: (product: CustomProduct) => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  onUnauthorized: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(product ? toDraft(product) : EMPTY);
  const [photo, setPhoto] = useState<string | null>(null); // newly chosen photo (data URL)
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage(null);
  };

  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    try {
      setPhoto(await shrink(file));
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Couldn't read that photo." });
    }
  };

  const request = async (init: RequestInit, url = "/api/admin/custom-products") => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, init);
      if (response.status === 401) {
        onUnauthorized();
        return null;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string; product?: CustomProduct };
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
    if (!product && !photo) return setMessage({ ok: false, text: "Please add a photo." });
    const data = await request({
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: product?.slug,
        name: draft.name,
        type: draft.type,
        price_ghs: Number(draft.price),
        description: draft.description,
        lead_time: draft.leadTime,
        finishes: draft.finishes.split(",").map((item) => item.trim()).filter(Boolean),
        dimensions: draft.dimensions,
        warranty: draft.warranty,
        available: draft.available,
        ...(photo ? { image: photo } : {}),
      }),
    });
    if (data?.product) {
      onSaved(data.product);
      setPhoto(null);
      if (product) setMessage({ ok: true, text: "Saved. The shop now shows these changes." });
      else setDraft(EMPTY);
    }
  };

  const remove = async () => {
    if (!product || !window.confirm(`Delete "${product.name}" from the shop? This can't be undone.`)) return;
    const data = await request({ method: "DELETE" }, `/api/admin/custom-products?slug=${product.slug}`);
    if (data) onDeleted?.();
  };

  const preview = photo ?? (product ? customImage(product) : null);

  return (
    <form onSubmit={save} className="grid min-w-0 gap-6 md:grid-cols-[140px_minmax(0,1fr)] md:gap-8">
      <div className="flex items-start gap-4 md:block">
        {preview ? (
          <img src={preview} alt="" className="aspect-[4/5] w-24 object-cover md:w-full" />
        ) : (
          <div className="grid aspect-[4/5] w-24 place-items-center bg-[#ddd8cc] text-center text-[10px] text-[#686f68] md:w-full">
            No photo yet
          </div>
        )}
        <label className="block min-w-0 text-xs text-[#686f68] md:mt-3">
          <span className="mb-1 block font-bold uppercase tracking-[.14em]">{product ? "Change photo" : "Photo"}</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full min-w-0 text-xs"
            onChange={(event) => void choosePhoto(event.target.files?.[0])}
          />
        </label>
      </div>

      <div className="grid min-w-0 gap-5">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px_160px]">
          <label className="form-field">
            <span>Name</span>
            <input required maxLength={80} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="form-field">
            <span>Type</span>
            <select value={draft.type} onChange={(e) => set("type", e.target.value)}>
              {["Pendant", "Wall", "Table", "Floor"].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Price (GH₵)</span>
            <input
              required
              inputMode="numeric"
              value={draft.price}
              onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))}
            />
          </label>
        </div>
        <label className="form-field">
          <span>Description</span>
          <textarea required rows={4} maxLength={800} value={draft.description} onChange={(e) => set("description", e.target.value)} />
        </label>
        <label className="form-field">
          <span>Finishes (separate with commas)</span>
          <input
            required
            placeholder="Aged brass, Blackened bronze"
            value={draft.finishes}
            onChange={(e) => set("finishes", e.target.value)}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="form-field">
            <span>Dimensions</span>
            <input required maxLength={60} placeholder="Ø 480mm" value={draft.dimensions} onChange={(e) => set("dimensions", e.target.value)} />
          </label>
          <label className="form-field">
            <span>Lead time</span>
            <input required maxLength={40} value={draft.leadTime} onChange={(e) => set("leadTime", e.target.value)} />
          </label>
          <label className="form-field">
            <span>Warranty</span>
            <input required maxLength={40} value={draft.warranty} onChange={(e) => set("warranty", e.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5 shrink-0" checked={draft.available} onChange={(e) => set("available", e.target.checked)} />
          Available to buy (untick to hide it from the shop)
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={busy}
            className="bg-[#1d241f] px-6 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139] disabled:opacity-40"
          >
            {busy ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="border border-[#1d241f]/30 px-5 py-4 text-[10px] font-bold uppercase tracking-[.16em]">
              Cancel
            </button>
          )}
          {product && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className="border border-[#8a3b2a]/50 px-5 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-[#8a3b2a] disabled:opacity-40"
              >
                Delete
              </button>
              <span className="text-xs text-[#686f68]">Current price {formatCedis(product.price_ghs)}</span>
            </>
          )}
        </div>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={`text-sm ${message.ok ? "text-[#4a6b3a]" : "text-[#8a3b2a]"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}

export default function AdminCustomProducts({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [list, setList] = useState<CustomProduct[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/custom-products")
      .then(async (response) => {
        if (response.status === 401) return onUnauthorized();
        const data = (await response.json()) as { custom?: CustomProduct[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Couldn't load your added products.");
        if (!cancelled) setList(data.custom ?? []);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : "Couldn't load your added products."));
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  return (
    <div className="mt-16 border-t border-[#1d241f]/15 pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-[#9b7139]">Your own products</p>
          <h2 className="font-display text-3xl">Added products</h2>
        </div>
        {!adding && !error && (
          <button
            onClick={() => setAdding(true)}
            className="bg-[#1d241f] px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139]"
          >
            + Add a product
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#8a3b2a]">
          {error}
        </p>
      )}

      {adding && (
        <div className="mb-5 border border-[#9b7139]/60 p-5 sm:p-8">
          <CustomEditor
            onUnauthorized={onUnauthorized}
            onCancel={() => setAdding(false)}
            onSaved={(saved) => {
              setList((current) => [...(current ?? []), saved]);
              setAdding(false);
            }}
          />
        </div>
      )}

      {list && list.length === 0 && !adding && (
        <p className="border-y border-[#1d241f]/15 py-10 text-center text-sm text-[#5b625b]">
          You haven't added any products yet.
        </p>
      )}

      {list && list.length > 0 && (
        <ul className="space-y-5">
          {list.map((product) => (
            <li key={product.slug} className="min-w-0 border border-[#1d241f]/20 p-5 sm:p-8">
              <CustomEditor
                product={product}
                onUnauthorized={onUnauthorized}
                onSaved={(saved) =>
                  setList((current) => (current ?? []).map((item) => (item.slug === saved.slug ? saved : item)))
                }
                onDeleted={() => setList((current) => (current ?? []).filter((item) => item.slug !== product.slug))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The full product list, once all products live in the database (supabase/catalog.sql). */
export function Catalog({
  initial,
  onUnauthorized,
}: {
  initial: CustomProduct[];
  onUnauthorized: () => void;
}) {
  const [list, setList] = useState(initial);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-sm leading-7 text-[#5b625b]">
          Every product can be edited here: photo, finishes, price and text. Changes reach the
          website within a few seconds.
        </p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="bg-[#1d241f] px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139]"
          >
            + Add a product
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-5 border border-[#9b7139]/60 p-5 sm:p-8">
          <CustomEditor
            onUnauthorized={onUnauthorized}
            onCancel={() => setAdding(false)}
            onSaved={(saved) => {
              setList((current) => [...current, saved]);
              setAdding(false);
            }}
          />
        </div>
      )}

      {list.length === 0 && !adding ? (
        <p className="border-y border-[#1d241f]/15 py-10 text-center text-sm text-[#5b625b]">
          No products yet. Add your first one.
        </p>
      ) : (
        <ul className="space-y-5">
          {list.map((product) => (
            <li key={product.slug} className="min-w-0 border border-[#1d241f]/20 p-5 sm:p-8">
              <CustomEditor
                product={product}
                onUnauthorized={onUnauthorized}
                onSaved={(saved) =>
                  setList((current) => current.map((item) => (item.slug === saved.slug ? saved : item)))
                }
                onDeleted={() => setList((current) => current.filter((item) => item.slug !== product.slug))}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
