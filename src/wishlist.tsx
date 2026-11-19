import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { products } from "./data";

const KEY = "luma-wishlist";
const known = (slug: unknown): slug is string =>
  typeof slug === "string" && products.some((product) => product.slug === slug);

function load(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter(known))] : [];
  } catch {
    return [];
  }
}

type WishlistValue = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  addMany: (slugs: string[]) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {
      // Storage can be blocked (private mode); the wishlist still works for this visit.
    }
  }, [slugs]);

  const toggle = useCallback(
    (slug: string) =>
      setSlugs((current) =>
        current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
      ),
    [],
  );
  const addMany = useCallback(
    (more: string[]) => setSlugs((current) => [...new Set([...current, ...more.filter(known)])]),
    [],
  );

  const value = useMemo<WishlistValue>(
    () => ({ slugs, has: (slug) => slugs.includes(slug), toggle, addMany }),
    [slugs, toggle, addMany],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}

/** Heart toggle. Sits on top of cards, so it stops the click reaching the card's link. */
export function HeartButton({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(slug);
      }}
      className={`grid h-11 w-11 place-items-center rounded-full bg-[#f2efe8]/90 text-[#1d241f] transition hover:bg-white ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={saved ? "#9b7139" : "none"}
        stroke={saved ? "#9b7139" : "currentColor"}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
      </svg>
    </button>
  );
}
