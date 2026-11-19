import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products as defaults, type Product, type ProductType } from "./data";

export type ShopProduct = Product & { available: boolean };

/** A product change saved from the admin page (see api/products.ts). */
export type Override = {
  slug: string;
  name: string;
  price_ghs: number;
  description: string;
  lead_time: string;
  available: boolean;
};

/** A product added from the admin page (see api/admin/custom-products.ts). */
export type CustomProduct = {
  slug: string;
  name: string;
  type: ProductType;
  price_ghs: number;
  description: string;
  lead_time: string;
  finishes: string[];
  dimensions: string;
  warranty: string;
  available: boolean;
  image_version: number;
  image_url?: string | null;
};

export const customImage = (c: Pick<CustomProduct, "slug" | "image_version" | "image_url">) =>
  c.image_url || `/api/product-image?slug=${encodeURIComponent(c.slug)}&v=${c.image_version}`;

export function applyOverrides(
  overrides: Override[],
  custom: CustomProduct[] = [],
  mode: "builtin" | "database" = "builtin",
): ShopProduct[] {
  const added: ShopProduct[] = custom.map((c) => ({
    slug: c.slug,
    name: c.name,
    type: c.type,
    price: Number(c.price_ghs),
    image: customImage(c),
    description: c.description,
    finishes: c.finishes,
    dimensions: c.dimensions,
    leadTime: c.lead_time,
    warranty: c.warranty,
    available: c.available,
  }));
  // Once the catalogue is in the database, it is the only source of products.
  if (mode === "database") return added;
  return [...defaults.map((product) => {
    const o = overrides.find((item) => item.slug === product.slug);
    return o
      ? {
          ...product,
          name: o.name,
          price: Number(o.price_ghs),
          description: o.description,
          leadTime: o.lead_time,
          available: o.available,
        }
      : { ...product, available: true };
  }), ...added];
}

const ProductsContext = createContext<{ products: ShopProduct[]; loaded: boolean }>({
  products: applyOverrides([]),
  loaded: false,
});

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [custom, setCustom] = useState<CustomProduct[]>([]);
  const [mode, setMode] = useState<"builtin" | "database">("builtin");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : { overrides: [] }))
      .then((data: { overrides?: Override[]; custom?: CustomProduct[]; mode?: "builtin" | "database" }) => {
        if (cancelled) return;
        if (Array.isArray(data.overrides)) setOverrides(data.overrides);
        if (Array.isArray(data.custom)) setCustom(data.custom);
        if (data.mode === "database") setMode("database");
      })
      .catch(() => undefined) // keep the built-in products if the request fails
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ products: applyOverrides(overrides, custom, mode), loaded }),
    [overrides, custom, mode, loaded],
  );
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export const useProducts = () => useContext(ProductsContext).products;
export const useProductsLoaded = () => useContext(ProductsContext).loaded;
