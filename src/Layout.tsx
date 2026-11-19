import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useRouter } from "./router";
import { contact, navLinks } from "./data";
import { useCart } from "./cart";
import { useWishlist } from "./wishlist";
import { submitForm } from "./api";

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "arrow")
    return (
      <svg {...common}>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </svg>
    );
  if (name === "arrow-left")
    return (
      <svg {...common} className="rotate-180">
        <path d="M5 12h14M14 7l5 5-5 5" />
      </svg>
    );
  if (name === "menu")
    return (
      <svg {...common}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  if (name === "close")
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  if (name === "sun")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </svg>
    );
  if (name === "leaf")
    return (
      <svg {...common}>
        <path d="M20 4S8 4 5 11c-2 5 2 9 7 7 7-3 8-14 8-14Z" />
        <path d="M6 18c3-4 6-7 11-10" />
      </svg>
    );
  if (name === "heart")
    return (
      <svg {...common}>
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
      </svg>
    );
  if (name === "bag")
    return (
      <svg {...common}>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
    );
  if (name === "pencil")
    return (
      <svg {...common}>
        <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
        <path d="m13.5 7 3.5 3.5" />
      </svg>
    );
  return null;
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <>
      <span className={`logo-mark ${small ? "small" : ""}`}>
        <span />
      </span>
      <span
        className={`font-display tracking-[0.18em] ${small ? "text-2xl" : "text-[1.55rem]"}`}
      >
        LUMA
      </span>
    </>
  );
}

/** `overlay` floats transparently over a hero image; otherwise it is solid. */
export function Header({ overlay = false }: { overlay?: boolean }) {
  const { path } = useRouter();
  const { count } = useCart();
  const wishCount = useWishlist().slugs.length;
  const [open, setOpen] = useState(false);
  const active = path.split("/")[1] || "";

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const shell = overlay
    ? "absolute inset-x-0 top-0 z-30 border-b border-white/20 text-white"
    : "relative z-30 border-b border-[#1d241f]/15 bg-[#f2efe8]";
  const cta = overlay
    ? "border border-white/50 hover:bg-white hover:text-[#1d241f]"
    : "bg-[#1d241f] text-white hover:bg-[#9b7139]";
  const toggle = overlay ? "border-white/40" : "border-[#1d241f]/30";

  return (
    <header className={shell}>
      <div className="site-container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="Luma home">
          <Logo />
        </Link>
        <nav
          className="hidden items-center gap-9 text-[11px] font-semibold uppercase tracking-[0.18em] lg:flex"
          aria-label="Main navigation"
        >
          {navLinks.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              aria-current={active === to.slice(1) ? "page" : undefined}
              className={`nav-link ${!overlay && active === to.slice(1) ? "text-[#9b7139]" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/wishlist"
            aria-label={`Wishlist, ${wishCount} ${wishCount === 1 ? "item" : "items"}`}
            className="relative grid h-10 w-10 place-items-center"
          >
            <Icon name="heart" size={22} />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#d8b26e] px-1 text-[10px] font-bold text-[#172019]">
                {wishCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="relative grid h-10 w-10 place-items-center"
          >
            <Icon name="bag" size={22} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#d8b26e] px-1 text-[10px] font-bold text-[#172019]">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/contact"
            className={`hidden px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition lg:block ${cta}`}
          >
            Start a project
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className={`grid h-10 w-10 place-items-center border lg:hidden ${toggle}`}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="absolute inset-x-0 top-20 flex flex-col bg-[#1d241f] p-6 text-white lg:hidden"
          aria-label="Mobile navigation"
        >
          {[...navLinks, ["Start a project", "/contact"]].map(([label, to]) => (
            <Link
              key={to}
              to={to}
              className="border-b border-white/10 py-4 text-left text-xs uppercase tracking-[.16em]"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, left empty by real visitors
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await submitForm({ type: "subscribe", email, website });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  };

  const done = status === "done";

  return (
    <form onSubmit={submit}>
      <span className="data-label">Notes on light, monthly</span>
      <div className="mt-4 flex border-b border-white/30 pb-2">
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          aria-label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={done ? "Thank you — you’re on the list." : "Your email address"}
          disabled={done || status === "sending"}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/40"
        />
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
        <button
          aria-label="Subscribe"
          disabled={done || status === "sending"}
          className="px-2 transition hover:translate-x-1 disabled:opacity-50"
        >
          <Icon name="arrow" size={18} />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-[#e8c888]">
          {error}
        </p>
      )}
    </form>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#172019] pb-8 pt-16 text-white">
      <div className="site-container">
        <div className="grid gap-12 border-b border-white/15 pb-14 md:grid-cols-[1.3fr_.7fr_.7fr_1.2fr]">
          <div>
            <Link to="/" className="mb-5 flex items-center gap-3" aria-label="Luma home">
              <Logo small />
            </Link>
            <p className="max-w-xs text-sm leading-7 text-white/55">
              Architectural lighting studio and independent showroom in East Legon, Accra.
            </p>
          </div>
          <div>
            <span className="data-label">Visit</span>
            <p className="mt-4 text-sm leading-7 text-white/65">
              {contact.addressLines.map((line, index) => (
                <span key={line}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
              <br />
              <a href={contact.phoneHref} className="hover:text-white">
                {contact.phoneDisplay}
              </a>
            </p>
          </div>
          <div>
            <span className="data-label">Connect</span>
            <div className="mt-4 flex flex-col items-start gap-2 text-sm text-white/65">
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://www.pinterest.com" target="_blank" rel="noreferrer">
                Pinterest
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
          <NewsletterForm />
        </div>
        <div className="flex flex-col justify-between gap-4 pt-7 text-[9px] uppercase tracking-[.16em] text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Luma Lighting Studio</p>
          <div className="flex gap-4">
            <Link to="/track">Track order</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Shared page frame for every route except the home page hero. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f2efe8] text-[#1d241f]">
      <Header />
      {children}
      <Footer />
    </main>
  );
}
