import { withBookCover, KACAU_COVER } from "./covers";
import { Book, Data } from "./types";
export const uid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const source = "https://shopee.com.my/bukufixi.os";
export const books: Book[] = [
  [
    "JELIK",
    "Ismi Fa Ismail",
    "Horror",
    "#b9d559",
    25,
    "A voice from Malaysia’s contemporary fiction shelf. Public title and author metadata; publisher cover artwork.",
  ],
  [
    "RENJANA",
    "Qiydenneskala",
    "Fiction",
    "#db8871",
    25,
    "Explore a different voice in Malay-language fiction. Public title and author metadata; demo catalog description.",
  ],
  [
    "AMUK",
    "Khairi Mohd",
    "Thriller",
    "#eabc4b",
    25,
    "Discover contemporary Malaysian storytelling. Public title and author metadata; demo genre assignment.",
  ],
  [
    "JELAGA",
    "Faizal Sulaiman",
    "Fiction",
    "#9fadd2",
    25,
    "A new addition to your reading stack. Public title and author metadata; publisher cover artwork.",
  ],
  [
    "GANTUNG:3",
    "Nadia Khan",
    "Thriller",
    "#b797bb",
    27,
    "The third Gantung title, listed in the official store. Pricing and stock here are for demonstration.",
  ],
  [
    "MOTEL",
    "Sahidzan Salleh",
    "Horror",
    "#73aba4",
    25,
    "Browse this public FIXI title in our academic catalog. Genre and description are editorial demo data.",
  ],
  [
    "KOTA SELEPAS HUJAN",
    "Demo Editorial Collective",
    "Fiction",
    "#e6a463",
    29,
    "An invented preorder title for demonstrating campaigns. A city, a late train, and stories waiting to be told.",
  ],
  [
    "CATATAN KOTA",
    "Demo Editorial Collective",
    "Fiction",
    "#93b6c8",
    12,
    "An invented digital title for demonstrating ebook entitlements. No copyrighted ebook is supplied.",
  ],
].map((b, i) => {
  const slug = String(b[0])
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-");
  return withBookCover({
    id: uid(i + 1),
    slug,
    title: String(b[0]),
    author: String(b[1]),
    category: String(b[2]),
    color: String(b[3]),
    price: Number(b[4]),
    description: String(b[5]),
    stock: i === 6 ? 0 : 80 - i * 7,
    format: i === 7 ? "ebook" : "physical",
    cover_image: `/covers/${slug}.jpg`,
    source_url: i < 6 ? source : null,
    provenance: i < 6 ? "public_metadata" : "demo",
    active: i < 6,
    sale_mode: "catalog_only",
  });
});
export const demoCustomer = uid(100);
books.push({
  id: uid(9),
  slug: "kacau-movie-tie-in",
  title: "KACAU: Movie Tie-In",
  author: "Ariff Adly",
  category: "Movie Tie-In",
  price: 30,
  stock: 0,
  color: "#19b467",
  description:
    "The limited edition for the upcoming KACAU movie. Only 1,000 copies, with no reprint. Expected publication on 1 November 2026.",
  format: "physical",
  cover_image: KACAU_COVER,
  back_cover_image: KACAU_COVER,
  source_url: null,
  provenance: "public_metadata",
  active: true,
  sale_mode: "preorder",
  page_count: 328,
  publication_date: "2026-11-01",
});
export const initialData: Data = {
  books,
  campaigns: [
    {
      id: uid(200),
      book_id: uid(9),
      title: "KACAU · Limited movie tie-in edition",
      opens_at: "2026-10-14T16:00:00Z",
      closes_at: "2026-10-31T15:59:59Z",
      release_at: "2026-10-31T16:00:00Z",
      capacity: 1000,
      reserved: 0,
      active: true,
      featured: true,
    },
  ],
  orders: [],
  payments: [],
  entitlements: [],
  profiles: [
    {
      id: demoCustomer,
      display_name: "Aina · Preview customer",
      email: "aina@example.test",
      role: "customer",
      active: true,
    },
    {
      id: uid(101),
      display_name: "Daniel · Second customer",
      email: "daniel@example.test",
      role: "customer",
      active: true,
    },
    {
      id: uid(102),
      display_name: "Sarah · Staff",
      email: "sarah@example.test",
      role: "staff",
      active: true,
    },
    { id: uid(103), display_name: "Amir · Admin", email: "amir@example.test", role: "admin", active: true },
    {
      id: uid(104),
      display_name: "Hana · Superadmin",
      email: "hana@example.test",
      role: "superadmin",
      active: true,
    },
  ],
  access: [],
  events: [],
};
