"use client";
import { useEffect, useState } from "react";
import {
  Check,
  Download,
  Pause,
  Play,
  ShieldCheck,
  X,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  BookOpen,
  CalendarDays,
  Users,
  BarChart3,
  History,
  LockKeyhole,
  ArrowUpRight,
} from "lucide-react";
import { useHub } from "./provider";
import { Empty, Modal, Status } from "./ui";
import { BookCover } from "./book-cover";
import { money, csvCell } from "@/lib/rules";
import { can, CAPACITY, holdsInventory, KACAU_ID } from "@/lib/preorder";
import type { Book, Campaign, Order, Payment, Profile } from "@/lib/types";
function localInput(value: string) {
  return new Date(Date.parse(value) + 8 * 3600000).toISOString().slice(0, 16);
}
const descriptions: Record<string, string> = {
  overview: "The limited edition, at a glance.",
  orders: "Every reservation and its next step.",
  payments: "Match evidence to bank records before approving.",
  catalog: "Keep the bookshelf accurate.",
  campaigns: "Control the website preorder window.",
  people: "Manage access without sharing identities.",
  reports: "Separate reservations from verified payments.",
  audit: "A record of operational changes.",
  security: "Access governance and launch readiness.",
};
const tabLabels: Record<string, string> = {
  overview: "Overview",
  orders: "Orders",
  payments: "Payment review",
  catalog: "Catalog",
  campaigns: "Campaigns",
  people: "Team & customers",
  reports: "Reports",
  audit: "Audit",
  security: "Security",
};
const tabIcons = {
  overview: LayoutDashboard,
  orders: ShoppingBag,
  payments: Receipt,
  catalog: BookOpen,
  campaigns: CalendarDays,
  people: Users,
  reports: BarChart3,
  audit: History,
  security: LockKeyhole,
};
export function Admin() {
  const h = useHub();
  const [tab, setTab] = useState("overview"),
    [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessChange, setAccessChange] = useState<{
    profile: Profile;
    role: Profile["role"];
    active: boolean;
  } | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null),
    [order, setOrder] = useState<Order | null>(null),
    [book, setBook] = useState<Book | null>(null),
    [campaign, setCampaign] = useState<Campaign | null>(null);
  const [note, setNote] = useState(""),
    [receiptUrl, setReceiptUrl] = useState(""),
    [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      if (receiptUrl.startsWith("blob:")) URL.revokeObjectURL(receiptUrl);
    },
    [receiptUrl],
  );
  useEffect(() => {
    setTab("overview");
    setSearch("");
    setStatusFilter("all");
    setAccessChange(null);
    setPayment(null);
    setOrder(null);
    setBook(null);
    setCampaign(null);
    setReceiptUrl("");
    setError("");
  }, [h.profile?.id, h.profile?.role]);
  if (!h.ready) return <div className="page section">Loading workspace…</div>;
  if (!can(h.profile, "review"))
    return (
      <Empty
        title="The publisher workspace"
        text="Staff, admin and superadmin accounts have access. Choose a preview identity to test permissions."
        href="/account"
        label="Choose account"
      />
    );
  const manager = can(h.profile, "catalog"),
    security = can(h.profile, "security");
  const tabs = [
    "overview",
    "orders",
    "payments",
    ...(manager ? ["catalog", "campaigns", "people", "reports", "audit"] : []),
    ...(security ? ["security"] : []),
  ];
  const pending = h.data.payments.filter((p) => p.status === "pending");
  const collected = h.data.payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);
  const refunded = h.data.orders
    .filter((o) => o.status === "refunded")
    .reduce((sum, o) => sum + o.book_total + o.shipping_total, 0);
  const c = h.data.campaigns.find((campaign) => campaign.book_id === KACAU_ID);
  const matches = (value: string) =>
    value.toLowerCase().includes(search.trim().toLowerCase());
  async function act(fn: () => Promise<void>, close?: () => void) {
    setError("");
    setBusy(true);
    try {
      await fn();
      close?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportReport() {
    if (!can(h.profile, "reports")) return;
    const rows = [
      [
        "Order",
        "Customer",
        "Status",
        "Copies",
        "Books MYR",
        "Postage MYR",
        "Approved MYR",
        "Refunded MYR",
      ],
      ...h.data.orders.map((o) => [
        o.id,
        o.customer_name,
        o.status,
        o.items.reduce((n, i) => n + i.quantity, 0),
        o.book_total,
        o.shipping_total,
        h.data.payments
          .filter((p) => p.order_id === o.id && p.status === "verified")
          .reduce((n, p) => n + p.amount, 0),
        o.status === "refunded" ? o.book_total + o.shipping_total : 0,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kacau-preview-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function openOrder(o: Order) {
    setOrder(o);
    setNote("");
    setError("");
  }
  function openPayment(p: Payment) {
    setPayment(p);
    setNote("");
    setReceiptUrl("");
    setChecked(false);
    setError("");
  }
  const filtered = h.data.orders
    .filter(
      (o) =>
        matches(`${o.id} ${o.customer_name} ${o.status}`) &&
        (statusFilter === "all" || o.status === statusFilter),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const paymentRows = h.data.payments.filter(
    (p) =>
      matches(
        `${p.order_id} ${p.reference} ${h.data.orders.find((o) => o.id === p.order_id)?.customer_name || ""}`,
      ) &&
      (statusFilter === "all" || p.status === statusFilter),
  );
  const catalogRows = h.data.books.filter(
    (b) => b.provenance !== "demo" && matches(`${b.title} ${b.author}`),
  );
  const peopleRows = h.data.profiles.filter((p) =>
    matches(`${p.display_name} ${p.role} ${p.email || ""}`),
  );
  const auditRows = [...(h.data.events || [])]
    .reverse()
    .filter((e) => matches(`${e.action} ${e.detail} ${e.actor_id}`));
  function navigate(next: string) {
    setTab(next);
    setSearch("");
    setStatusFilter("all");
    setError("");
  }

  const table = (orders: Order[]) => (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order / customer</th>
            <th>Copies</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td data-label="Order / customer">
                <b>#{o.id.slice(0, 8).toUpperCase()}</b>
                <small>{o.customer_name}</small>
              </td>
              <td data-label="Copies">
                {o.items.reduce((n, i) => n + i.quantity, 0)}
              </td>
              <td data-label="Total">
                {money(o.book_total + o.shipping_total)}
              </td>
              <td data-label="Status">
                <Status value={o.status} />
              </td>
              <td data-label="Action">
                <button className="text-link" onClick={() => openOrder(o)}>
                  Manage order
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && (
        <p className="workspace-empty">
          No matching orders. New reservations will appear here.
        </p>
      )}
    </div>
  );
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="eyebrow">PUBLISHER WORKSPACE</span>
        <div className="workspace-name">
          <ShieldCheck />
          <div>
            <b>FIXIHUB</b>
            <small>{h.profile?.role} · preview</small>
          </div>
        </div>
        <nav aria-label="Workspace navigation">
          {tabs.map((t) => (
            <button
              key={t}
              className={tab === t ? "selected" : ""}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => navigate(t)}
            >
              {(() => {
                const Icon = tabIcons[t as keyof typeof tabIcons];
                return <Icon size={17} aria-hidden="true" />;
              })()}
              <span>{tabLabels[t]}</span>
              {t === "payments" && pending.length > 0 && (
                <span className="count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            Website preorders only.
            <br />
            1,000 copies. No reprint.
          </p>
          <a href="/account">Switch preview identity ↗</a>
        </div>
      </aside>
      <section className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">{h.profile?.display_name}</span>
            <h1>{tabLabels[tab]}</h1>
            <p>{descriptions[tab]}</p>
          </div>
          {tab === "reports" && can(h.profile, "reports") && (
            <button className="button secondary" onClick={exportReport}>
              <Download size={16} /> Export orders
            </button>
          )}
        </div>
        <div className="workspace-mode">
          <span className="workspace-dot" />
          Preview workspace <span>Device-local records · no real payments</span>
        </div>
        {["orders", "payments", "catalog", "people", "audit"].includes(tab) && (
          <div className="workspace-toolbar">
            <label>
              Search {tabLabels[tab].toLowerCase()}
              <input
                type="search"
                aria-label={`Search ${tab === "orders" ? "orders" : tabLabels[tab].toLowerCase()}`}
                placeholder={
                  tab === "orders"
                    ? "Order, customer or status"
                    : "Search this workspace"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {["orders", "payments"].includes(tab) && (
              <label>
                Status
                <select
                  aria-label="Filter workspace status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {(tab === "payments"
                    ? ["pending", "verified", "rejected"]
                    : [
                        "awaiting_payment",
                        "payment_review",
                        "confirmed",
                        "preparing",
                        "refund_requested",
                        "refunded",
                        "cancelled",
                        "expired",
                      ]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        {error && !accessChange && !order && !payment && !book && !campaign && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {(tab === "overview" || tab === "reports") && (
          <>
            <div className="stats-grid">
              {[
                [
                  String(Math.max(0, CAPACITY - (c?.reserved || 0))),
                  "Copies available",
                  "Preview inventory",
                ],
                [
                  String(c?.reserved || 0),
                  "Copies reserved",
                  "Includes unpaid and review holds",
                ],
                [
                  String(pending.length),
                  "Receipts to review",
                  "Protected from unpaid expiry",
                ],
                [
                  manager
                    ? money(collected - refunded)
                    : String(
                        h.data.orders.filter((o) => o.status === "confirmed")
                          .length,
                      ),
                  manager ? "Net verified payments" : "Confirmed preorders",
                  manager ? "Less recorded refunds" : "Awaiting publication",
                ],
              ].map(([value, label, sub], i) => (
                <div
                  key={label}
                  className={`stat-card ${i === 0 ? "accent" : ""}`}
                >
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{sub}</small>
                </div>
              ))}
            </div>
            <div className="preview-notice">
              <ClockIcon />
              <p>
                All figures are preview records. Payment destination and live
                checkout are disabled. Campaign dates, postage and reservation
                limits are provisional.
              </p>
            </div>
            {tab === "overview" && (
              <>
                <div className="workspace-actions">
                  <button onClick={() => navigate("payments")}>
                    <Receipt size={20} />
                    <span>
                      <b>{pending.length} receipts awaiting review</b>
                      <small>Check transfers and resolve corrections</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                  <button onClick={() => navigate("orders")}>
                    <ShoppingBag size={20} />
                    <span>
                      <b>
                        {
                          h.data.orders.filter(
                            (o) => o.status === "refund_requested",
                          ).length
                        }{" "}
                        refund requests
                      </b>
                      <small>Review customer requests and order progress</small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div className="panel table-panel">
                  <div className="panel-title">
                    <h2>Recent orders</h2>
                    <button
                      className="text-link"
                      onClick={() => navigate("orders")}
                    >
                      View all orders
                    </button>
                  </div>
                  {table(
                    [...h.data.orders]
                      .sort(
                        (a, b) =>
                          Date.parse(b.created_at) - Date.parse(a.created_at),
                      )
                      .slice(0, 8),
                  )}
                </div>
              </>
            )}
            {tab === "reports" && (
              <div className="panel">
                <h2>Payments and commitments</h2>
                <div className="summary-line">
                  <span>Gross approved payments</span>
                  <b>{money(collected)}</b>
                </div>
                <div className="summary-line">
                  <span>Recorded refunds</span>
                  <b>{money(refunded)}</b>
                </div>
                <div className="summary-line">
                  <span>Active order value (including unpaid)</span>
                  <b>
                    {money(
                      h.data.orders
                        .filter(holdsInventory)
                        .reduce(
                          (n, o) => n + o.book_total + o.shipping_total,
                          0,
                        ),
                    )}
                  </b>
                </div>
                <p className="fineprint">
                  An order reservation is not revenue. Refund requests remain
                  commitments until an admin records the completed refund.
                </p>
              </div>
            )}
          </>
        )}
        {tab === "orders" && (
          <div className="panel table-panel">
            <div className="panel-title">
              <h2>Website orders</h2>
            </div>
            {table(filtered)}
          </div>
        )}
        {tab === "payments" && (
          <div className="panel table-panel">
            <div className="panel-title">
              <h2>Receipt queue</h2>
              <span>{pending.length} pending</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Transfer reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...paymentRows]
                    .sort(
                      (a, b) =>
                        Number(b.status === "pending") -
                          Number(a.status === "pending") ||
                        Date.parse(b.created_at) - Date.parse(a.created_at),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td data-label="Order">
                          #{p.order_id.slice(0, 8).toUpperCase()}
                        </td>
                        <td data-label="Transfer reference">{p.reference}</td>
                        <td data-label="Amount">{money(p.amount)}</td>
                        <td data-label="Status">
                          <Status value={p.status} />
                        </td>
                        <td data-label="Action">
                          <button
                            className="text-link"
                            onClick={() => openPayment(p)}
                          >
                            {p.status === "pending"
                              ? "Review receipt"
                              : "View decision"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!paymentRows.length && (
                <p className="workspace-empty">
                  No matching receipts. Customers submit evidence from My
                  orders.
                </p>
              )}
            </div>
          </div>
        )}
        {tab === "catalog" && manager && (
          <div className="panel table-panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Availability</th>
                    <th>Visibility</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogRows.map((b) => (
                    <tr key={b.id}>
                      <td data-label="Book">
                        <div className="workspace-book">
                          <BookCover book={b} small />
                          <div>
                            <b>{b.title}</b>
                            <small>{b.author}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Availability">
                        {b.sale_mode === "preorder"
                          ? "KACAU preorder · RM30"
                          : "Catalog only"}
                      </td>
                      <td data-label="Visibility">
                        {b.active ? "Visible" : "Hidden"}
                      </td>
                      <td data-label="Action">
                        <button
                          className="text-link"
                          onClick={() => {
                            setBook({ ...b });
                            setError("");
                          }}
                        >
                          Edit book
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!catalogRows.length && (
              <p className="workspace-empty">No matching books.</p>
            )}
            <p className="fineprint padded">
              Only KACAU can be purchased. The edition price and 1,000-copy
              ceiling are fixed for this launch.
            </p>
          </div>
        )}
        {tab === "campaigns" && manager && !c && (
          <p className="workspace-empty">
            The launch campaign is unavailable. No schedule changes can be made.
          </p>
        )}
        {tab === "campaigns" && manager && c && (
          <div className="panel">
            <Status value={c.active ? "active" : "paused"} />
            <h2 className="spaced">{c.title}</h2>
            <progress
              value={c.reserved}
              max={CAPACITY}
              aria-label="Reserved copies"
            />
            <div className="summary-line">
              <span>Reserved / print run</span>
              <b>
                {c.reserved} / {CAPACITY}
              </b>
            </div>
            <p>
              Opens:{" "}
              {new Date(c.opens_at).toLocaleString("en-MY", {
                timeZone: "Asia/Kuala_Lumpur",
              })}{" "}
              MYT
            </p>
            <p>
              Closes:{" "}
              {new Date(c.closes_at).toLocaleString("en-MY", {
                timeZone: "Asia/Kuala_Lumpur",
              })}{" "}
              MYT
            </p>
            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => {
                  setCampaign({ ...c });
                  setError("");
                }}
              >
                Edit preview schedule
              </button>
              <button
                disabled={busy}
                className="button primary"
                onClick={() =>
                  act(() => h.saveCampaign({ ...c, active: !c.active }))
                }
              >
                {c.active ? <Pause size={16} /> : <Play size={16} />}
                {c.active ? "Pause new preorders" : "Resume preorders"}
              </button>
            </div>
            <p className="fineprint">
              Pausing prevents new reservations. Existing customers can still
              submit eligible receipts. Publication remains 1 November 2026.
            </p>
          </div>
        )}
        {tab === "people" && manager && (
          <div className="panel">
            <p>
              Mock identities only. Real invitations and Google login are
              deferred. Admins manage customer/staff roles; superadmins manage
              elevated roles.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {peopleRows.map((p) => {
                    const editable =
                      p.id !== h.profile?.id &&
                      (security || ["staff", "customer"].includes(p.role));
                    return (
                      <tr key={p.id}>
                        <td data-label="Account">
                          <b>{p.display_name}</b>
                          <small>
                            {p.active === false ? "Inactive" : "Active"}
                            {p.id === h.profile?.id ? " · Your account" : ""}
                          </small>
                        </td>
                        <td data-label="Role">
                          <select
                            aria-label={`Role for ${p.display_name}`}
                            disabled={!editable || busy}
                            value={p.role}
                            onChange={(e) =>
                              setAccessChange({
                                profile: p,
                                role: e.target.value as Profile["role"],
                                active: p.active !== false,
                              })
                            }
                          >
                            {(security
                              ? ["customer", "staff", "admin", "superadmin"]
                              : [
                                  "customer",
                                  "staff",
                                  ...(!["customer", "staff"].includes(p.role)
                                    ? [p.role]
                                    : []),
                                ]
                            ).map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td data-label="Access">
                          <button
                            className="text-link"
                            disabled={!editable || busy}
                            onClick={() =>
                              setAccessChange({
                                profile: p,
                                role: p.role,
                                active: p.active === false,
                              })
                            }
                          >
                            {p.active === false ? "Reactivate" : "Deactivate"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!peopleRows.length && (
              <p className="workspace-empty">No matching accounts.</p>
            )}
          </div>
        )}
        {tab === "audit" && manager && (
          <div className="panel">
            <ol className="order-timeline">
              {auditRows.map((e) => (
                <li key={e.id}>
                  <span>
                    {new Date(e.created_at).toLocaleString("en-MY", {
                      timeZone: "Asia/Kuala_Lumpur",
                    })}{" "}
                    ·{" "}
                    {h.data.profiles.find((p) => p.id === e.actor_id)
                      ?.display_name || e.actor_id}
                  </span>
                  <strong>{e.action}</strong>
                  <p>{e.detail}</p>
                </li>
              ))}
            </ol>
            {!auditRows.length && (
              <p className="workspace-empty">No matching activity.</p>
            )}
          </div>
        )}
        {tab === "security" && security && (
          <div className="panel">
            <h2>Launch controls</h2>
            <div className="summary-line">
              <span>Authentication</span>
              <b>Mock only · Google deferred</b>
            </div>
            <div className="summary-line">
              <span>Payment destination</span>
              <b>Not configured</b>
            </div>
            <div className="summary-line">
              <span>Tracking</span>
              <b>Deferred</b>
            </div>
            <div className="summary-line">
              <span>Live website checkout</span>
              <b>Disabled</b>
            </div>
            <p className="fineprint">
              A live build fails closed while the Supabase transaction model,
              RLS, real authentication, merchant QR and final policies are
              pending. No service keys or payment account secrets belong in this
              browser.
            </p>
            <h3 className="spaced">Role boundaries</h3>
            <div className="workspace-role-grid">
              <div>
                <b>Staff</b>
                <p>
                  Review receipts and manage order progress. No catalog, finance
                  exports or access management.
                </p>
              </div>
              <div>
                <b>Admin</b>
                <p>
                  Manage catalog, campaigns, refunds and customer/staff access.
                  Cannot appoint administrators.
                </p>
              </div>
              <div>
                <b>Superadmin</b>
                <p>
                  Govern elevated access and launch readiness. Own access and
                  the last superadmin remain protected.
                </p>
              </div>
            </div>
            <h3 className="spaced">Access changes</h3>
            {!(h.data.events || []).some(
              (event) => event.action === "access.updated",
            ) && <p className="workspace-empty">No access changes recorded.</p>}
            {(h.data.events || [])
              .filter((e) => e.action === "access.updated")
              .map((e) => (
                <p key={e.id}>{e.detail}</p>
              ))}
          </div>
        )}
      </section>
      {accessChange && (
        <Modal
          title="Confirm access change"
          onClose={() => !busy && setAccessChange(null)}
        >
          <p>
            <strong>{accessChange.profile.display_name}</strong>
          </p>
          <div className="summary-line">
            <span>Role</span>
            <b>
              {accessChange.profile.role} → {accessChange.role}
            </b>
          </div>
          <div className="summary-line">
            <span>Account access</span>
            <b>{accessChange.active ? "Active" : "Deactivated"}</b>
          </div>
          <p className="fineprint">
            This changes the account’s workspace permissions and records an
            audit event. Your own access and the last active superadmin are
            protected.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="button-row">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setAccessChange(null)}
            >
              Keep current access
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                act(
                  () =>
                    h.changeRole(
                      accessChange.profile.id,
                      accessChange.role,
                      accessChange.active,
                    ),
                  () => setAccessChange(null),
                )
              }
            >
              Confirm access change
            </button>
          </div>
        </Modal>
      )}
      {book && (
        <Modal
          title="Edit catalog entry"
          onClose={() => !busy && setBook(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(
                () => h.saveBook(book),
                () => setBook(null),
              );
            }}
          >
            <label>
              Title
              <input
                required
                maxLength={160}
                value={book.title}
                onChange={(e) => setBook({ ...book, title: e.target.value })}
              />
            </label>
            <label>
              Author
              <input
                required
                maxLength={100}
                value={book.author}
                onChange={(e) => setBook({ ...book, author: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                required
                maxLength={3000}
                value={book.description}
                onChange={(e) =>
                  setBook({ ...book, description: e.target.value })
                }
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={book.active}
                onChange={(e) => setBook({ ...book, active: e.target.checked })}
              />
              Visible in catalog
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={busy}>
              Save book
            </button>
          </form>
        </Modal>
      )}
      {campaign && (
        <Modal
          title="Preview campaign schedule"
          onClose={() => !busy && setCampaign(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              act(
                () => h.saveCampaign(campaign),
                () => setCampaign(null),
              );
            }}
          >
            <p>
              All inputs use Malaysia time (UTC+08:00). These are preview dates
              until the launch window is confirmed.
            </p>
            {(["opens_at", "closes_at"] as const).map((key) => (
              <label key={key}>
                {key === "opens_at"
                  ? "Opens (Malaysia time)"
                  : "Closes (Malaysia time)"}
                <input
                  type="datetime-local"
                  required
                  value={localInput(campaign[key])}
                  onChange={(e) => {
                    if (e.target.value)
                      setCampaign({
                        ...campaign,
                        [key]: new Date(
                          `${e.target.value}:00+08:00`,
                        ).toISOString(),
                      });
                  }}
                />
              </label>
            ))}
            <p>Print run: 1,000. Expected publication: 1 November 2026.</p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={busy}>
              Save schedule
            </button>
          </form>
        </Modal>
      )}
      {payment && (
        <Modal
          title="Payment verification"
          onClose={() => {
            if (!busy) {
              setPayment(null);
              setReceiptUrl("");
            }
          }}
        >
          <div className="summary-line">
            <span>Order #{payment.order_id.slice(0, 8).toUpperCase()}</span>
            <strong>{money(payment.amount)}</strong>
          </div>
          <p>Reference: {payment.reference}</p>
          <Status value={payment.status} />
          {receiptUrl ? (
            <a
              className="button secondary"
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open receipt
            </a>
          ) : (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                act(async () =>
                  setReceiptUrl(await h.receipt(payment.receipt_path)),
                )
              }
            >
              Load private receipt
            </button>
          )}
          {payment.status === "pending" &&
            h.data.orders.find((o) => o.id === payment.order_id)
              ?.customer_id === h.profile?.id && (
              <p className="form-error">
                Another staff member must review your own payment.
              </p>
            )}
          {payment.status === "pending" ? (
            <>
              <p>
                Compare the transfer against the merchant bank record. A receipt
                alone does not confirm funds.
              </p>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                I checked the payee, amount and reference against the bank
                record (simulated in preview).
              </label>
              <label>
                Decision note / rejection reason
                <textarea
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="button-row">
                <button
                  disabled={
                    busy ||
                    note.trim().length < 3 ||
                    h.data.orders.find((o) => o.id === payment.order_id)
                      ?.customer_id === h.profile?.id
                  }
                  className="button secondary"
                  onClick={() =>
                    act(
                      () => h.review(payment.id, false, note),
                      () => {
                        setPayment(null);
                        setReceiptUrl("");
                      },
                    )
                  }
                >
                  <X size={16} />
                  Reject receipt
                </button>
                <button
                  disabled={
                    busy ||
                    !checked ||
                    !receiptUrl ||
                    note.trim().length < 3 ||
                    h.data.orders.find((o) => o.id === payment.order_id)
                      ?.customer_id === h.profile?.id
                  }
                  className="button primary"
                  onClick={() =>
                    act(
                      () => h.review(payment.id, true, note),
                      () => {
                        setPayment(null);
                        setReceiptUrl("");
                      },
                    )
                  }
                >
                  <Check size={16} />
                  Approve payment
                </button>
              </div>
            </>
          ) : (
            <p>{payment.note}</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
      {order && (
        <Modal
          title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
          onClose={() => !busy && setOrder(null)}
        >
          <Status value={order.status} />
          <h3 className="spaced">{order.customer_name}</h3>
          <p>
            {order.address}
            <br />
            {order.phone} · {order.email}
          </p>
          {order.items.map((i) => (
            <p key={i.book_id}>
              {i.quantity} × {i.title}
            </p>
          ))}
          <p>Total: {money(order.book_total + order.shipping_total)}</p>
          <label>
            Update reason / refund transaction reference
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </label>
          <div className="button-row">
            {order.status === "awaiting_payment" && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  act(
                    () => h.transition(order.id, "cancel", note),
                    () => setOrder(null),
                  )
                }
              >
                Cancel unpaid order
              </button>
            )}
            {order.status === "confirmed" && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  act(
                    () => h.transition(order.id, "prepare", note),
                    () => setOrder(null),
                  )
                }
              >
                Mark as preparing
              </button>
            )}
            {["confirmed", "preparing"].includes(order.status) && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  act(
                    () => h.transition(order.id, "request_refund", note),
                    () => setOrder(null),
                  )
                }
              >
                Request refund review
              </button>
            )}
            {order.status === "refund_requested" && manager && (
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  act(
                    () => h.transition(order.id, "refund", note),
                    () => setOrder(null),
                  )
                }
              >
                Record completed refund
              </button>
            )}
          </div>
          {order.status === "refund_requested" && (
            <p className="fineprint">
              Only record completion after the manual refund has been sent.
              Include its reference. This preview does not transfer funds.
            </p>
          )}
          <p className="fineprint">
            Preparation is blocked before expected publication. Tracking is
            deferred.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
function ClockIcon() {
  return <ShieldCheck size={20} />;
}
