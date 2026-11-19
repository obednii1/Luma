import { useState, type FormEvent, type ReactNode } from "react";
import { Icon, PageShell } from "./Layout";
import { Link, useRouter, usePageTitle } from "./router";
import { contact, formatCedis, photos, projects, stories, type ProductType } from "./data";
import { submitForm } from "./api";
import { useCart } from "./cart";
import { useProducts } from "./products";
import { CartPage, CheckoutPage, SuccessPage } from "./Shop";
import AdminPage from "./Admin";
import { TrackPage } from "./Track";
import { WishlistPage } from "./WishlistPage";
import { HeartButton, useWishlist } from "./wishlist";

function Intro({ eyebrow, title, text }: { eyebrow: string; title: ReactNode; text: string }) {
  return (
    <section className="site-container pb-16 pt-20 sm:pb-24 sm:pt-28">
      <p className="eyebrow mb-6 text-[#9b7139]">{eyebrow}</p>
      <div className="grid gap-8 lg:grid-cols-[1.45fr_.55fr] lg:items-end">
        <h1 className="page-title">{title}</h1>
        <p className="max-w-md text-[15px] leading-8 text-[#5b625b]">{text}</p>
      </div>
    </section>
  );
}

function NotFound() {
  usePageTitle("Page not found");
  return (
    <div className="site-container py-32 text-center">
      <p className="eyebrow mb-5 text-[#9b7139]">404</p>
      <h1 className="page-title">
        Page not <em>found.</em>
      </h1>
      <Link to="/" className="text-link mt-10">
        <Icon name="arrow-left" size={18} /> Return home
      </Link>
    </div>
  );
}

const filters: ("All" | ProductType)[] = ["All", "Pendant", "Wall", "Table", "Floor"];

function CollectionsPage() {
  usePageTitle("Collections");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const products = useProducts().filter((p) => p.available);
  const visible = filter === "All" ? products : products.filter((p) => p.type === filter);
  return (
    <>
      <Intro
        eyebrow="The collection"
        title={
          <>
            Objects of <em>atmosphere.</em>
          </>
        }
        text="Sculptural light for thoughtful interiors. Each piece is selected for its quality of glow, material integrity, and lasting presence."
      />
      <section className="site-container pb-28">
        <div
          className="mb-10 flex flex-wrap gap-2 border-y border-[#1d241f]/15 py-4"
          role="group"
          aria-label="Filter by type"
        >
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`px-5 py-3 text-[10px] font-bold uppercase tracking-[.15em] transition ${filter === item ? "bg-[#1d241f] text-white" : "hover:bg-[#ddd8cc]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <div key={product.slug} className="relative">
            <Link to={`/collections/${product.slug}`} className="group block text-left">
              <div className="aspect-[4/5] overflow-hidden bg-[#ddd8cc]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex justify-between border-b border-[#1d241f]/20 py-5">
                <div>
                  <h2 className="font-display text-2xl">{product.name}</h2>
                  <span className="mt-1 block text-[9px] uppercase tracking-[.15em] text-[#777d77]">
                    {product.type}
                  </span>
                </div>
                <span className="text-sm">{formatCedis(product.price)}</span>
              </div>
            </Link>
            <HeartButton slug={product.slug} name={product.name} className="absolute right-3 top-3" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductPage({ slug }: { slug: string }) {
  const product = useProducts().find((item) => item.slug === slug);
  usePageTitle(product?.name ?? "Page not found");
  const [finish, setFinish] = useState(product?.finishes[0] ?? "");
  const { add } = useCart();
  const { has: hasWish, toggle: toggleWish } = useWishlist();
  const [added, setAdded] = useState(false);
  if (!product) return <NotFound />;
  return (
    <section className="site-container py-12 sm:py-20">
      <Link to="/collections" className="text-link mb-10">
        <Icon name="arrow-left" size={18} /> Back to collection
      </Link>
      <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-20">
        <div className="bg-[#ddd8cc]">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[4/5] h-full w-full object-cover"
          />
        </div>
        <div className="self-center">
          <p className="eyebrow mb-5 text-[#9b7139]">{product.type} lighting · Made to order</p>
          <h1 className="font-display text-[clamp(3.4rem,6vw,6.5rem)] leading-[.9]">
            {product.name}
          </h1>
          <p className="my-6 text-xl">{formatCedis(product.price)}</p>
          <p className="max-w-lg text-[15px] leading-8 text-[#5b625b]">{product.description}</p>
          <div className="my-8 border-y border-[#1d241f]/20 py-6">
            <span className="eyebrow mb-4 block">Select finish</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Finish">
              {product.finishes.map((item) => (
                <button
                  key={item}
                  onClick={() => setFinish(item)}
                  aria-pressed={finish === item}
                  className={`border px-4 py-3 text-xs ${finish === item ? "border-[#1d241f] bg-[#1d241f] text-white" : "border-[#1d241f]/25"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!product.available}
            onClick={() => {
              add(product.slug, finish);
              setAdded(true);
            }}
            className="flex w-full items-center justify-between bg-[#1d241f] px-6 py-5 text-xs font-bold uppercase tracking-[.16em] text-white hover:bg-[#9b7139] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#1d241f]"
          >
            {product.available ? "Add to cart" : "Currently unavailable"} <Icon name="bag" size={18} />
          </button>
          <button
            type="button"
            onClick={() => toggleWish(product.slug)}
            aria-pressed={hasWish(product.slug)}
            className="mt-3 w-full border border-[#1d241f]/25 px-6 py-4 text-xs font-bold uppercase tracking-[.16em] hover:border-[#9b7139]"
          >
            {hasWish(product.slug) ? "Saved to wishlist ♥" : "Save to wishlist ♡"}
          </button>
          <p role="status" className="mt-3 min-h-6 text-xs text-[#5b625b]">
            {added && (
              <>
                Added to your cart.{" "}
                <Link to="/cart" className="font-bold text-[#9b7139] underline">
                  View cart
                </Link>
              </>
            )}
          </p>
          <Link to="/contact" className="text-link mt-2">
            Enquire about this piece <Icon name="arrow" size={18} />
          </Link>
          <div className="mt-8 grid grid-cols-3 gap-4 text-xs leading-5 text-[#686f68]">
            <p>
              <b className="block text-[#1d241f]">Lead time</b>
              {product.leadTime}
            </p>
            <p>
              <b className="block text-[#1d241f]">Dimensions</b>
              {product.dimensions}
            </p>
            <p>
              <b className="block text-[#1d241f]">Warranty</b>
              {product.warranty}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectsPage() {
  usePageTitle("Projects");
  return (
    <>
      <Intro
        eyebrow="Selected work"
        title={
          <>
            Spaces shaped
            <br />
            by <em>light.</em>
          </>
        }
        text="From intimate homes to destination restaurants, our work begins with the character of a space and the lives unfolding within it."
      />
      <section className="site-container grid gap-12 pb-28 md:grid-cols-2">
        {projects.map((project, index) => (
          <Link
            key={project.slug}
            to={`/projects/${project.slug}`}
            className={`group block text-left ${index === 2 ? "md:col-span-2 md:mx-auto md:w-[65%]" : ""}`}
          >
            <div className="aspect-[5/4] overflow-hidden">
              <img
                src={project.image}
                alt={project.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between border-b border-[#1d241f]/20 py-5">
              <div>
                <h2 className="font-display text-3xl">{project.name}</h2>
                <p className="mt-2 text-[9px] uppercase tracking-[.15em] text-[#737a73]">
                  {project.place}
                </p>
              </div>
              <Icon name="arrow" size={18} />
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}

function ProjectDetail({ slug }: { slug: string }) {
  const project = projects.find((item) => item.slug === slug);
  usePageTitle(project?.name ?? "Page not found");
  if (!project) return <NotFound />;
  return (
    <>
      <section className="relative min-h-[72vh] text-white">
        <img
          src={project.image}
          alt={project.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="site-container relative flex min-h-[72vh] flex-col justify-end pb-16">
          <p className="eyebrow mb-5 text-[#e8c888]">
            {project.place} · {project.year}
          </p>
          <h1 className="page-title">{project.name}</h1>
        </div>
      </section>
      <section className="site-container grid gap-12 py-20 lg:grid-cols-[.65fr_1.35fr] lg:py-28">
        <div className="grid grid-cols-2 gap-6 self-start border-y border-[#1d241f]/20 py-6 text-sm">
          <div>
            <span className="eyebrow text-[#8b918b]">Scope</span>
            <p className="mt-3">{project.scope}</p>
          </div>
          <div>
            <span className="eyebrow text-[#8b918b]">Architect</span>
            <p className="mt-3">{project.architect}</p>
          </div>
        </div>
        <div>
          <h2 className="font-display text-4xl leading-tight sm:text-6xl">{project.heading}</h2>
          <p className="mt-8 max-w-2xl text-[15px] leading-8 text-[#5b625b]">{project.summary}</p>
        </div>
        <img
          src={project.detailImage}
          alt={`${project.name} interior detail`}
          className="aspect-[16/7] w-full object-cover lg:col-span-2"
        />
        <Link to="/projects" className="text-link self-start justify-self-start">
          <Icon name="arrow-left" size={18} /> All projects
        </Link>
        <Link to="/contact" className="text-link justify-self-start lg:justify-self-end">
          Discuss your project <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  );
}

function ApproachPage() {
  usePageTitle("Our approach");
  const steps = [
    [
      "01",
      "Listen",
      "We begin with the architecture, your ambitions, and the rituals that make a place feel like yours.",
    ],
    [
      "02",
      "Shape",
      "We map every layer of light, test effects, specify fittings, and coordinate with your wider design team.",
    ],
    [
      "03",
      "Refine",
      "From dimming curves to final focus, we commission each detail until the space feels effortless.",
    ],
  ];
  return (
    <>
      <Intro
        eyebrow="Our approach"
        title={
          <>
            Light is not
            <br />
            an after<em>thought.</em>
          </>
        }
        text="We bring lighting into the conversation early, balancing technical precision with instinct, emotion, and a deep respect for architecture."
      />
      <section className="bg-[#202821] py-24 text-white">
        <div className="site-container">
          {steps.map(([number, title, text]) => (
            <div
              key={number}
              className="grid gap-5 border-t border-white/20 py-10 md:grid-cols-[80px_1fr_1fr]"
            >
              <span className="text-xs text-[#d8b26e]">{number}</span>
              <h2 className="font-display text-4xl">{title}</h2>
              <p className="max-w-md text-sm leading-7 text-white/60">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="site-container grid gap-12 py-24 lg:grid-cols-2">
        <img
          src={photos.black}
          alt="Lighting detail"
          className="aspect-square h-full w-full object-cover"
        />
        <div className="self-center lg:px-12">
          <p className="eyebrow mb-5 text-[#9b7139]">Independent expertise</p>
          <h2 className="section-title">
            A trusted part of your <em>design team.</em>
          </h2>
          <p className="my-7 text-sm leading-8 text-[#5b625b]">
            We collaborate closely with architects, interior designers, contractors, and private
            clients. Our advice is independent, and every recommendation is made in service of the
            space.
          </p>
          <Link to="/contact" className="text-link">
            Work with us <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}

function JournalPage() {
  usePageTitle("Journal");
  return (
    <>
      <Intro
        eyebrow="The journal"
        title={
          <>
            Notes on <em>light.</em>
          </>
        }
        text="Ideas, practical guidance, and conversations with the designers and makers shaping how we experience illuminated space."
      />
      <section className="site-container grid gap-x-6 gap-y-14 pb-28 md:grid-cols-3">
        {stories.map((story, index) => (
          <Link
            key={story.slug}
            to={`/journal/${story.slug}`}
            className={`group block text-left ${index === 1 ? "md:mt-16" : ""}`}
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={story.image}
                alt=""
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <p className="eyebrow mb-3 mt-5 text-[#9b7139]">{story.tag} · 6 min read</p>
            <h2 className="font-display text-3xl leading-tight">{story.title}</h2>
            <span className="text-link mt-5">
              Read story <Icon name="arrow" size={18} />
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}

function ArticlePage({ slug }: { slug: string }) {
  const story = stories.find((item) => item.slug === slug);
  usePageTitle(story?.title ?? "Page not found");
  if (!story) return <NotFound />;
  return (
    <article>
      <section className="site-container pb-14 pt-20 text-center sm:pt-28">
        <p className="eyebrow mb-6 text-[#9b7139]">{story.tag} · 6 min read</p>
        <h1 className="page-title mx-auto max-w-5xl">{story.title}</h1>
        <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-[#626962]">{story.standfirst}</p>
      </section>
      <img
        src={story.image}
        alt={story.imageAlt}
        className="mx-auto aspect-[16/7] w-full max-w-[1500px] object-cover"
      />
      <section className="article-copy mx-auto max-w-2xl px-5 py-20">
        <p className="article-lead">{story.lead}</p>
        {story.sections.map((section, index) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.text}</p>
            {index === 1 && story.quote && <blockquote>{story.quote}</blockquote>}
          </div>
        ))}
        <Link to="/journal" className="text-link mt-10">
          <Icon name="arrow-left" size={18} /> Back to journal
        </Link>
      </section>
    </article>
  );
}

type Enquiry = { name: string; email: string; phone: string; projectType: string; message: string };
const emptyEnquiry: Enquiry = { name: "", email: "", phone: "", projectType: "", message: "" };

function ContactPage() {
  usePageTitle("Start a project");
  const [form, setForm] = useState<Enquiry>(emptyEnquiry);
  const [website, setWebsite] = useState(""); // honeypot, left empty by real visitors
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const field =
    (key: keyof Enquiry) =>
    (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await submitForm({ type: "enquiry", ...form, website });
      setSentTo(form.name.trim().split(" ")[0] || "there");
      setForm(emptyEnquiry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="site-container grid gap-14 py-20 sm:py-28 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
      <div>
        <p className="eyebrow mb-5 text-[#9b7139]">Start a project</p>
        <h1 className="page-title">
          Tell us about
          <br />
          your <em>space.</em>
        </h1>
        <p className="mt-8 max-w-md text-sm leading-8 text-[#5b625b]">
          Whether you are planning a new build, restoring a historic home, or looking for one
          perfect piece, we would love to hear from you.
        </p>
        <div className="mt-10 border-t border-[#1d241f]/20 pt-6 text-sm leading-7">
          <a href={`mailto:${contact.email}`}>
            <b>{contact.email}</b>
          </a>
          <br />
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
          <br />
          <br />
          {contact.addressLines.map((line, index) => (
            <span key={line}>
              {index > 0 && <br />}
              {line}
            </span>
          ))}
        </div>
      </div>
      {sentTo ? (
        <div
          className="flex min-h-[520px] flex-col items-center justify-center bg-[#d8b26e] p-10 text-center"
          role="status"
        >
          <span className="mb-5 font-display text-7xl">L</span>
          <h2 className="font-display text-4xl">Thank you, {sentTo}.</h2>
          <p className="mt-4 max-w-sm text-sm leading-7">
            Your enquiry has been received. A member of our studio will be in touch within two
            working days.
          </p>
          <button onClick={() => setSentTo(null)} className="text-link mt-8">
            Send another enquiry <Icon name="arrow" size={18} />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="bg-[#ddd8cc] p-7 sm:p-12">
          <div className="grid gap-7 sm:grid-cols-2">
            <label className="form-field">
              <span>Name *</span>
              <input
                required
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={field("name")}
              />
            </label>
            <label className="form-field">
              <span>Email *</span>
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={field("email")}
              />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={field("phone")}
              />
            </label>
            <label className="form-field">
              <span>Project type *</span>
              <select
                required
                name="projectType"
                value={form.projectType}
                onChange={field("projectType")}
              >
                <option value="" disabled>
                  Select one
                </option>
                <option>Residential</option>
                <option>Hospitality</option>
                <option>Commercial</option>
                <option>Single fixture</option>
              </select>
            </label>
            <label className="form-field sm:col-span-2">
              <span>Tell us about your project *</span>
              <textarea
                required
                name="message"
                rows={5}
                value={form.message}
                onChange={field("message")}
              />
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
            {sending ? "Sending…" : "Send enquiry"} <Icon name="arrow" size={18} />
          </button>
        </form>
      )}
    </section>
  );
}

function LegalPage({ type }: { type: string }) {
  const title =
    type === "privacy" ? "Privacy policy" : type === "terms" ? "Terms of use" : "Cookie policy";
  usePageTitle(title);
  return (
    <section className="site-container max-w-3xl py-20 sm:py-28">
      <p className="eyebrow mb-5 text-[#9b7139]">Luma Lighting Studio</p>
      <h1 className="page-title">{title}</h1>
      <div className="article-copy mt-12">
        <p>Last updated 6 June 2025</p>
        <h2>Our commitment</h2>
        <p>
          We respect your privacy and only collect information needed to respond to enquiries,
          provide our services, and improve your experience. We never sell personal information.
        </p>
        <h2>Information we collect</h2>
        <p>
          When you contact us or subscribe to our journal, we may collect your name, email address,
          telephone number, and details you choose to share about your project.
        </p>
        <h2>Questions</h2>
        <p>
          For questions about this policy, contact {contact.email}. We will respond as soon as
          reasonably possible.
        </p>
      </div>
    </section>
  );
}

/** Resolves any non-home path to a page, wrapped in the shared header and footer. */
export default function InnerPage() {
  const { path } = useRouter();
  const [, section, slug, extra] = path.replace(/\/+$/, "").split("/");

  let content: ReactNode;
  if (extra) content = <NotFound />;
  else if (section === "collections") content = slug ? <ProductPage key={slug} slug={slug} /> : <CollectionsPage />;
  else if (section === "projects") content = slug ? <ProjectDetail slug={slug} /> : <ProjectsPage />;
  else if (section === "journal") content = slug ? <ArticlePage slug={slug} /> : <JournalPage />;
  else if (section === "admin" && !slug) content = <AdminPage />;
  else if (section === "track" && !slug) content = <TrackPage />;
  else if (section === "wishlist" && !slug) content = <WishlistPage />;
  else if (section === "cart" && !slug) content = <CartPage />;
  else if (section === "checkout" && !slug) content = <CheckoutPage />;
  else if (section === "checkout" && slug === "success") content = <SuccessPage />;
  else if (section === "approach" && !slug) content = <ApproachPage />;
  else if (section === "contact" && !slug) content = <ContactPage />;
  else if (["privacy", "terms", "cookies"].includes(section) && !slug) content = <LegalPage type={section} />;
  else content = <NotFound />;

  return <PageShell>{content}</PageShell>;
}
