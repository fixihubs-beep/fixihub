export const QUEUE_LIMIT = 50;
export const CHECKOUT_MS = 5 * 60 * 1000;
export const QUEUE_KEY = "fixihub-preview-queue-v1";
export type QueueTicket = {
  id: string;
  joined: number;
  state: "waiting" | "active" | "expired" | "complete";
  expires?: number;
};
export function advanceQueue(
  tickets: QueueTicket[],
  now: number,
): QueueTicket[] {
  const next = tickets.map((t) =>
    t.state === "active" && (t.expires || 0) <= now
      ? { ...t, state: "expired" as const }
      : { ...t },
  );
  let slots = QUEUE_LIMIT - next.filter((t) => t.state === "active").length;
  for (const ticket of next
    .filter((t) => t.state === "waiting")
    .sort((a, b) => a.joined - b.joined || a.id.localeCompare(b.id))) {
    if (slots <= 0) break;
    ticket.state = "active";
    ticket.expires = now + CHECKOUT_MS;
    slots--;
  }
  return next;
}
export async function queueAction(
  id: string,
  action: "read" | "join" | "finish" | "leave" = "read",
) {
  if (!navigator.locks)
    throw Error(
      "This browser cannot run the queue preview. Please use a current browser.",
    );
  return navigator.locks.request(QUEUE_KEY, () => {
    const now = Date.now();
    let tickets = advanceQueue(
      JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as QueueTicket[],
      now,
    );
    const old = tickets.find((ticket) => ticket.id === id);
    if (
      action === "join" &&
      (!old || ["expired", "complete"].includes(old.state))
    ) {
      tickets = tickets.filter((ticket) => ticket.id !== id);
      tickets.push({ id, joined: now, state: "waiting" });
    }
    if (action === "finish" || action === "leave") {
      tickets = tickets.map((t) =>
        t.id === id ? { ...t, state: "complete" as const } : t,
      );
    }
    tickets = advanceQueue(tickets, now);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(tickets));
    const ticket = tickets.find((t) => t.id === id) || null;
    const waiting = tickets
      .filter((t) => t.state === "waiting")
      .sort((a, b) => a.joined - b.joined || a.id.localeCompare(b.id));
    return {
      ticket,
      ahead:
        ticket?.state === "waiting" ? waiting.findIndex((t) => t.id === id) : 0,
    };
  });
}
export async function requireQueueSlot(id: string) {
  const { ticket } = await queueAction(id);
  if (
    ticket?.state !== "active" ||
    !ticket.expires ||
    ticket.expires <= Date.now()
  )
    throw Error(
      "Your checkout slot is not active. Open the waiting room to join again.",
    );
  return ticket;
}
