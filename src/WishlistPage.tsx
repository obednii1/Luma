import { useState } from "react";
import { Icon } from "./Layout";
import { Link, usePageTitle } from "./router";
import { formatCedis, products as defaults } from "./data";
import { useCart } from "./cart";
import { useProducts } from "./products";
import { HeartButton, useWishlist } from "./wishlist";

export function WishlistPage() {
  usePageTitle("Wishlist");
  const all = useProducts();
  const { slugs, addMany, toggle } = useWishlist();
  const { add } = useCart();
  const [copied, setCopied] = useState(false);
  const [addedSlug, setAddedSlug] = useState("");

  // A shared link looks like /wishlist?items=arc-pendant-01,opal-rise
  const shared = (new URLSearchParams(window.location.search).get("items") ?? "")
    .split(",")
    .filter((slug) => defaults.some((product) => product.slug === slug));
  const [viewShared, setViewShared] = useState(shared.length > 0);
  const listSlugs = viewShared ? shared : slugs;
  const items = listSlugs.flatMap((slug) => {
    const product = all.find((item) => item.slug === slug);
    return product ? [product] : [];
  });

  const copyLink = async () => {
    const link = `${window.location.origin}/wishlist?items=${slugs.join(",")}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", link);
    }
  };

  return (
    <section className="site-container py-20 sm:py-28">
      <p className="eyebrow mb-5 text-[#9b7139]">{viewShared ? "Shared with you" : "Saved for later"}</p>
      <h1 className="page-title mb-6">
        {viewShared ? (
          <>
            Shared <em>wishlist.</em>
          </>
        ) : (
          <>
            Your <em>wishlist.</em>
          </>
        )}
      </h1>

      {viewShared && (
        <div className="mb-10 flex flex-wrap items-center gap-4 border-y border-[#1d241f]/15 py-4 text-sm">
          <span>Someone shared these pieces with you.</span>
          <button
            onClick={() => {
              addMany(shared);
              setViewShared(false);
            }}
            className="border border-[#1d241f]/30 px-4 py-3 text-[10px] font-bold uppercase tracking-[.16em]"
          >
            Save them to my wishlist
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="border-y border-[#1d241f]/15 py-16 text-center">
          <p className="text-sm text-[#5b625b]">
            Nothing saved yet. Tap the heart on any piece to keep it here.
          </p>
          <Link to="/collections" className="text-link mt-6">
            Browse the collection <Icon name="arrow" size={18} />
          </Link>
        </div>
      ) : (
        <>
          {!viewShared && (
            <div className="mb-10 flex flex-wrap items-center gap-4">
              <button
                onClick={copyLink}
                className="border border-[#1d241f]/30 px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em]"
              >
                Copy wishlist link
              </button>
              <span role="status" className="text-xs text-[#4a6b3a]">
                {copied ? "Link copied. Anyone with it can see these pieces." : ""}
              </span>
            </div>
          )}
          <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <li key={product.slug} className="min-w-0">
                <div className="relative">
                  <Link to={`/collections/${product.slug}`} className="block">
                    <div className="aspect-[4/5] overflow-hidden bg-[#ddd8cc]">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  </Link>
                  {!viewShared && <HeartButton slug={product.slug} name={product.name} className="absolute right-3 top-3" />}
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-[#1d241f]/20 py-4">
                  <h2 className="font-display text-2xl">{product.name}</h2>
                  <span className="text-sm">{formatCedis(product.price)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {product.available ? (
                    <button
                      onClick={() => {
                        add(product.slug, product.finishes[0]);
                        setAddedSlug(product.slug);
                      }}
                      className="bg-[#1d241f] px-5 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139]"
                    >
                      {addedSlug === product.slug ? "Added" : `Add to cart · ${product.finishes[0]}`}
                    </button>
                  ) : (
                    <span className="text-xs text-[#8a3b2a]">Currently unavailable</span>
                  )}
                  {!viewShared && (
                    <button
                      onClick={() => toggle(product.slug)}
                      className="px-2 py-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#686f68] underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
