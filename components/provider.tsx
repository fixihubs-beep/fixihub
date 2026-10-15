"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { initialData } from "@/lib/seed";
import { withBookCover } from "@/lib/covers";
import { requireQueueSlot, queueAction } from "@/lib/queue";
import { quote, receiptValid } from "@/lib/rules";
import {
  assertReview,
  assertRoleChange,
  can,
  CAPACITY,
  COPY_LIMIT,
  expireOrders,
  HOLD_MS,
  holdsInventory,
  KACAU_ID,
  requirePermission,
  syncReservations,
} from "@/lib/preorder";
import type {
  Book,
  Campaign,
  CartItem,
  Data,
  Order,
  Profile,
  SavedDelivery,
} from "@/lib/types";
const KEY = "fixihub-website-preview-v2";
const SESSION = "fixihub-preview-identity";
const CART = "fixihub-preview-cart-v2";
const mock =
  process.env.NEXT_PUBLIC_APP_MODE === "mock" ||
  (process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_APP_MODE !== "live");
async function blobs(path: string, file?: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fixihub-preview-receipts-v2", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("receipts");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("receipts", file ? "readwrite" : "readonly");
      const operation = file
        ? tx.objectStore("receipts").put(file, path)
        : tx.objectStore("receipts").get(path);
      let result: Blob;
      operation.onsuccess = () => {
        result = file || operation.result;
      };
      tx.oncomplete = () => {
        db.close();
        result
          ? resolve(result)
          : reject(Error("Receipt not found on this device."));
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(Error("Receipt storage interrupted."));
      };
    };
  });
}
type Hub = {
  data: Data;
  profile: Profile | null;
  demo: boolean;
  ready: boolean;
  error: string;
  toast: string;
  cart: CartItem[];
  notify: (message: string) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  add: (book: Book, campaign?: Campaign) => void;
  placeOrder: (
    address: string,
    key: string,
    phone?: string,
    email?: string,
  ) => Promise<string>;
  upload: (
    order: string,
    kind: "book" | "shipping",
    file: File,
    reference?: string,
  ) => Promise<void>;
  receipt: (path: string) => Promise<string>;
  review: (id: string, approve: boolean, note: string) => Promise<void>;
  transition: (
    id: string,
    action: "cancel" | "prepare" | "request_refund" | "refund",
    note: string,
  ) => Promise<void>;
  saveBook: (book: Book) => Promise<void>;
  saveCampaign: (campaign: Campaign) => Promise<void>;
  changeRole: (
    id: string,
    role: Profile["role"],
    active: boolean,
  ) => Promise<void>;
  selectIdentity: (id: string) => void;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  saveDelivery: (delivery: SavedDelivery | undefined) => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<Hub | null>(null);
export function useHub() {
  const hub = useContext(Context);
  if (!hub) throw Error("Missing provider");
  return hub;
}
export function Provider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = useState<Data>(initialData),
    current = useRef<Data>(initialData);
  const [identity, setIdentity] = useState(""),
    identityRef = useRef("");
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [toast, notify] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const profile =
    raw.profiles.find((p) => p.id === identity && p.active !== false) || null;
  function actor() {
    return (
      current.current.profiles.find(
        (p) => p.id === identityRef.current && p.active !== false,
      ) || null
    );
  }
  function ensureMock() {
    if (!mock)
      throw Error(
        "Website checkout is not live yet. Real authentication and payment setup are pending.",
      );
  }
  function commit(data: Data) {
    current.current = data;
    setRaw(data);
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      setError(
        "Device storage is full. Keep this page open; preview changes could not be saved.",
      );
    }
  }
  function mutate(fn: (data: Data) => Data) {
    ensureMock();
    commit(fn(expireOrders(current.current)));
  }
  function event(
    data: Data,
    action: string,
    detail: string,
    order_id?: string,
  ): Data {
    return {
      ...data,
      events: [
        ...(data.events || []),
        {
          id: crypto.randomUUID(),
          actor_id: actor()?.id || "system",
          action,
          detail,
          order_id,
          created_at: new Date().toISOString(),
        },
      ],
    };
  }
  useEffect(() => {
    if (mock) {
      try {
        const saved = localStorage.getItem(KEY);
        const data = saved
          ? expireOrders(JSON.parse(saved))
          : structuredClone(initialData);
        data.books = data.books.map(withBookCover);
        data.profiles = data.profiles.map((profile: Profile) => ({
          ...profile,
          email:
            profile.email ??
            initialData.profiles.find((seed) => seed.id === profile.id)?.email,
        }));
        current.current = data;
        setRaw(data);
        const id = sessionStorage.getItem(SESSION) || "";
        identityRef.current = id;
        setIdentity(id);
        setCart(JSON.parse(sessionStorage.getItem(CART) || "[]"));
      } catch {
        setError(
          "Saved preview data could not be read. This preview uses device-local storage.",
        );
      }
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && mock) sessionStorage.setItem(CART, JSON.stringify(cart));
  }, [cart, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => notify(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!mock || !ready) return;
    const timer = setInterval(() => {
      const next = expireOrders(current.current);
      if (next !== current.current) commit(next);
    }, 15000);
    return () => clearInterval(timer);
  }, [ready]);
  async function refresh() {
    if (mock) commit(expireOrders(current.current));
  }
  function selectIdentity(id: string) {
    ensureMock();
    if (
      id &&
      !current.current.profiles.some((p) => p.id === id && p.active !== false)
    )
      throw Error("This preview account is inactive.");
    if (identityRef.current && identityRef.current !== id) setCart([]);
    identityRef.current = id;
    setIdentity(id);
    sessionStorage.setItem(SESSION, id);
    notify(
      id
        ? "Preview account selected. No real login or payment."
        : "Browsing as a guest.",
    );
  }
  async function logout() {
    selectIdentity("");
    setCart([]);
  }
  function add(book: Book, campaign?: Campaign) {
    try {
      ensureMock();
      const next = cart.some((i) => i.book_id === book.id)
        ? cart.map((i) =>
            i.book_id === book.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [
            ...cart,
            { book_id: book.id, quantity: 1, campaign_id: campaign?.id },
          ];
      const data = expireOrders(current.current);
      quote(next, data.books, data.campaigns);
      setCart(next);
      notify("KACAU added to your bag.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function placeOrder(
    address: string,
    key: string,
    phone = "",
    email = "",
  ) {
    ensureMock();
    const user = actor();
    if (!user) throw Error("Choose a preview customer before checkout.");
    const existing = current.current.orders.find(
      (o) => o.customer_id === user.id && o.request_id === key,
    );
    if (existing) {
      setCart([]);
      return existing.id;
    }
    if (address.trim().length < 12 || address.length > 1000)
      throw Error("Enter a complete delivery address.");
    if (phone.replace(/\D/g, "").length < 9 || phone.length > 25)
      throw Error("Enter a valid contact number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
      throw Error("Enter a valid contact email.");
    const slot = await requireQueueSlot(user.id);
    if (actor()?.id !== user.id)
      throw Error("Your account changed. Please try again.");
    const id = crypto.randomUUID();
    mutate((data) => {
      const q = quote(cart, data.books, data.campaigns);
      const existingCopies = data.orders
        .filter((o) => o.customer_id === user.id && holdsInventory(o))
        .flatMap((o) => o.items)
        .filter((i) => i.book_id === KACAU_ID)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (
        existingCopies + q.items.reduce((sum, i) => sum + i.quantity, 0) >
        COPY_LIMIT
      )
        throw Error(
          "The preview limit is two copies per customer across active orders.",
        );
      const order: Order = {
        id,
        request_id: key,
        customer_id: user.id,
        customer_name: user.display_name,
        created_at: new Date().toISOString(),
        expires_at: new Date(slot.expires!).toISOString(),
        status: "awaiting_payment",
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        tracking_number: null,
        ...q,
      };
      return event(
        syncReservations({ ...data, orders: [order, ...data.orders] }),
        "order.created",
        "Copies reserved until the five-minute checkout deadline. Awaiting payment receipt.",
        id,
      );
    });
    setCart([]);
    notify("Preview preorder reserved. Submit one receipt for the total.");
    return id;
  }
  async function releaseCheckoutIfFinished(customerId: string) {
    try {
      const { ticket } = await queueAction(customerId);
      if (ticket?.state !== "active") return;
      const outstanding = current.current.orders.some(
        (o) =>
          o.customer_id === customerId &&
          o.status === "awaiting_payment" &&
          Date.parse(o.expires_at || "") === ticket.expires,
      );
      if (!outstanding) await queueAction(customerId, "finish");
    } catch {
      // A saved order/receipt must not be reported as failed if queue storage is unavailable.
      // The absolute lease deadline still releases the slot.
    }
  }
  async function upload(
    id: string,
    kind: "book" | "shipping",
    file: File,
    reference = "",
  ) {
    ensureMock();
    receiptValid(file);
    const user = actor();
    if (!user) throw Error("Sign in first.");
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const signature =
      file.type === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10]
        : file.type === "image/jpeg"
          ? [255, 216, 255]
          : [37, 80, 68, 70, 45];
    if (!signature.every((byte, index) => bytes[index] === byte))
      throw Error(
        "The file content does not match its declared image/PDF type.",
      );
    if (kind !== "book")
      throw Error("Use one receipt for books and preview postage together.");
    if (reference.trim().length < 3 || reference.length > 120)
      throw Error("Enter a transfer reference (3–120 characters).");
    const capturedUser = user.id;
    const path = `${user.id}/${id}/${crypto.randomUUID()}`;
    function validate(data: Data) {
      const order = data.orders.find(
        (o) => o.id === id && o.customer_id === capturedUser,
      );
      if (
        actor()?.id !== capturedUser ||
        !order ||
        order.status !== "awaiting_payment"
      )
        throw Error(
          "This order is not eligible for a receipt. Refresh its status.",
        );
      if (
        data.payments.some((p) => p.order_id === id && p.status !== "rejected")
      )
        throw Error("A receipt is already pending or approved.");
      if (
        data.payments.some(
          (p) =>
            p.reference?.trim().toLowerCase() ===
              reference.trim().toLowerCase() && p.status !== "rejected",
        )
      )
        throw Error("This transfer reference has already been submitted.");
      return order;
    }
    validate(expireOrders(current.current));
    await blobs(path, file);
    mutate((data) => {
      const order = validate(data);
      return event(
        {
          ...data,
          orders: data.orders.map((o) =>
            o.id === id ? { ...o, status: "payment_review" } : o,
          ),
          payments: [
            ...data.payments,
            {
              id: crypto.randomUUID(),
              order_id: id,
              kind: "book",
              amount: order.book_total + order.shipping_total,
              status: "pending",
              receipt_path: path,
              reference: reference.trim(),
              note: "",
              created_at: new Date().toISOString(),
            },
          ],
        },
        "payment.submitted",
        "Receipt submitted. Your copies remain reserved during review.",
        id,
      );
    });
    notify("Receipt submitted for review.");
    await releaseCheckoutIfFinished(capturedUser);
  }
  async function receipt(path: string) {
    ensureMock();
    const user = actor();
    const payment = current.current.payments.find(
      (p) => p.receipt_path === path,
    );
    const order = current.current.orders.find(
      (o) => o.id === payment?.order_id,
    );
    if (
      !user ||
      !order ||
      (order.customer_id !== user.id && !can(user, "review"))
    )
      throw Error("Receipt access denied.");
    return URL.createObjectURL(await blobs(path));
  }
  async function review(id: string, approve: boolean, note: string) {
    if (note.trim().length < 3)
      throw Error(
        approve
          ? "Record how the bank transfer was checked."
          : "Give the customer a correction reason.",
      );
    mutate((data) => {
      const { order } = assertReview(data, actor(), id);
      const now = new Date().toISOString();
      return event(
        {
          ...data,
          payments: data.payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: approve ? "verified" : "rejected",
                  note: note.trim().slice(0, 500),
                  reviewed_by: actor()!.id,
                  reviewed_at: now,
                }
              : p,
          ),
          orders: data.orders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: approve ? "confirmed" : "awaiting_payment",
                  expires_at: approve
                    ? undefined
                    : new Date(Date.now() + HOLD_MS).toISOString(),
                }
              : o,
          ),
        },
        approve ? "payment.approved" : "payment.rejected",
        approve
          ? "Payment approved. Your preorder is confirmed; awaiting publication."
          : `Receipt rejected: ${note.trim().slice(0, 500)}. Please resubmit within 24 hours.`,
        order.id,
      );
    });
    notify(
      approve
        ? "Payment approved. Preorder confirmed."
        : "Receipt rejected with correction instructions.",
    );
  }
  async function transition(
    id: string,
    action: "cancel" | "prepare" | "request_refund" | "refund",
    note: string,
  ) {
    mutate((data) => {
      const user = actor(),
        order = data.orders.find((o) => o.id === id);
      if (!user || !order) throw Error("Order unavailable.");
      if (note.trim().length < 3) throw Error("Provide a reason or reference.");
      let status: Order["status"];
      if (action === "cancel") {
        if (order.customer_id !== user.id) requirePermission(user, "review");
        if (
          order.status !== "awaiting_payment" ||
          data.payments.some(
            (p) => p.order_id === id && p.status !== "rejected",
          )
        )
          throw Error(
            "Only an unpaid order without a pending receipt can be cancelled.",
          );
        status = "cancelled";
      } else if (action === "prepare") {
        requirePermission(user, "review");
        if (order.status !== "confirmed")
          throw Error("Only confirmed preorders can be prepared.");
        if (
          order.items.some(
            (i) =>
              i.campaign_id &&
              Date.parse(
                data.campaigns.find((c) => c.id === i.campaign_id)!.release_at,
              ) > Date.now(),
          )
        )
          throw Error(
            "Expected publication date has not arrived. Keep this preorder confirmed.",
          );
        status = "preparing";
      } else if (action === "request_refund") {
        if (order.customer_id !== user.id) requirePermission(user, "review");
        if (!["confirmed", "preparing"].includes(order.status))
          throw Error("A refund request needs a paid, unshipped order.");
        status = "refund_requested";
      } else {
        requirePermission(user, "catalog");
        if (order.status !== "refund_requested")
          throw Error("A refund request is required first.");
        status = "refunded";
      }
      return event(
        syncReservations({
          ...data,
          orders: data.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }),
        `order.${status}`,
        `${status.replaceAll("_", " ")}: ${note.trim().slice(0, 500)}`,
        id,
      );
    });
    notify("Order updated.");
    const updated = current.current.orders.find((o) => o.id === id);
    if (updated && action === "cancel")
      await releaseCheckoutIfFinished(updated.customer_id);
  }
  async function saveBook(book: Book) {
    mutate((data) => {
      requirePermission(actor(), "catalog");
      const old = data.books.find((b) => b.id === book.id);
      if (!old)
        throw Error("This launch supports editing existing catalog entries.");
      if (book.id === KACAU_ID && !book.active)
        throw Error(
          "Keep the featured edition visible. Pause new preorders from Campaigns instead.",
        );
      if (!book.title.trim() || !book.author.trim() || !book.description.trim())
        throw Error("Title, author and description are required.");
      // Edition, price and purchase eligibility are fixed for this launch.
      return event(
        {
          ...data,
          books: data.books.map((b) =>
            b.id === book.id
              ? {
                  ...old,
                  title: book.title.trim(),
                  author: book.author.trim(),
                  description: book.description.trim(),
                  active: book.active,
                }
              : b,
          ),
        },
        "catalog.updated",
        `Updated ${old.title}.`,
      );
    });
    notify("Catalog saved.");
  }
  async function saveCampaign(c: Campaign) {
    mutate((data) => {
      requirePermission(actor(), "catalog");
      const old = data.campaigns.find((x) => x.id === c.id);
      if (!old) throw Error("Only the KACAU launch campaign is available.");
      if (!(
        Date.parse(c.opens_at) < Date.parse(c.closes_at) &&
        Date.parse(c.closes_at) <= Date.parse(old.release_at)
      ))
        throw Error(
          "Opening must precede closing, and closing must not follow publication.",
        );
      if (c.capacity !== CAPACITY || c.book_id !== KACAU_ID)
        throw Error("This edition is limited to exactly 1,000 copies.");
      return event(
        {
          ...data,
          campaigns: data.campaigns.map((x) =>
            x.id === c.id
              ? {
                  ...old,
                  opens_at: c.opens_at,
                  closes_at: c.closes_at,
                  active: c.active,
                }
              : x,
          ),
        },
        "campaign.updated",
        c.active
          ? "Preorder campaign schedule updated."
          : "New preorders paused.",
      );
    });
    notify("Campaign saved.");
  }
  async function changeRole(
    id: string,
    role: Profile["role"],
    active: boolean,
  ) {
    mutate((data) => {
      const target = data.profiles.find((p) => p.id === id);
      if (!target) throw Error("Account not found.");
      assertRoleChange(actor(), target, role, active, data.profiles);
      return event(
        {
          ...data,
          profiles: data.profiles.map((p) =>
            p.id === id ? { ...p, role, active } : p,
          ),
        },
        "access.updated",
        `${target.display_name}: ${role}, ${active ? "active" : "inactive"}.`,
      );
    });
    notify("Preview account access updated.");
  }
  async function saveDelivery(delivery: SavedDelivery | undefined) {
    if (delivery && Object.values(delivery).some((value) => typeof value !== "string" || value.length > 200))
      throw Error("Check your delivery details.");
    mutate((data) => {
      const user = actor();
      if (!user) throw Error("Sign in first.");
      return { ...data, profiles: data.profiles.map((p) => p.id === user.id ? { ...p, delivery } : p) };
    });
    notify(delivery ? "Delivery details saved." : "Saved address removed.");
  }
  async function updateName(name: string) {
    if (!name.trim() || name.length > 100)
      throw Error("Enter a name of 1–100 characters.");
    mutate((data) => {
      if (!actor()) throw Error("Sign in first.");
      return {
        ...data,
        profiles: data.profiles.map((p) =>
          p.id === actor()!.id ? { ...p, display_name: name.trim() } : p,
        ),
      };
    });
    notify("Profile saved.");
  }
  const operations = can(profile, "review");
  const visibleOrders = raw.orders.filter(
    (o) => operations || o.customer_id === profile?.id,
  );
  const ids = new Set(visibleOrders.map((o) => o.id));
  const data: Data = {
    ...raw,
    orders: visibleOrders,
    payments: raw.payments.filter((p) => ids.has(p.order_id)),
    profiles: raw.profiles.filter(
      (p) =>
        can(profile, "staff") ||
        p.id === profile?.id ||
        (operations && visibleOrders.some((o) => o.customer_id === p.id)),
    ),
    events: (raw.events || []).filter((e) =>
      e.action === "access.updated"
        ? can(profile, "security")
        : can(profile, "catalog") || (e.order_id && ids.has(e.order_id)),
    ),
    entitlements: [],
    access: [],
  };
  return (
    <Context.Provider
      value={{
        data,
        profile,
        demo: mock,
        ready,
        error,
        toast,
        cart,
        notify,
        setCart,
        add,
        placeOrder,
        upload,
        receipt,
        review,
        transition,
        saveBook,
        saveCampaign,
        changeRole,
        selectIdentity,
        logout,
        updateName,
        saveDelivery,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
