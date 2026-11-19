import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProducts, type ShopProduct } from "./products";

export type CartLine = { slug: string; finish: string; qty: number };
export type CartItem = CartLine & { product: ShopProduct };

const STORAGE_KEY = "luma-cart";
export const MAX_QTY = 10;

function load(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (line) =>
          line &&
          typeof line.slug === "string" &&
          typeof line.finish === "string" &&
          Number.isInteger(line.qty) &&
          line.qty > 0 &&
          line.slug.length <= 80,
      )
      .map((line) => ({ ...line, qty: Math.min(line.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (slug: string, finish: string, qty?: number) => void;
  setQty: (slug: string, finish: string, qty: number) => void;
  remove: (slug: string, finish: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

const same = (a: CartLine, slug: string, finish: string) => a.slug === slug && a.finish === finish;

export function CartProvider({ children }: { children: ReactNode }) {
  const products = useProducts();
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be blocked (private mode); the cart still works for this visit.
    }
  }, [lines]);

  const add = useCallback((slug: string, finish: string, qty = 1) => {
    setLines((current) => {
      const existing = current.find((line) => same(line, slug, finish));
      if (existing) {
        return current.map((line) =>
          line === existing ? { ...line, qty: Math.min(line.qty + qty, MAX_QTY) } : line,
        );
      }
      return [...current, { slug, finish, qty: Math.min(qty, MAX_QTY) }];
    });
  }, []);

  const setQty = useCallback((slug: string, finish: string, qty: number) => {
    setLines((current) =>
      current.map((line) =>
        same(line, slug, finish) ? { ...line, qty: Math.max(1, Math.min(qty, MAX_QTY)) } : line,
      ),
    );
  }, []);

  const remove = useCallback((slug: string, finish: string) => {
    setLines((current) => current.filter((line) => !same(line, slug, finish)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const items = lines.flatMap((line) => {
      const product = products.find((item) => item.slug === line.slug);
      return product && product.available ? [{ ...line, product }] : [];
    });
    return {
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal: items.reduce((sum, item) => sum + item.qty * item.product.price, 0),
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, products, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
