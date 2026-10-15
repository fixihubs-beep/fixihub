import type { Book, Campaign, CartItem, Order, Payment } from "./types";
import { KACAU_ID, COPY_LIMIT, CAPACITY } from "./preorder";
export const money = (n: number) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(
    n,
  );
export function isOpen(c: Campaign, now = Date.now()) {
  return (
    c.active && Date.parse(c.opens_at) <= now && Date.parse(c.closes_at) >= now
  );
}
export function quote(
  cart: CartItem[],
  books: Book[],
  campaigns: Campaign[],
  now = Date.now(),
) {
  if (!cart.length) throw Error("Your bag is empty.");
  if (cart.length > 30) throw Error("Too many items.");
  const seen = new Set<string>();
  let total = 0;
  let physical = false;
  const items = cart.map((i) => {
    if (seen.has(i.book_id)) throw Error("Duplicate book in bag.");
    seen.add(i.book_id);
    const b = books.find((b) => b.id === i.book_id && b.active);
    if (!b) throw Error("Book unavailable.");
    if (b.id !== KACAU_ID || b.sale_mode !== "preorder")
      throw Error("This book is currently unavailable for purchase.");
    if (!i.campaign_id)
      throw Error("Choose the active KACAU preorder campaign.");
    if (
      !Number.isInteger(i.quantity) ||
      i.quantity < 1 ||
      i.quantity > COPY_LIMIT
    )
      throw Error("Choose 1–2 copies of this limited edition.");
    if (b.format === "ebook" && i.quantity !== 1)
      throw Error("Choose one digital entitlement per order.");
    if (i.campaign_id) {
      const c = campaigns.find(
        (c) => c.id === i.campaign_id && c.book_id === b.id,
      );
      if (
        !c ||
        !isOpen(c, now) ||
        c.reserved + i.quantity > Math.min(c.capacity, CAPACITY)
      )
        throw Error("Preorder unavailable.");
    } else if (b.format === "physical" && b.stock < i.quantity)
      throw Error("Not enough stock.");
    total += b.price * i.quantity;
    physical ||= b.format === "physical";
    return { ...i, title: b.title, format: b.format, unit_price: b.price };
  });
  // Preview-only postage, explicitly identified in checkout. Live checkout stays disabled.
  return { items, book_total: total, shipping_total: physical ? 8 : 0 };
}
export function balance(o: Order, p: Payment[], kind: "book" | "shipping") {
  return Math.max(
    0,
    (kind === "book" ? o.book_total : o.shipping_total) -
      p
        .filter(
          (p) =>
            p.order_id === o.id && p.kind === kind && p.status === "verified",
        )
        .reduce((a, p) => a + p.amount, 0),
  );
}
export function receiptValid(file: Pick<File, "size" | "type">) {
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type))
    throw Error("Choose a JPG, PNG or PDF receipt.");
  if (file.size > 5 * 1024 * 1024 || file.size === 0)
    throw Error("Receipt must be between 1 byte and 5 MB.");
}
export const csvCell = (v: unknown) =>
  '"' +
  String(v ?? "")
    .replace(/^[\t\r\n ]*[=+@-]/, "'$&")
    .replaceAll('"', '""') +
  '"';
