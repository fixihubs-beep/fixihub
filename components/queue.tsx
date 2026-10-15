"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { liveCall } from "@/lib/live";
import { useHub } from "./provider";
import { queueAction, type QueueTicket } from "@/lib/queue";
import { Clock, Users } from "lucide-react";

type QueueState = {
  ticket: QueueTicket | null;
  ahead: number;
  now: number;
  ready: boolean;
  error: string;
  join: () => Promise<void>;
  leave: () => Promise<void>;
};
const Context = createContext<QueueState | null>(null);
export const useQueue = () => useContext(Context)!;
const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export function QueueProvider({ children }: { children: React.ReactNode }) {
  const h = useHub();
  const path = usePathname();
  const router = useRouter();
  const id = h.profile?.id;
  const [state, setState] = useState<{
    owner?: string;
    ticket: QueueTicket | null;
    ahead: number;
  }>({ ticket: null, ahead: 0 });
  const [now, setNow] = useState(Date.now());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const offset = useRef(0);
  const call = async (userId: string, action: "read" | "join" | "leave" = "read") => {
    if (h.demo) return queueAction(userId, action);
    const result = await liveCall<{ ticket: QueueTicket | null; ahead: number; server_now: number }>("queue." + action);
    offset.current = result.server_now - Date.now();
    return result;
  };
  const ticket = state.owner === id ? state.ticket : null;
  useEffect(() => {
    let alive = true;
    setReady(false);
    setError("");
    async function sync() {
      if (!id || (!h.demo && !h.backendReady)) {
        if (alive) {
          setState({ ticket: null, ahead: 0 });
          setReady(true);
        }
        return;
      }
      try {
        const result = await call(id);
        if (alive) {
          setState({ ...result, owner: id });
          setReady(true);
          setError("");
          setNow(Date.now() + offset.current);
        }
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          setReady(true);
        }
      }
    }
    void sync();
    const interval = setInterval(sync, h.demo ? 1000 : 10000 + Math.floor(Math.random() * 2000));
    const clock = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => {
      alive = false;
      clearInterval(interval);
      clearInterval(clock);
    };
  }, [id, h.demo, h.backendReady]);
  async function join() {
    if (!id || (!h.demo && !h.backendReady)) return;
    try {
      setError("");
      const result = await call(id, "join");
      setState({ ...result, owner: id });
      setNow(Date.now() + offset.current);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function leave() {
    if (!id) return;
    try {
      const result = await call(id, "leave");
      setState({ ...result, owner: id });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const unpaid = h.data.orders.some(
    (o) => o.customer_id === id && o.status === "awaiting_payment",
  );
  useEffect(() => {
    if (path === "/queue" && ticket?.state === "active")
      router.replace(unpaid ? "/orders" : "/cart");
  }, [path, ticket?.state, unpaid, router]);
  const seconds = Math.max(0, Math.ceil(((ticket?.expires || 0) - now) / 1000));
  return (
    <Context.Provider
      value={{ ticket, ahead: state.ahead, now, ready, error, join, leave }}
    >
      {children}
      {ticket &&
        ["waiting", "active", "expired"].includes(ticket.state) &&
        path !== "/queue" && !(path === "/cart" && ticket.state !== "active") && (
          <aside
            className="queue-floating"
            aria-label="Your preorder queue status"
          >
            {ticket.state === "active" ? (
              <Clock size={20} />
            ) : (
              <Users size={20} />
            )}
            <div>
              <strong>
                {ticket.state === "active"
                  ? `${duration(seconds)} left to finish`
                  : ticket.state === "expired"
                    ? "Your checkout time has ended"
                    : `${state.ahead} ${state.ahead === 1 ? "person" : "people"} ahead`}
              </strong>
              <p>
                {ticket.state === "active"
                  ? "Your checkout timer is still running."
                  : ticket.state === "expired"
                    ? "Rejoin the queue for a new turn."
                    : "Your place is saved. Keep this page open."}
              </p>
            </div>
            <Link
              href={
                ticket.state !== "active"
                  ? "/queue"
                  : unpaid
                    ? "/orders"
                    : "/cart"
              }
            >
              {ticket.state !== "active"
                ? "View queue"
                : unpaid
                  ? "Upload receipt"
                  : "Checkout"}{" "}
              →
            </Link>
          </aside>
        )}
    </Context.Provider>
  );
}
export function WaitingRoom() {
  const h = useHub();
  const q = useQueue();
  const expired = q.ticket?.state === "expired";
  return (
    <section className="queue-page">
      <img
        src="/brand/fixihublogo.jpg"
        alt="FIXIHUB"
        width={64}
        height={64}
        style={{ borderRadius: 12 }}
      />
      <span className="eyebrow">FIXIHUB / PREORDER WAITING ROOM</span>
      <h1>
        {expired
          ? "Your checkout time has ended."
          : q.ticket?.state === "waiting"
            ? "Your turn is coming."
            : "A place for your preorder."}
      </h1>
      <p>
        Up to 50 customers can check out at once. When admitted, you have five
        minutes to place your order and upload your receipt.
      </p>
      {q.ticket?.state === "waiting" && (
        <>
          <div className="queue-position">
            <strong>{q.ahead}</strong>
            <span>{q.ahead === 1 ? "person" : "people"} ahead of you</span>
          </div>
          <p className="queue-advice">
            Please keep this page open. No need to refresh—we’ll take you to
            checkout automatically. Refreshing will not move you forward or
            reset your timer.
          </p>
        </>
      )}
      {expired && (
        <p>
          Unpaid reservations expire with the timer. Your bag is kept where
          possible. If you already transferred money, do not pay again; contact
          the publisher to resolve it.
        </p>
      )}
      {q.error && (
        <p className="form-error" role="alert">
          {q.error}
        </p>
      )}
      {!h.profile ? (
        <Link className="button primary" href="/account">
          {h.demo ? "Choose a preview account" : "Sign in with Google"}
        </Link>
      ) : !h.commerceAvailable ? (
        <p>Preorders are not open yet. Please check back shortly.</p>
      ) : !q.ready ? (
        <p>Checking your place…</p>
      ) : q.ticket?.state === "waiting" ? (
        <button className="button secondary" onClick={() => void q.leave()}>
          Leave queue
        </button>
      ) : (
        <button className="button primary" onClick={() => void q.join()}>
          {expired ? "Rejoin at the back" : "Join preorder queue"}
        </button>
      )}
      <p className="fineprint">
        {h.demo ? "Preview only: this queue is shared within this browser, not across real visitors. No real payment. " : ""}A queue place does not guarantee stock.
      </p>
      <Link className="text-link" href="/catalog">
        Browse while you wait →
      </Link>
    </section>
  );
}
export function CheckoutGate({ children }: { children: React.ReactNode }) {
  const h = useHub();
  const q = useQueue();
  if (!h.commerceAvailable || !h.profile || !h.cart.length) return <>{children}</>;
  if (
    !q.ready ||
    q.ticket?.state !== "active" ||
    (q.ticket.expires || 0) <= q.now ||
    q.error
  )
    return <WaitingRoom />;
  return <>{children}</>;
}
