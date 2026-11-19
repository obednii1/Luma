// All site content lives here. Image URLs are unchanged from the original build.

export const photos = {
  hero: "https://images.unsplash.com/photo-1682184805271-11671b7ecf4c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1800",
  pendant:
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
  white:
    "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
  globe:
    "https://images.unsplash.com/photo-1636368208791-17b81ed832d2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
  black:
    "https://images.unsplash.com/photo-1592622515232-6e3e2a0d3d9a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
  room: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1600",
  room2:
    "https://images.unsplash.com/photo-1704040686428-7534b262d0d8?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
  room3:
    "https://images.unsplash.com/photo-1708113388262-17fdf0e21205?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
  ambient:
    "https://images.unsplash.com/photo-1559924508-1461423083c5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
};

// Home-page tiles use the 1000px renditions of the same photos.
const w1000 = (url: string) => url.replace("w=1200", "w=1000");
export const homeImages = {
  pendant: w1000(photos.pendant),
  wall: w1000(photos.white),
  table: w1000(photos.globe),
  detail: w1000(photos.black),
  project: "https://images.unsplash.com/photo-1564078516393-cf04bd966897?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=1400",
};

export const contact = {
  phoneDisplay: "+233 59 628 6995",
  phoneHref: "tel:+233596286995",
  email: "obedniiodonkor@gmail.com",
  addressLines: ["East Legon", "Accra, Ghana"],
};

/** Prices are stored as whole Ghana cedis. */
export const formatCedis = (amount: number) => `GH₵${amount.toLocaleString("en-GH")}`;

// Demo delivery fees in whole cedis. The server copy in api/checkout.ts decides the real charge.
export const deliveryZones = [
  { id: "accra", label: "Greater Accra", fee: 150 },
  { id: "other", label: "Other regions in Ghana", fee: 400 },
];

export type ProductType = "Pendant" | "Wall" | "Table" | "Floor";

export type Product = {
  slug: string;
  name: string;
  type: ProductType;
  price: number;
  image: string;
  description: string;
  finishes: string[];
  dimensions: string;
  leadTime: string;
  warranty: string;
};

export const products: Product[] = [
  {
    slug: "arc-pendant-01",
    name: "Arc Pendant 01",
    type: "Pendant",
    price: 10500,
    image: photos.pendant,
    description:
      "A sweeping arc of hand-finished metal suspends a soft opal diffuser, casting warm, reflected light that feels equally at home above a dining table or in a double-height hall.",
    finishes: ["Aged brass", "Blackened bronze", "Natural aluminium"],
    dimensions: "Ø 480mm",
    leadTime: "6–8 weeks",
    warranty: "5 years",
  },
  {
    slug: "opal-rise",
    name: "Opal Rise",
    type: "Pendant",
    price: 7700,
    image: photos.white,
    description:
      "A mouth-blown opal glass shade that glows from within. Its rising profile throws a gentle wash of light up and down, ideal over kitchen islands and reading corners.",
    finishes: ["Aged brass", "Polished nickel"],
    dimensions: "Ø 360mm · H 420mm",
    leadTime: "4–6 weeks",
    warranty: "5 years",
  },
  {
    slug: "mori-globe",
    name: "Mori Globe",
    type: "Table",
    price: 5000,
    image: photos.globe,
    description:
      "A small, perfectly round table light with a frosted glass sphere and a weighted turned-wood base. Dimmable at the foot, it brings a quiet pool of warmth to a bedside or shelf.",
    finishes: ["Natural oak", "Smoked walnut"],
    dimensions: "Ø 220mm · H 340mm",
    leadTime: "3–4 weeks",
    warranty: "3 years",
  },
  {
    slug: "nocturne-sconce",
    name: "Nocturne Sconce",
    type: "Wall",
    price: 4300,
    image: photos.black,
    description:
      "A slim, blackened-metal sconce that grazes walls with a tight band of light. Designed to flank mirrors, headboards and artwork without glare.",
    finishes: ["Blackened bronze", "Aged brass"],
    dimensions: "W 120mm · H 260mm · D 95mm",
    leadTime: "4–6 weeks",
    warranty: "5 years",
  },
  {
    slug: "halo-drop",
    name: "Halo Drop",
    type: "Pendant",
    price: 8400,
    image: photos.ambient,
    description:
      "A ring of diffused light hangs from fine cables, creating a soft halo over tables and stair wells. Available in single or cluster configurations.",
    finishes: ["Natural aluminium", "Aged brass", "Blackened bronze"],
    dimensions: "Ø 600mm",
    leadTime: "8–10 weeks",
    warranty: "5 years",
  },
  {
    slug: "studio-cone",
    name: "Studio Cone",
    type: "Floor",
    price: 11200,
    image: photos.pendant,
    description:
      "A tall, tapered floor light with a directional cone head that can be angled to wash a corner or light a reading chair. Finished by hand and made to order.",
    finishes: ["Blackened bronze", "Natural aluminium"],
    dimensions: "H 1620mm · Base Ø 280mm",
    leadTime: "6–8 weeks",
    warranty: "5 years",
  },
];

export type Project = {
  slug: string;
  name: string;
  place: string;
  year: string;
  scope: string;
  architect: string;
  heading: string;
  summary: string;
  image: string;
  detailImage: string;
};

export const projects: Project[] = [
  {
    slug: "alder-house",
    name: "The Alder House",
    place: "Cantonments, Accra · Residential",
    year: "2024",
    scope: "Full lighting design",
    architect: "North & Alder",
    heading: "Historic detail, revealed with a quiet hand.",
    summary:
      "Our scheme layers discreet architectural light with sculptural decorative pieces. Original cornices are softly grazed, artwork is precisely illuminated, and low-level pools of warmth guide movement after dark.",
    image: photos.room,
    detailImage: photos.room2,
  },
  {
    slug: "field-and-form",
    name: "Field & Form",
    place: "Osu, Accra · Hospitality",
    year: "2023",
    scope: "Lighting design & fixture curation",
    architect: "Studio Verge",
    heading: "A dining room that glows from the table up.",
    summary:
      "Low, warm pendants define each table while the surrounding room recedes into shadow. Dimming scenes shift the restaurant gently from lunch service to late evening.",
    image: photos.room2,
    detailImage: photos.room,
  },
  {
    slug: "west-heath",
    name: "West Heath",
    place: "East Legon, Accra · Residential",
    year: "2023",
    scope: "Lighting design & energy planning",
    architect: "Haldane Partners",
    heading: "A family home lit for every hour of the day.",
    summary:
      "Efficient, warm-dimming sources are zoned throughout, so the house moves from bright, practical mornings to soft, layered evenings with a single touch.",
    image: photos.room3,
    detailImage: photos.room,
  },
];

export type Story = {
  slug: string;
  title: string;
  tag: string;
  image: string;
  imageAlt: string;
  standfirst: string;
  lead: string;
  sections: { heading: string; text: string }[];
  quote?: string;
};

export const stories: Story[] = [
  {
    slug: "lighting-in-layers",
    title: "The art of lighting a room in layers",
    tag: "How to",
    image: photos.black,
    imageAlt: "Pendant creating a warm pool of light",
    standfirst:
      "A practical guide to combining ambient, task, and accent lighting for rooms that shift beautifully from morning to night.",
    lead: "The most inviting rooms are rarely lit by a single source. They are composed, layer by layer, with light at different heights and intensities.",
    sections: [
      {
        heading: "Begin with ambient light",
        text: "Think of ambient light as the quiet foundation. It should make the room comfortable to navigate without flattening its character. Indirect sources, shaded pendants, and carefully dimmed architectural fittings all work well.",
      },
      {
        heading: "Add light where life happens",
        text: "Task lighting belongs close to the activity: beside a reading chair, over a kitchen worktop, or on a writing desk. The best examples feel intuitive and disappear into the rhythm of daily life.",
      },
      {
        heading: "Finish with accent and shadow",
        text: "Use narrow beams to reveal artwork, texture, and architectural details. Just as important, preserve areas of shadow. Contrast gives a room depth and creates the calm that comes after sunset.",
      },
    ],
    quote: "Good lighting does not ask to be noticed. It asks the room to be noticed.",
  },
  {
    slug: "warm-light",
    title: "Why warm light changes everything",
    tag: "Perspective",
    image: photos.ambient,
    imageAlt: "A halo of warm light over a table",
    standfirst:
      "Colour temperature is the quietest decision in a lighting scheme, and the one people feel most.",
    lead: "Before brightness, before fixtures, there is colour. A shift of a few hundred kelvin can turn a room from clinical to comforting.",
    sections: [
      {
        heading: "Why 2700K feels like home",
        text: "Warm white sits close to the glow of candlelight and old incandescent lamps. Skin tones look kinder, timber and brass deepen, and the eye relaxes as the evening goes on.",
      },
      {
        heading: "Keep it consistent",
        text: "Mixing cool and warm sources in one room rarely works. Choose one temperature for the space and let dimming, not colour, create the variety between daytime and night.",
      },
      {
        heading: "Where cooler light still belongs",
        text: "Workshops, utility rooms and some task areas benefit from a crisper white. The trick is to separate these zones clearly rather than blending them into living spaces.",
      },
    ],
    quote: "Warmth is not a style. It is how a room tells you to stay.",
  },
  {
    slug: "hand-finished-brass",
    title: "Inside the workshop: hand-finished brass",
    tag: "Makers",
    image: photos.pendant,
    imageAlt: "A pendant light with a hand-finished metal arc",
    standfirst:
      "A look at the slow, skilled process behind the metalwork in our pendants and sconces.",
    lead: "Every brass fitting we specify starts as a sheet of raw metal and ends as something that will keep changing for decades.",
    sections: [
      {
        heading: "Shaped, not stamped",
        text: "Our makers form each arc and collar by hand, checking curves against templates and by eye. The small variations that result are part of the character of the finished piece.",
      },
      {
        heading: "A finish that ages well",
        text: "Aged brass is brushed and sealed lightly so it can develop a living patina. Touched surfaces warm and soften over the years rather than wearing out.",
      },
      {
        heading: "Made to order",
        text: "Because each piece is finished individually, lead times are measured in weeks, not days. We think the wait is part of what makes the object feel considered.",
      },
    ],
  },
];

export const collections = [
  { name: "Pendant lights", count: "24 designs", image: homeImages.pendant },
  { name: "Wall lights", count: "18 designs", image: homeImages.wall },
  { name: "Table & floor", count: "31 designs", image: homeImages.table },
];

export const services = [
  {
    icon: "pencil",
    number: "01",
    title: "Lighting design",
    text: "A considered lighting plan shaped around how you live, work, and move through a space.",
  },
  {
    icon: "sun",
    number: "02",
    title: "Fixture curation",
    text: "A tailored selection from independent makers and enduring global design houses.",
  },
  {
    icon: "leaf",
    number: "03",
    title: "Energy planning",
    text: "Efficient, warm and future-minded solutions without compromising atmosphere.",
  },
];

export const navLinks: [label: string, path: string][] = [
  ["Collections", "/collections"],
  ["Projects", "/projects"],
  ["Our approach", "/approach"],
  ["Journal", "/journal"],
];
