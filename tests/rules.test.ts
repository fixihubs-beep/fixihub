import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, receiptValid, csvCell, postage } from "../lib/rules";
import { initialData } from "../lib/seed";
import {
  assertReview,
  assertRoleChange,
  can,
  expireOrders,
  KACAU_ID,
  syncReservations,
} from "../lib/preorder";
import type { Order, Data, Profile } from "../lib/types";
const now = Date.parse("2026-10-15T04:00:00Z");
const cart = [
  { book_id: KACAU_ID, quantity: 1, campaign_id: initialData.campaigns[0].id },
];
const customer = initialData.profiles[0],
  staff = initialData.profiles[2],
  admin = initialData.profiles[3],
  superadmin = initialData.profiles[4];
function fixture(): Data {
  const q = quote(cart, initialData.books, initialData.campaigns, now);
  const order: Order = {
    id: "order-1",
    customer_id: customer.id,
    customer_name: customer.display_name,
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + 86400000).toISOString(),
    status: "awaiting_payment",
    address: "Fictional full delivery address",
    tracking_number: null,
    ...q,
  };
  return syncReservations({ ...structuredClone(initialData), orders: [order] });
}
test("KACAU authoritative preview quote includes one postage charge", () => {
  const q = quote(
    [{ ...cart[0], quantity: 2 }],
    initialData.books,
    initialData.campaigns,
    now,
  );
  assert.equal(q.book_total, 60);
  assert.equal(q.shipping_total, 5);
});

test("regional postage is flat per order and quantities above two use remaining stock", () => {
  assert.equal(postage("MY", "Selangor"), 5);
  assert.equal(postage("MY", "Sabah"), 10);
  assert.equal(postage("MY", "Sarawak"), 10);
  assert.throws(() => postage("SG", ""), /Malaysia only/);
  assert.equal(postage("MY", "Labuan"), 10);
  const q = quote([{ ...cart[0], quantity: 20 }], initialData.books, initialData.campaigns, now, { country: "MY", region: "Sabah" });
  assert.equal(q.book_total, 600);
  assert.equal(q.shipping_total, 10);
  assert.throws(() => quote([{ ...cart[0], quantity: 20 }], initialData.books, [{ ...initialData.campaigns[0], reserved: 990 }], now), /unavailable/);
});
test("catalog-only books, omitted campaign and forged campaign fail closed", () => {
  assert.throws(() =>
    quote(
      [{ book_id: initialData.books[0].id, quantity: 1 }],
      initialData.books,
      initialData.campaigns,
      now,
    ),
  );
  assert.throws(() =>
    quote(
      [{ book_id: KACAU_ID, quantity: 1 }],
      initialData.books,
      initialData.campaigns,
      now,
    ),
  );
  assert.throws(() =>
    quote(
      [{ ...cart[0], campaign_id: "forged" }],
      initialData.books,
      initialData.campaigns,
      now,
    ),
  );
});
test("invalid quantity, duplicate lines, closed/paused/full campaigns are rejected", () => {
  for (const quantity of [0, -1, 1.5, 1001])
    assert.throws(() =>
      quote(
        [{ ...cart[0], quantity }],
        initialData.books,
        initialData.campaigns,
        now,
      ),
    );
  assert.throws(() =>
    quote([...cart, ...cart], initialData.books, initialData.campaigns, now),
  );
  assert.throws(() =>
    quote(
      cart,
      initialData.books,
      initialData.campaigns,
      Date.parse("2027-01-01"),
    ),
  );
  for (const patch of [
    { active: false },
    { reserved: 1000 },
    { capacity: 1001, reserved: 1000 },
  ])
    assert.throws(() =>
      quote(
        cart,
        initialData.books,
        [{ ...initialData.campaigns[0], ...patch }],
        now,
      ),
    );
});
test("expiry releases unpaid copies once and creates one audit event", () => {
  const data = fixture();
  assert.equal(data.campaigns[0].reserved, 1);
  const expired = expireOrders(data, now + 86400001);
  assert.equal(expired.orders[0].status, "expired");
  assert.equal(expired.campaigns[0].reserved, 0);
  assert.equal(expired.events?.length, 1);
  assert.equal(expireOrders(expired, now + 86400002), expired);
});
test("review and paid reservations never expire automatically", () => {
  for (const status of [
    "payment_review",
    "confirmed",
    "preparing",
    "refund_requested",
  ] as const) {
    const data = fixture();
    data.orders[0].status = status;
    assert.equal(expireOrders(data, now + 999999999).campaigns[0].reserved, 1);
  }
});
test("permissions separate staff, admin and superadmin", () => {
  assert.equal(can(null, "review"), false);
  assert.equal(can(customer, "review"), false);
  assert.equal(can(staff, "review"), true);
  assert.equal(can(staff, "catalog"), false);
  assert.equal(can(staff, "reports"), false);
  assert.equal(can(admin, "staff"), true);
  assert.equal(can(admin, "security"), false);
  assert.equal(can(superadmin, "security"), true);
  assert.equal(can({ ...superadmin, active: false }, "security"), false);
});
test("pending review requires authorized non-owner and eligible order", () => {
  const data = fixture();
  data.orders[0].status = "payment_review";
  data.payments.push({
    id: "payment-1",
    order_id: "order-1",
    kind: "book",
    amount: 38,
    status: "pending",
    receipt_path: "path",
    note: "",
    created_at: new Date(now).toISOString(),
  });
  assertReview(data, staff, "payment-1");
  assert.throws(() => assertReview(data, customer, "payment-1"));
  assert.throws(() =>
    assertReview(data, { ...staff, id: customer.id }, "payment-1"),
  );
  data.payments[0].status = "verified";
  assert.throws(() => assertReview(data, staff, "payment-1"));
});
test("admins cannot assign elevated roles or alter superadmin; last superadmin protected", () => {
  assertRoleChange(admin, customer, "staff", true, initialData.profiles);
  assert.throws(() =>
    assertRoleChange(admin, customer, "admin", true, initialData.profiles),
  );
  assert.throws(() =>
    assertRoleChange(admin, superadmin, "customer", true, initialData.profiles),
  );
  assert.throws(() =>
    assertRoleChange(
      superadmin,
      superadmin,
      "customer",
      true,
      initialData.profiles,
    ),
  );
});
test("receipt boundaries and CSV formula escaping", () => {
  for (const f of [
    { type: "text/html", size: 100 },
    { type: "image/png", size: 0 },
    { type: "image/png", size: 10 * 1024 * 1024 + 1 },
  ])
    assert.throws(() => receiptValid(f));
  receiptValid({ type: "application/pdf", size: 10 * 1024 * 1024 });
  assert.equal(csvCell("=SUM(A1)"), '"\'=SUM(A1)"');
  assert.equal(csvCell('A"B'), '"A""B"');
});

test("invalid roles and removal of the last superadmin are rejected", () => {
  assert.throws(
    () =>
      assertRoleChange(
        superadmin,
        customer,
        "owner" as Profile["role"],
        true,
        initialData.profiles,
      ),
    /valid account role/,
  );
  const otherAdmin = { ...superadmin, id: "other-superadmin" };
  assert.throws(
    () =>
      assertRoleChange(
        otherAdmin,
        superadmin,
        "customer",
        true,
        initialData.profiles,
      ),
    /at least one active superadmin/,
  );
});
