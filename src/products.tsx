import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products as defaults, type Product } from "./data";

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

export function applyOverrides(overrides: Override[]): ShopProduct[] {
  return defaults.map((product) => {
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
  });
}

const ProductsContext = createContext<ShopProduct[]>(applyOverrides([]));

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Override[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : { overrides: [] }))
      .then((data: { overrides?: Override[] }) => {
        if (!cancelled && Array.isArray(data.overrides)) setOverrides(data.overrides);
      })
      .catch(() => undefined); // keep the built-in products if the request fails
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => applyOverrides(overrides), [overrides]);
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export const useProducts = () => useContext(ProductsContext);
