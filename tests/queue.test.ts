import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceQueue, CHECKOUT_MS, type QueueTicket } from "../lib/queue";

test("queue admits at most fifty and promotes waiting tickets FIFO", () => {
  const waiting: QueueTicket[] = Array.from({ length: 53 }, (_, i) => ({
    id: `person-${i}`,
    joined: i,
    state: "waiting",
  }));
  const initial = advanceQueue(waiting, 100);
  assert.equal(initial.filter((t) => t.state === "active").length, 50);
  assert.equal(initial[50].state, "waiting");
  initial[3].state = "complete";
  const next = advanceQueue(initial, 200);
  assert.equal(next[50].state, "active");
  assert.equal(next[51].state, "waiting");
  assert.equal(next[0].expires, 100 + CHECKOUT_MS);
  assert.equal(next[50].expires, 200 + CHECKOUT_MS);
});
test("expiry releases slots without restarting an expired timer", () => {
  const initial: QueueTicket[] = [
    { id: "old", joined: 1, state: "active", expires: 20 },
    { id: "next", joined: 2, state: "waiting" },
  ];
  const next = advanceQueue(initial, 21);
  assert.equal(next[0].state, "expired");
  assert.equal(next[1].state, "active");
  assert.equal(advanceQueue(next, 22)[0].state, "expired");
});
