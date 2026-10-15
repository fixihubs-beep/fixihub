"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Film,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";
import { useHub } from "./provider";
import { BookCard, Empty, Modal, Status } from "./ui";
import { BookCover } from "./book-cover";
import { CardPreview } from "./card-preview";
import { Bookshelf } from "./bookshelf";
import { FILM_POSTER } from "@/lib/book-editorial";
import { GoogleLogin } from "./google-login";
import { DeliveryFields, deliveryFromForm } from "./delivery-fields";
import { BookSynopsis, BookInsights, FilmPoster } from "./book-editorial";
import { isOpen, money, quote } from "@/lib/rules";
import { can, FILM_DATE, KACAU_ID } from "@/lib/preorder";
import type { Order } from "@/lib/types";
export const date = (s: string) =>
  new Date(s).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
const time = (s: string) =>
  new Date(s).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  });
function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining =
    now === null ? null : Math.max(0, Date.parse(FILM_DATE) - now);
  if (remaining === 0) return <p className="cinema-live">Now in cinemas</p>;
  return (
    <div
      className="film-countdown"
      aria-label="Countdown to 12 November 2026 in Malaysia"
    >
      {[
        [remaining === null ? "â€”" : Math.floor(remaining / 86400000), "days"],
        [
          remaining === null ? "â€”" : Math.floor(remaining / 3600000) % 24,
          "hours",
        ],
        [
          remaining === null ? "â€”" : Math.floor(remaining / 60000) % 60,
          "minutes",
        ],
        [
          remaining === null ? "â€”" : Math.floor(remaining / 1000) % 60,
          "seconds",
        ],
      ].map(([value, label]) => (
        <div key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
export function Home() {
  const h = useHub();
  const book = h.data.books.find((b) => b.id === KACAU_ID)!;
  return (
    <div className="home kacau-home">
      <section className="kacau-hero">
        <div className="kacau-copy">
          <span className="eyebrow">
            FEATURED PREORDER / KACAU: MOVIE TIE-IN
          </span>
          <h1>
            <img
              className="kacau-title-art"
              src="/covers/kacau-title.png"
              alt="KACAU â€” Edisi Terhad Movie Tie-In"
              fetchPriority="high"
            />
            <span>
              From page
              <br />
              to screen.
            </span>
          </h1>
          <p className="hero-description">
            One story. A limited edition. <br />
            1,000 copies. No reprint.
          </p>
          <div className="kacau-facts">
            <strong>RM30</strong>
            <span>Ariff Adly</span>
            <span>328 pages</span>
          </div>
          <div className="hero-action-row">
            <Link className="button primary" href={`/books/${KACAU_ID}`}>
              Discover the preorder <ArrowUpRight size={18} />
            </Link>
            <a className="text-link" href="#film">
              The movie <ArrowRight size={16} />
            </a>
          </div>
          <p className="release-note">
            Expected publication Â· 1 November 2026
          </p>
        </div>
        <div className="kacau-art">
          <div className="edition-number">EDISI TERHAD / MOVIE TIE-IN</div>
          <Link
            className="hero-book-link"
            href={`/books/${KACAU_ID}`}
            aria-label="Explore KACAU: Movie Tie-In"
          >
            <BookCover book={book} priority />
          </Link>
          <p className="hero-edition-caption">
            <span>THE MOVIE TIE-IN EDITION</span>
            <b>1,000 copies. Yours to keep.</b>
          </p>
          <span className="art-label">
            A STORY THAT DOESNâ€™T STAY ON THE PAGE.
          </span>
        </div>
      </section>
      <div className="value-strip">
        <span>
          <BookOpen size={17} /> 328 pages
        </span>
        <span>
          <ShieldCheck size={17} /> Only 1,000 copies
        </span>
        <span>
          <Clock size={17} /> Expected 1 November 2026
        </span>
      </div>
      <Bookshelf books={h.data.books.filter((b) => b.active)} />
      <section
        className="film-panel"
        id="film"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(6, 18, 15, .78), rgba(12, 12, 21, .82)), url("${FILM_POSTER.image}")`,
        }}
      >
        <FilmPoster />
        <div>
          <span className="eyebrow">
            <Film size={16} /> KACAU / THE MOVIE
          </span>
          <h2>
            See you
            <br />
            in the dark.
          </h2>
          <p>
            In cinemas <strong>12 November 2026</strong>
          </p>
          <p className="fineprint">First, the book. Then, the big screen.</p>
          <dl className="film-credits">
            <div>
              <dt>Directed by</dt>
              <dd>Muzzamer Rahman</dd>
            </div>
            <div>
              <dt>Produced by</dt>
              <dd>Le Mediator Studio</dd>
            </div>
          </dl>
          <a
            className="text-link film-social"
            href="https://www.instagram.com/filemkacau/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore @filemkacau <ArrowUpRight size={16} />
          </a>
        </div>
        <div>
          <span className="eyebrow">COUNTDOWN TO CINEMA RELEASE</span>
          <Countdown />
          <p className="fineprint">
            Release date in Malaysia. Screening times may vary.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MORE FROM THE BOOKSHELF</span>
            <h2>Explore all books.</h2>
            <p>
              Other titles are on display, with purchasing currently
              unavailable.
            </p>
          </div>
          <Link className="text-link" href="/catalog">
            All books <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="book-grid">
          {h.data.books
            .filter((b) => b.active)
            .map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
        </div>
      </section>
      <section className="section how-it-works">
        <span className="eyebrow">YOUR PREORDER, STEP BY STEP</span>
        <h2>Reserve. Pay. Stay updated.</h2>
        <details className="preorder-steps">
          <summary>
            How preordering works <Plus size={16} />
          </summary>
          <div className="steps-grid">
            {[
              [
                "01",
                "Reserve your copy",
                "Choose your quantity and confirm your delivery details.",
              ],
              [
                "02",
                "Submit payment evidence",
                "Pay using the merchant QR, then upload your receipt.",
              ],
              [
                "03",
                "We verify your payment",
                "Staff checks the transfer and confirms your preorder.",
              ],
              [
                "04",
                "Follow your order",
                "See updates in your account while you await publication.",
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </details>
        <Link className="text-link" href="/about">
          Preorder questions and launch details <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
export function Catalog() {
  const h = useHub();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [category, setCategory] = useState("all");
  const active = h.data.books.filter((book) => book.active);
  const categories = [...new Set(active.map((book) => book.category))].sort();
  const books = active
    .filter(
      (book) =>
        `${book.title} ${book.author}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()) &&
        (category === "all" || book.category === category),
    )
    .sort((a, b) =>
      sort === "az"
        ? a.title.localeCompare(b.title)
        : Number(b.id === KACAU_ID) - Number(a.id === KACAU_ID),
    );
  const filtered = search !== "" || category !== "all";
  function reset() {
    setSearch("");
    setCategory("all");
  }
  return (
    <div className="page section catalog-page">
      <header className="catalog-heading">
        <div>
          <span className="eyebrow">THE FIXIHUB BOOKSHELF</span>
          <h1>All books.</h1>
          <p>Find your next Malaysian story.</p>
        </div>
        <span className="catalog-count">{active.length} titles</span>
      </header>
      <Link href="/preorders" className="catalog-preorder-note">
        <span>
          <b>KACAU: Movie Tie-In</b> <span>Featured preorder · RM30</span>
        </span>
        <ArrowUpRight size={18} />
      </Link>
      <div className="catalog-controls">
        <div className="catalog-tools">
          <label className="search-field">
            <span className="catalog-field-label">Search the bookshelf</span>
            <input
              type="search"
              aria-label="Search titles or authors"
              placeholder="Title or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="sort">
            Sort
            <select
              aria-label="Sort books"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured first</option>
              <option value="az">Title: A–Z</option>
            </select>
          </label>
        </div>
        <div
          className="catalog-categories"
          role="group"
          aria-label="Filter by genre"
        >
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            All genres
          </button>
          {categories.map((genre) => (
            <button
              key={genre}
              type="button"
              aria-pressed={category === genre}
              onClick={() => setCategory(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      <div className="catalog-results">
        <span role="status">
          {books.length} {books.length === 1 ? "book" : "books"}
          {filtered ? " found" : " to explore"}
        </span>
        {filtered ? (
          <button type="button" onClick={reset}>
            Clear filters
          </button>
        ) : (
          <span>Other titles · browsing only</span>
        )}
      </div>
      {books.length ? (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <BookOpen size={28} />
          <h2>No matching stories.</h2>
          <p>Try another title, author or genre.</p>
          <button type="button" className="button secondary" onClick={reset}>
            Show all books
          </button>
        </div>
      )}
    </div>
  );
}
export function Product({ id }: { id: string }) {
  const h = useHub();

  const b = h.data.books.find(
    (b) => (b.id === id || b.slug === id) && b.active,
  );
  if (!b)
    return (
      <Empty
        title="Book not found"
        text="This title may no longer be displayed."
        href="/catalog"
        label="Browse books"
      />
    );
  const c = h.data.campaigns.find((c) => c.book_id === b.id);
  const featured = b.id === KACAU_ID;
  const available =
    featured &&
    b.sale_mode === "preorder" &&
    c &&
    isOpen(c) &&
    c.reserved < c.capacity;
  const label = !featured
    ? "Currently unavailable for purchase"
    : !h.commerceAvailable
      ? "Website preorders opening soon"
      : !c?.active
        ? "Preorders paused"
        : c.reserved >= c.capacity
          ? "Sold out"
          : !isOpen(c)
            ? "Outside preorder window"
            : "Reserve a copy";
  return (
    <div className="page section">
      <div className="breadcrumbs">
        <Link href="/catalog">All books</Link>
        <span>/</span>
        {b.title}
      </div>
      <div className="product-grid">
        <div className="product-art">
          <div className="product-preview">
            <CardPreview book={b} detail />
          </div>
        </div>
        <div className="product-copy">
          <span className="eyebrow">
            {featured ? "LIMITED EDITION / NO REPRINT" : "FROM THE CATALOG"}
          </span>
          <h1>{b.title}</h1>
          <p className="author">by {b.author}</p>
          {featured && (
            <div className="product-price">
              {money(b.price)} <small>per copy Â· postage additional</small>
            </div>
          )}
          {featured && <p>{b.description}</p>}
          {!featured && <BookSynopsis book={b} />}
          <button
            className="button primary wide"
            disabled={!h.ready || !h.commerceAvailable || !available}
            onClick={() => h.add(b, c)}
          >
            {label}
            {available && h.commerceAvailable && <Plus size={18} />}
          </button>
          {featured && (
            <Link className="text-link cart-shortcut" href="/cart">
              View your bag <ShoppingBag size={16} />
            </Link>
          )}
          <div className="product-details">
            {featured ? (
              <>
                <div>
                  <span>Pages</span>
                  <b>328</b>
                </div>
                <div>
                  <span>Reading audience</span>
                  <b>For mature readers</b>
                </div>
                <div>
                  <span>Expected publication</span>
                  <b>1 November 2026</b>
                </div>
                <div>
                  <span>Print run</span>
                  <b>1,000 copies Â· no reprint</b>
                </div>
                <div>
                  <span>Cinema release</span>
                  <b>12 November 2026</b>
                </div>
                <div>
                  <span>Postage</span>
                  <b>RM5 SM / RM10 Sabah, Sarawak & Labuan</b>
                </div>
                <div>
                  <span>Expected dispatch starts</span>
                  <b>Around 1 November 2026</b>
                </div>
              </>
            ) : (
              <div>
                <span>Availability</span>
                <b>Browsing only</b>
              </div>
            )}
          </div>
          {featured && h.demo && (
            <div className="source-box">
              <p>
                Postage: RM5 Semenanjung Malaysia, RM10 Sabah/Sarawak/Labuan per order.
                No per-account purchase limit, subject to available stock.
                Checkout lasts five minutes. Do not send real money in preview.
              </p>
            </div>
          )}
          {featured && <BookSynopsis book={b} />}
          <BookInsights book={b} />
          {!featured && b.source_url && (
            <a
              className="text-link cart-shortcut"
              href={b.source_url}
              target="_blank"
              rel="noreferrer"
            >
              Book information source <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
export function Preorders() {
  const h = useHub();
  const c = h.data.campaigns.find((campaign) => campaign.book_id === KACAU_ID);
  const book = h.data.books.find((book) => book.id === KACAU_ID && book.active);
  const state = !h.commerceAvailable
    ? "opening_soon"
    : !c?.active
      ? "paused"
      : c.reserved >= c.capacity
        ? "sold_out"
        : isOpen(c)
          ? "open"
          : "closed";
  const available =
    h.ready && h.commerceAvailable && state === "open" && book?.sale_mode === "preorder";
  if (!book || !c)
    return (
      <Empty
        title="More stories are on the way."
        text="Check back for the next FIXIHUB preorder."
        href="/catalog"
        label="Explore the bookshelf"
      />
    );
  return (
    <div className="page section preorder-page">
      <header className="preorder-heading">
        <div>
          <span className="eyebrow">FIXIHUB / UPCOMING EDITIONS</span>
          <h1>Preorders.</h1>
        </div>
        <Link className="text-link" href="/orders">
          My orders <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="preorder-feature" aria-labelledby="preorder-title">
        <Link
          className="preorder-cover"
          href={`/books/${book.id}`}
          aria-label="Explore the KACAU edition"
        >
          <BookCover book={book} priority />
          <span>LIMITED EDITION · NO REPRINT</span>
        </Link>
        <div className="preorder-offer">
          <div className="preorder-status">
            <span className="eyebrow">FEATURED PREORDER</span>
            <Status value={state} />
          </div>
          <h2 id="preorder-title">
            KACAU<span>Movie Tie-In</span>
          </h2>
          <p className="preorder-author">Ariff Adly · 328 pages</p>
          <p className="preorder-description">
            From the page to the big screen. Just 1,000 copies of this edition,
            with no reprint.
          </p>
          <div className="preorder-price">
            <strong>{money(book.price)}</strong>
            <span>per copy · postage additional</span>
          </div>
          <div className="preorder-actions">
            <button
              className="button primary"
              disabled={!available}
              onClick={() => h.add(book, c)}
            >
              {state === "open"
                ? "Reserve a copy"
                : state === "opening_soon"
                  ? "Opening soon"
                  : state === "sold_out"
                    ? "Sold out"
                    : state === "paused"
                      ? "Preorders paused"
                      : "Preorders closed"}
              <Plus size={17} />
            </button>
            <Link className="text-link" href="/cart">
              View bag <ShoppingBag size={16} />
            </Link>
          </div>
          <Link className="preorder-details-link" href={`/books/${book.id}`}>
            Synopsis & edition details <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
      <div className="preorder-milestones">
        <div>
          <BookOpen size={18} />
          <span>
            Expected publication<strong>1 November 2026</strong>
          </span>
        </div>
        <div>
          <Film size={18} />
          <span>
            In cinemas<strong>12 November 2026</strong>
          </span>
        </div>
        <div>
          <ShieldCheck size={18} />
          <span>
            Limited print run<strong>1,000 copies · no reprint</strong>
          </span>
        </div>
      </div>
      {h.demo && (
        <div className="preorder-preview">
          <div>
            <span className="eyebrow">PREVIEW AVAILABILITY</span>
            <strong>
              {Math.max(0, c.capacity - c.reserved).toLocaleString()} /{" "}
              {c.capacity.toLocaleString()} copies
            </strong>
          </div>
          <progress
            value={c.reserved}
            max={c.capacity}
            aria-label="Preview copies reserved"
          />
          <p>
            Sample window ends {date(c.closes_at)}. Counts and dates are
            demonstrations, not live sales.
          </p>
        </div>
      )}
      <section className="preorder-help" aria-labelledby="preorder-help-title">
        <h2 id="preorder-help-title">Before you preorder</h2>
        <details>
          <summary>How does preordering work?</summary>
          <p>
            Reserve your copy and enter your delivery details. When payments go
            live, pay using the merchant QR and upload your receipt. Staff will
            review it and update your order.
          </p>
        </details>
        <details>
          <summary>When will my book arrive?</summary>
          <p>
            Dispatch is expected to start around 1 November 2026. This is an
            estimate for posting, not a guaranteed arrival date.
          </p>
        </details>
        <details>
          <summary>Payment, postage & copy limits</summary>
          <p>
            Postage is RM5 for Semenanjung Malaysia and RM10 for Sabah/Sarawak/Labuan
            per order. There is no per-account purchase limit; stock is limited
            to 1,000 copies overall. Checkout lasts five minutes.
            Delivery coverage and final rates will be confirmed before launch.
          </p>
        </details>
      </section>
      <p className="preorder-browse">
        Looking for another story?{" "}
        <Link href="/catalog">
          Browse the FIXIHUB bookshelf <ArrowUpRight size={14} />
        </Link>
      </p>
    </div>
  );
}
export function Cart() {
  const h = useHub(),
    router = useRouter();
  const [emailDraft, setEmailDraft] = useState<{
    account: string;
    value: string;
  } | null>(null);
  const account = h.profile?.id || "guest";
  const [destinationDraft, setDestinationDraft] = useState<{ account: string; country: string; region: string } | null>(null);
  const destination = destinationDraft?.account === account ? destinationDraft : { country: h.profile?.delivery?.country || "MY", region: h.profile?.delivery?.region || "" };
  const email =
    emailDraft?.account === account ? emailDraft.value : h.profile?.email || "";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [key] = useState(() => crypto.randomUUID());
  let q: ReturnType<typeof quote> | null = null,
    quoteError = "";
  try {
    if (h.cart.length) q = quote(h.cart, h.data.books, h.data.campaigns, Date.now(), destination);
  } catch (e) {
    quoteError = (e as Error).message;
  }
  if (!h.ready) return <div className="page section">Loading your bagâ€¦</div>;
  if (!h.cart.length)
    return (
      <Empty
        title="Your copy is waiting."
        text="Discover the KACAU limited edition and add it to your bag."
        href={`/books/${KACAU_ID}`}
        label="Discover KACAU"
      />
    );
  return (
    <div className="page section cart-page">
      <div className="page-intro">
        <span className="eyebrow">YOUR LIMITED EDITION</span>
        <h1>Your preorder.</h1>
        <p>Copies are held after checkout, not while in your bag.</p>
      </div>
      <form
        className="checkout-grid compact-checkout"
        onChange={(e) => {
          const fields = new FormData(e.currentTarget);
          setDestinationDraft({ account, country: String(fields.get("country") || "MY"), region: String(fields.get("region") || "") });
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            if (!navigator.onLine)
              throw Error("Reconnect before placing an order.");
            const delivery = deliveryFromForm(e.currentTarget);
            await h.placeOrder(delivery.address, key, delivery.phone, email, delivery);
            router.push("/orders");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          {h.cart.map((i) => {
            const b = h.data.books.find((b) => b.id === i.book_id);
            return (
              <div className="cart-line" key={i.book_id}>
                {b && <BookCover book={b} small />}
                <div>
                  <h3>{b?.title || "Unavailable book"}</h3>
                  <p>{b?.author}</p>
                  <div className="quantity">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        h.setCart((old) =>
                          old.map((x) =>
                            x.book_id === i.book_id
                              ? { ...x, quantity: Math.max(1, x.quantity - 1) }
                              : x,
                          ),
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{i.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        h.setCart((old) =>
                          old.map((x) =>
                            x.book_id === i.book_id
                              ? { ...x, quantity: x.quantity + 1 }
                              : x,
                          ),
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-line-end">
                  <strong>{money((b?.price || 0) * i.quantity)}</strong>
                  <button
                    type="button"
                    aria-label="Remove book"
                    onClick={() =>
                      h.setCart((old) =>
                        old.filter((x) => x.book_id !== i.book_id),
                      )
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="fineprint">
            Dispatch is expected to start around 1 November 2026, subject to
            publication readiness. This is not a guaranteed arrival date.
          </p>
          <section
            className="checkout-details"
            aria-labelledby="contact-heading"
          >
            <h2 id="contact-heading">Contact & delivery</h2>
            <label>
              Contact email
              <input
                type="email"
                required
                maxLength={200}
                value={email}
                onChange={(e) =>
                  setEmailDraft({ account, value: e.target.value })
                }
                autoComplete="email"
              />
            </label>
            <DeliveryFields key={account} initial={h.profile?.delivery} />
          </section>
        </div>
        <aside
          className="checkout-summary checkout-receipt"
          aria-label="Order summary"
        >
          <div className="receipt-brand">
            FIXI<span>HUB</span>
          </div>
          <p className="receipt-caption">{h.demo ? "PREORDER / PREVIEW" : "PREORDER"}</p>
          <h2>Order summary</h2>
          <div className="summary-line">
            <span>Books</span>
            <b>{money(q?.book_total || 0)}</b>
          </div>
          <div className="summary-line">
            <span>{destination.region ? "Postage" : "Postage (from RM5; select state)"}</span>
            <b>{money(q?.shipping_total || 0)}</b>
          </div>
          <div className="summary-line total">
            <span>{h.demo ? "Preview total" : "Total"}</span>
            <b>{money((q?.book_total || 0) + (q?.shipping_total || 0))}</b>
          </div>
          <p className="receipt-note">
            {h.demo ? "Preview only — no real payment. Use fictional details." : "Pay the exact total, then upload your receipt for verification."}
          </p>
          <details className="checkout-terms">
            <summary>Postage & reservation details</summary>
            <p>
              RM5 for Semenanjung Malaysia; RM10 for Sabah/Sarawak/Labuan per order.
              Select your delivery state for the correct total. No per-account
              purchase limit; quantities remain subject to available stock.
              The checkout window is five minutes.
            </p>
          </details>
          {!h.profile && (
            <Link className="button secondary wide" href="/account">
              {h.demo ? "Choose a preview account" : "Sign in with Google"}
            </Link>
          )}
          {(error || quoteError) && (
            <p className="form-error" role="alert">
              {error || quoteError}
            </p>
          )}
          <button
            className="button primary wide"
            disabled={!h.commerceAvailable || !h.profile || busy || !q}
          >
            {busy ? "Reservingâ€¦" : (h.demo ? "Place preview preorder" : "Reserve & pay")}
            <ArrowRight size={17} />
          </button>
        </aside>
      </form>
    </div>
  );
}
export function PaymentInstructions({ order }: { order: Order }) {
  const h = useHub();
  if (!h.demo) return <div className="payment-instructions">
    {h.paymentReady && h.payment ? <>
      <img className="merchant-qr" src={h.payment.qr_url} alt="Merchant payment QR code" width={180} height={180} />
      <div><span className="eyebrow">SCAN TO PAY</span><h3>{money(order.book_total + order.shipping_total)}</h3>
        <p>Payee: <strong>{h.payment.payee}</strong></p>
        {h.payment.bank_name && <p>Bank: <strong>{h.payment.bank_name}</strong><br />Account number: <strong>{h.payment.account_number}</strong></p>}
        {h.payment.instructions && <p>{h.payment.instructions}</p>}
        <p>Books {money(order.book_total)} + postage {money(order.shipping_total)}. Pay once, then upload your receipt before the timer ends.</p>
        <p>Order reference: <strong>{order.id.slice(0,8).toUpperCase()}</strong></p>
        <a className="text-link" href={h.payment.qr_url} download>Save payment QR</a>
        <p className="fineprint">Payment help: {h.payment.support}. If already paid, do not pay again.</p>
      </div>
    </> : <p>Payment is temporarily unavailable. Do not transfer money. {h.payment?.support ? `Contact: ${h.payment.support}` : "Please check back shortly."}</p>}
  </div>;
  return (
    <div className="payment-instructions">
      <div
        className="qr-placeholder"
        aria-label="Payment QR placeholder, not a payment code"
      >
        <QrCode size={70} />
        <span>QR NOT CONFIGURED</span>
      </div>
      <div>
        <span className="eyebrow">PAYMENT PREVIEW</span>
        <h3>{money(order.book_total + order.shipping_total)} · one transfer</h3>
        <p>
          Books {money(order.book_total)} + postage{" "}
          {money(order.shipping_total)}.
        </p>
        <p>
          The approved merchant QR and payee name will appear here before
          launch. <strong>Do not send real money.</strong>
        </p>
        <p className="fineprint">
          Order reference: {order.id.slice(0, 8).toUpperCase()}. Use a fictional
          receipt to test the review flow.
        </p>
      </div>
    </div>
  );
}
export function Orders() {
  const h = useHub();
  const [selected, setSelected] = useState<Order | null>(null),
    [file, setFile] = useState<File | null>(null),
    [reference, setReference] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const orders = h.data.orders
    .filter((o) => o.customer_id === h.profile?.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const closed = ["cancelled", "expired", "refunded"];
  const visibleOrders = orders.filter(
    (o) =>
      filter === "all" ||
      (filter === "active"
        ? !closed.includes(o.status)
        : closed.includes(o.status)),
  );
  async function action(id: string, kind: "cancel" | "request_refund") {
    setBusy(true);
    try {
      await h.transition(
        id,
        kind,
        kind === "cancel"
          ? "Cancelled by customer before payment."
          : "Customer requested a refund. Please contact customer to resolve.",
      );
    } catch (e) {
      h.notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page section orders-page">
      <div className="page-intro">
        <span className="eyebrow">YOUR PREORDERS</span>
        <h1>My orders.</h1>
        <p>Track your preorder, from reservation to dispatch.</p>
      </div>
      {!h.profile ? (
        <Empty
          title="Sign in to view your orders"
          text="Choose a mock customer to explore the preorder flow."
          href="/account"
          label="Choose account"
        />
      ) : !orders.length ? (
        <Empty
          title="Your first preorder starts here."
          text="Reserve KACAU and follow its progress in your account."
          href={`/books/${KACAU_ID}`}
          label="Discover KACAU"
        />
      ) : (
        <div className="preorder-orders">
          <div className="orders-toolbar">
            <div role="group" aria-label="Filter orders">
              {["all", "active", "closed"].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value === "all"
                    ? "All orders"
                    : value === "active"
                      ? "In progress"
                      : "Closed"}
                </button>
              ))}
            </div>
            <span role="status">
              {visibleOrders.length}{" "}
              {visibleOrders.length === 1 ? "order" : "orders"}
            </span>
          </div>
          {!visibleOrders.length && (
            <div className="orders-filter-empty">
              <p>
                No{" "}
                {filter === "active" ? "orders in progress" : "closed orders"}.
              </p>
              <button
                type="button"
                className="text-link"
                onClick={() => setFilter("all")}
              >
                Show all orders
              </button>
            </div>
          )}
          {visibleOrders.map((o) => {
            const attempts = h.data.payments
              .filter((p) => p.order_id === o.id)
              .sort(
                (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
              );
            return (
              <article className="panel order-card" key={o.id}>
                <div className="order-top">
                  <div>
                    <span className="eyebrow">
                      ORDER / {o.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p>{date(o.created_at)}</p>
                  </div>
                  <Status value={o.status} />
                </div>
                {o.items.map((i) => (
                  <div className="order-item" key={i.book_id}>
                    {h.data.books.find((b) => b.id === i.book_id) && (
                      <Link
                        href={`/books/${i.book_id}`}
                        className="order-cover-link"
                        aria-label={`View ${i.title}`}
                      >
                        <BookCover
                          book={h.data.books.find((b) => b.id === i.book_id)!}
                          small
                        />
                      </Link>
                    )}
                    <div>
                      <h3>{i.title}</h3>
                      <small>
                        {i.quantity} × {money(i.unit_price)}
                      </small>
                    </div>
                    <strong>{money(i.quantity * i.unit_price)}</strong>
                  </div>
                ))}
                <div className="summary-line order-total">
                  <span>
                    Total <small>including postage</small>
                  </span>
                  <b>{money(o.book_total + o.shipping_total)}</b>
                </div>
                {!closed.includes(o.status) &&
                  o.status !== "payment_issue" &&
                  o.status !== "refund_requested" && (
                    <ol
                      className="order-progress"
                      aria-label="Preorder progress"
                    >
                      {[
                        "Reserved",
                        "Payment review",
                        "Confirmed",
                        "Preparing",
                      ].map((label, index) => {
                        const step = [
                          "awaiting_payment",
                          "payment_review",
                          "confirmed",
                          "preparing",
                        ].indexOf(o.status);
                        return (
                          <li
                            key={label}
                            data-reached={index <= step}
                            aria-current={index === step ? "step" : undefined}
                          >
                            <span>
                              {index < step ? <Check size={12} /> : index + 1}
                            </span>
                            {label}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                {closed.includes(o.status) && (
                  <p className="order-message">
                    {o.status === "expired"
                      ? "Your unpaid reservation expired. You can reserve again while copies are available."
                      : o.status === "refunded"
                        ? "The team has marked your refund as completed."
                        : "This reservation was cancelled. No further payment is needed."}
                  </p>
                )}
                {o.status === "awaiting_payment" && (
                  <>
                    <p className="deadline">
                      <Clock size={16} /> Upload by {time(o.expires_at!)} MYT
                    </p>
                    {attempts[0]?.status === "rejected" && (
                      <p className="form-error" role="alert">
                        Receipt needs correction:{" "}
                        {attempts[0].note || "Please upload a clearer receipt."}
                      </p>
                    )}
                    <PaymentInstructions order={o} />
                    <button
                      className="button primary"
                      onClick={() => {
                        setSelected(o);
                        setFile(null);
                        setReference("");
                        setError("");
                      }}
                    >
                      <Upload size={16} /> Upload receipt
                    </button>
                    <button
                      className="text-link cancel-order"
                      disabled={busy}
                      onClick={() => action(o.id, "cancel")}
                    >
                      Cancel unpaid reservation
                    </button>
                  </>
                )}
                {o.status === "payment_review" && (
                  <p className="order-message">
                    <ShieldCheck size={18} /> Your receipt is awaiting review.
                    Your copies remain reserved.
                  </p>
                )}
                {["confirmed", "preparing"].includes(o.status) && (
                  <>
                    <p className="order-message">
                      <Check size={18} /> Payment approved.{" "}
                      {o.status === "preparing"
                        ? "Your order is being prepared."
                        : "Your preorder is confirmed, awaiting publication."}
                    </p>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => action(o.id, "request_refund")}
                    >
                      Request cancellation / refund
                    </button>
                  </>
                )}
                {!h.demo && o.status === "expired" && <div className="order-message">
                  <p>Already paid? Do not pay again. Submit your receipt for late-payment review; stock is not guaranteed. Payment help: {h.payment?.support || "contact the publisher"}.</p>
                  <button className="button secondary" onClick={() => { setSelected(o); setFile(null); setReference(""); setError(""); }}>Submit already-paid receipt</button>
                </div>}
                {o.status === "payment_issue" && <p className="order-message">Your late payment needs staff attention because no copies were available to reserve. Do not pay again. Contact {h.payment?.support || "the publisher"} for refund assistance.</p>}
                {o.status === "refund_requested" && (
                  <p className="order-message">
                    Your refund request is with the team. This does not mean a
                    refund has been paid.
                  </p>
                )}
                <details className="order-details">
                  <summary>Delivery details and payment history</summary>
                  <p>
                    {o.customer_name}
                    <br />
                    {o.address}
                    <br />
                    {o.phone} · {o.email}
                  </p>
                  {attempts.map((p) => (
                    <div className="receipt-history" key={p.id}>
                      <Status value={p.status} />
                      <span>
                        {money(p.amount)} · {p.reference}
                      </span>
                      <p>{p.note || "Awaiting staff review"}</p>
                    </div>
                  ))}
                </details>
                <details className="order-details order-activity">
                  <summary>Order activity</summary>
                  <ol className="order-timeline">
                    {(h.data.events || [])
                      .filter((e) => e.order_id === o.id)
                      .map((e) => (
                        <li key={e.id}>
                          <span>{time(e.created_at)}</span>
                          <p>{e.detail}</p>
                        </li>
                      ))}
                  </ol>
                </details>
              </article>
            );
          })}
        </div>
      )}
      {selected && (
        <Modal
          title="Submit payment evidence"
          onClose={() => !busy && setSelected(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!file) return;
              setBusy(true);
              setError("");
              try {
                await h.upload(selected.id, "book", file, reference);
                setSelected(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>
              One receipt for the total{" "}
              {money(selected.book_total + selected.shipping_total)}. Use
              {h.demo ? "fictional evidence in this preview." : "your bank transfer receipt. Do not pay again if you already transferred the total."}
            </p>
            <label>
              Transfer reference
              <input
                required
                minLength={3}
                maxLength={120}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label className="upload-zone">
              <Upload />
              <strong>Choose a receipt</strong>
              <span>JPG, PNG or PDF · maximum 10 MB</span>
              <input
                aria-label="Receipt file"
                type="file"
                required
                accept="image/jpeg,image/png,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={busy}>
              {busy ? "Uploading…" : "Submit for review"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function Account() { return <GoogleLogin />; }
export function Library() {
  return (
    <Empty
      title="The focus is KACAU."
      text="Digital purchases are not part of this launch."
      href="/catalog"
      label="Explore the books"
    />
  );
}
export function About() {
  return (
    <div className="page section prose">
      <span className="eyebrow">PREORDER INFORMATION</span>
      <h1>
        A few things
        <br />
        before your next chapter.
      </h1>
      <h2>What is this edition?</h2>
      <p>
        KACAU: Movie Tie-In by Ariff Adly. RM30 per copy, 328 pages, limited to
        1,000 copies with no reprint. All preorders are planned through this
        website.
      </p>
      <h2>When will it be available?</h2>
      <p>
        Dispatch is expected to start around 1 November 2026. This is an
        estimate, not a guaranteed arrival date. The KACAU movie is scheduled for cinemas on 12 November
        2026.
      </p>
      <h2>How does payment work?</h2>
      <p>
        The planned flow is a merchant QR payment followed by a receipt upload.
        Staff checks the transfer before confirming the preorder. This preview
        has no payment destination: please do not transfer money.
      </p>
      <h2>What about postage and limits?</h2>
      <p>
        Postage is RM5 per order for Semenanjung Malaysia and RM10 for
        Sabah/Sarawak/Labuan. There is no per-account purchase limit, subject to the
        remaining stock of this 1,000-copy edition. Checkout lasts five minutes.
      </p>
      <h2>Can I cancel?</h2>
      <p>
        In the preview, unpaid orders can be cancelled before evidence is under
        review. Paid orders can request a refund for admin review. Final
        cancellation and refund terms will be published before launch.
      </p>
      <h2>Your details</h2>
      <p>
        Use fictional names, contact details and receipts while testing. Preview
        records stay in this browser. The production privacy notice, retention
        policy and official support contact are pending.
      </p>
      <h2>Other books and artwork</h2>
      <p>
        Other real catalog titles remain available to browse, with purchasing
        disabled. Existing book artwork belongs to its respective owners. The
        KACAU jacket shown on this website is the supplied movie tie-in cover.
        Further film information will be added when available.
      </p>
    </div>
  );
}
