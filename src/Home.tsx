import { Header, Footer, Icon } from "./Layout";
import { Link, usePageTitle } from "./router";
import { collections, homeImages, services, photos } from "./data";

export default function Home() {
  usePageTitle("");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f2efe8] text-[#1d241f]">
      <Header overlay />

      <section
        id="home"
        className="hero relative flex min-h-[760px] items-end text-white lg:min-h-[850px]"
      >
        <img
          src={photos.hero}
          alt="Warm modern living room illuminated by a sculptural pendant"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,19,16,.78)_0%,rgba(14,19,16,.35)_52%,rgba(14,19,16,.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,14,12,.5)_0%,transparent_50%)]" />
        <div className="site-container relative z-10 grid gap-12 pb-16 pt-36 lg:grid-cols-[1fr_300px] lg:items-end lg:pb-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-6 text-[#e8c888]">
              Architectural lighting, beautifully considered
            </p>
            <h1 className="font-display text-[clamp(4.3rem,9vw,8.5rem)] leading-[0.8] tracking-[-0.055em]">
              Light,
              <br />
              <em className="font-normal">reimagined.</em>
            </h1>
          </div>
          <div className="max-w-xs border-l border-white/40 pl-6 lg:justify-self-end">
            <p className="mb-7 text-[15px] leading-7 text-white/80">
              We create layered lighting schemes that bring warmth, rhythm, and quiet drama to
              remarkable spaces.
            </p>
            <Link to="/collections" className="text-link text-white">
              Explore our collection <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 hidden items-center gap-4 bg-[#d8b26e] px-7 py-5 text-[#1d241f] lg:flex">
          <Icon name="sun" />
          <span className="text-[10px] font-bold uppercase tracking-[0.17em]">
            Thoughtfully lit since 1987
          </span>
        </div>
      </section>

      <section id="collections" className="site-container section-pad">
        <div className="mb-12 flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div>
            <p className="eyebrow mb-4 text-[#9b7139]">The collection</p>
            <h2 className="section-title">
              Objects of <em>atmosphere.</em>
            </h2>
          </div>
          <Link to="/collections" className="text-link self-start md:self-auto">
            View all lighting <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {collections.map((item, index) => (
            <Link
              key={item.name}
              to="/collections"
              className={`collection-card group block ${index === 1 ? "md:mt-14" : ""}`}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#d8d3c8]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#f2efe8] opacity-0 transition group-hover:opacity-100">
                  <Icon name="arrow" size={17} />
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#1d241f]/20 py-5">
                <h3 className="font-display text-2xl">{item.name}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#5f665f]">
                  {item.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="projects" className="bg-[#202821] text-white">
        <div className="grid lg:grid-cols-[1.18fr_.82fr]">
          <div className="relative min-h-[560px] lg:min-h-[760px]">
            <img
              src={homeImages.project}
              alt="The Alder House living room lighting project"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute bottom-6 left-6 border border-white/40 bg-black/20 px-4 py-3 text-[10px] uppercase tracking-[0.16em] backdrop-blur-sm">
              Cantonments, Accra · Residential
            </div>
          </div>
          <div className="flex flex-col justify-between p-8 sm:p-14 lg:p-16">
            <div>
              <p className="eyebrow mb-6 text-[#d8b26e]">Featured project · 01</p>
              <h2 className="font-display text-[clamp(3rem,6vw,5.5rem)] leading-[.92]">
                The Alder
                <br />
                <em>House.</em>
              </h2>
            </div>
            <div className="mt-24 max-w-md">
              <p className="mb-8 text-base leading-8 text-white/65">
                A refined townhouse in Cantonments where subtle pools of light reveal original plasterwork,
                hardwood joinery, and a quietly modern art collection.
              </p>
              <div className="mb-9 grid grid-cols-2 gap-6 border-y border-white/15 py-6">
                <div>
                  <span className="data-label">Scope</span>
                  <p className="mt-2 text-sm">Full lighting design</p>
                </div>
                <div>
                  <span className="data-label">Completed</span>
                  <p className="mt-2 text-sm">Autumn 2024</p>
                </div>
              </div>
              <Link to="/projects/alder-house" className="text-link text-white">
                View the project <Icon name="arrow" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="site-container section-pad">
        <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="eyebrow mb-5 text-[#9b7139]">Our approach</p>
            <h2 className="section-title">
              From first
              <br />
              sketch to
              <br />
              <em>final glow.</em>
            </h2>
          </div>
          <div className="border-t border-[#1d241f]/25">
            {services.map((service) => (
              <div
                key={service.number}
                className="group grid gap-5 border-b border-[#1d241f]/25 py-8 sm:grid-cols-[60px_1fr_1.2fr] sm:items-start"
              >
                <span className="text-xs text-[#8d938d]">{service.number}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[#9b7139] transition group-hover:rotate-12">
                    <Icon name={service.icon} size={23} />
                  </span>
                  <h3 className="font-display text-2xl">{service.title}</h3>
                </div>
                <p className="max-w-sm text-sm leading-7 text-[#616861]">{service.text}</p>
              </div>
            ))}
            <Link
              to="/approach"
              className="mt-9 inline-flex items-center gap-3 bg-[#1d241f] px-6 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-white transition hover:bg-[#9b7139]"
            >
              Discover our process <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section id="journal" className="bg-[#ddd8cc] py-20 sm:py-28">
        <div className="site-container grid items-center gap-10 lg:grid-cols-2 lg:gap-24">
          <div className="relative">
            <img
              src={homeImages.detail}
              alt="Black pendant light casting a warm glow"
              className="aspect-[5/4] w-full object-cover"
            />
            <div className="absolute -bottom-5 -right-3 bg-[#d8b26e] px-6 py-5 sm:right-8">
              <span className="data-label text-[#1d241f]">Journal · Field notes 06</span>
            </div>
          </div>
          <div className="max-w-xl">
            <p className="eyebrow mb-5 text-[#9b7139]">Light well</p>
            <h2 className="font-display text-[clamp(2.7rem,5.3vw,5rem)] leading-[.97] tracking-[-.035em]">
              The art of lighting a room in <em>layers.</em>
            </h2>
            <p className="my-7 max-w-lg text-[15px] leading-8 text-[#5b625b]">
              A practical guide to combining ambient, task, and accent lighting for spaces that
              shift beautifully from morning to night.
            </p>
            <Link to="/journal/lighting-in-layers" className="text-link">
              Read the story <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="relative bg-[#b98b51] py-24 text-[#172019] sm:py-32">
        <div className="glow-orb" />
        <div className="site-container relative z-10 text-center">
          <p className="eyebrow mb-6">A brighter space starts here</p>
          <h2 className="mx-auto max-w-4xl font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[.85] tracking-[-.05em]">
            Let’s create
            <br />
            <em>something luminous.</em>
          </h2>
          <Link
            to="/contact"
            className="mt-10 inline-flex items-center gap-3 bg-[#1d241f] px-7 py-4 text-[10px] font-bold uppercase tracking-[.17em] text-white transition hover:-translate-y-1"
          >
            Start your project <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
