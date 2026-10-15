import type { Data, Order, Profile } from "./types";
export const KACAU_ID = "00000000-0000-4000-8000-000000000009";
export const CAPACITY = 1000;
export const COPY_LIMIT = 2;
export const HOLD_MS = 24 * 60 * 60 * 1000;
export const FILM_DATE = "2026-11-12T00:00:00+08:00";
export type Permission =
  "review" | "catalog" | "reports" | "staff" | "security";
export function can(profile: Profile | null, permission: Permission) {
  if (!profile || profile.active === false) return false;
  const roles = {
    review: ["staff", "admin", "superadmin"],
    catalog: ["admin", "superadmin"],
    reports: ["admin", "superadmin"],
    staff: ["admin", "superadmin"],
    security: ["superadmin"],
  };
  return roles[permission].includes(profile.role);
}
export function requirePermission(
  profile: Profile | null,
  permission: Permission,
) {
  if (!can(profile, permission))
    throw Error("You do not have permission for this action.");
}
export function holdsInventory(order: Order) {
  return !["cancelled", "expired", "refunded"].includes(order.status);
}
export function syncReservations(data: Data): Data {
  return {
    ...data,
    campaigns: data.campaigns.map((c) => ({
      ...c,
      reserved: data.orders
        .filter(holdsInventory)
        .flatMap((o) => o.items)
        .filter((i) => i.campaign_id === c.id)
        .reduce((sum, i) => sum + i.quantity, 0),
    })),
  };
}
export function expireOrders(data: Data, now = Date.now()): Data {
  let changed = false;
  const events = [...(data.events || [])];
  const orders = data.orders.map((o) => {
    if (
      o.status !== "awaiting_payment" ||
      !o.expires_at ||
      Date.parse(o.expires_at) > now ||
      data.payments.some((p) => p.order_id === o.id && p.status !== "rejected")
    )
      return o;
    changed = true;
    events.push({
      id: crypto.randomUUID(),
      actor_id: "system",
      order_id: o.id,
      action: "order.expired",
      detail: "Unpaid reservation expired; copies released.",
      created_at: new Date(now).toISOString(),
    });
    return { ...o, status: "expired" as const };
  });
  return changed ? syncReservations({ ...data, orders, events }) : data;
}
export function assertReview(data: Data, profile: Profile | null, id: string) {
  requirePermission(profile, "review");
  const payment = data.payments.find((p) => p.id === id);
  const order = data.orders.find((o) => o.id === payment?.order_id);
  if (
    !payment ||
    payment.status !== "pending" ||
    !order ||
    order.status !== "payment_review"
  )
    throw Error("This receipt is no longer awaiting review.");
  if (order.customer_id === profile!.id)
    throw Error("You cannot review your own payment.");
  return { payment, order };
}
export function assertRoleChange(
  actor: Profile | null,
  target: Profile,
  role: Profile["role"],
  active: boolean,
  profiles: Profile[],
) {
  requirePermission(actor, "staff");
  if (!["customer", "staff", "admin", "superadmin"].includes(role))
    throw Error("Choose a valid account role.");
  if (
    actor?.role !== "superadmin" &&
    (!["customer", "staff"].includes(target.role) ||
      !["customer", "staff"].includes(role))
  )
    throw Error("Only a superadmin can manage administrator roles.");
  if (
    target.role === "superadmin" &&
    (role !== "superadmin" || !active) &&
    profiles.filter((p) => p.role === "superadmin" && p.active !== false)
      .length <= 1
  )
    throw Error("Keep at least one active superadmin.");
  if (actor?.id === target.id && (role !== target.role || !active))
    throw Error("Ask another authorized administrator to change your access.");
}
