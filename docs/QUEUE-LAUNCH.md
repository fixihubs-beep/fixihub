# Queue implementation and launch boundary

Target project: https://mldyclivbutxeexxwsoz.supabase.co

## Implemented preview

- Explicit entry from checkout, 50 active accounts, FIFO admission, waiting count, and automatic navigation when a slot opens.
- Five minutes from admission through initial receipt submission. Navigating and refreshing preserve the absolute deadline. One ticket per preview identity; browser Web Locks serialize queue updates across tabs.
- A floating panel follows customers to other pages and links back to checkout or receipt upload. Expired turns need explicit rejoining at the back.
- New unpaid orders inherit the checkout deadline instead of the former 24-hour initial hold. Staff review is outside the timer. Receipt corrections retain their separate 24-hour correction period.
- Receipt submission releases the checkout slot. A place in the queue does not reserve stock; order creation still checks capacity and the copy limit.
- Existing historical preview orders keep their stored deadlines. The local preview is not a cross-device inventory/queue authority. Anonymous users must choose an account first.

## SQL provided

`supabase/production/queue-foundation.sql` is an additive queue foundation, not the legacy migration or a full commerce backend. It creates a private schema with RLS enabled and no direct browser table access. Authenticated RPCs expose only the caller's ticket and an aggregate position. A control-row lock serializes admissions; server timestamps define five-minute leases. Refresh does not extend an active lease. Waiting clients must poll to maintain a two-minute heartbeat. Leases include a random identifier so stale requests cannot use a later turn.

The queue starts **disabled**. This file has not been applied to the remote project. Public URL/key settings are stored locally; app mode remains mock. Read-only endpoint checks returned PGRST205 for profiles, orders and books; no existing exposed commerce schema was found.

## Required integration before real launch

1. Apply and test the new commerce schema, roles/RLS and private receipt storage, plus the queue foundation. Do not use the legacy prototype schema to launch this flow.
2. Provide authenticated customer sessions. Google OAuth remains deferred until explicitly enabled. Mock identities must never be accepted by live RPCs.
3. The create-order transaction must call `fixihub_queue.require_lease(auth.uid(), supplied_lease_id)` before checking inventory, persist its lease/deadline, and use idempotency. Do not trust client queue state or allow direct inserts.
4. Receipt finalization must lock and verify the same lease/deadline, securely validate the uploaded object, persist payment review and call `fixihub_queue.complete` in the same transaction. Release only when all initial obligations for that lease are resolved. Staff review must not consume a slot.
5. Queue expiration and order-stock release must be coordinated in server transactions plus a scheduled expiry job. Keep one lock order everywhere: queue control, then inventory/order rows. Active cancellation must release its lease atomically with the order cancellation.
6. Use the authenticated status RPC every ~10 seconds with jitter and retry/backoff. Use server-time offset for the display countdown; on failed status reads show reconnecting, do not invent a queue position or extend time. Disconnected waiters rejoin at the back after the heartbeat timeout.
7. Build bank-transfer recovery for money sent at/after timeout. Never ask those customers to pay twice or silently discard evidence. The current preview has no payable QR.
8. After staging concurrency/RLS/idempotency tests and end-to-end live-auth checks, enable the control row and switch the adapter. Neither SQL installation alone nor a client environment flag makes this live-ready.

Queue places are not stock promises. On sellout or campaign pause, server admission should stop and the waiting UI must explain availability. Add rate limiting/bot controls, telemetry, alerts and an operational pause switch before public traffic.

## Verification

Local queue admission/expiry unit tests and browser tests cover the 50-slot boundary, FIFO movement, navigation, refresh, expiry, rejoin and existing receipt-review flow. SQL foundation is tested separately against local PostgreSQL-compatible execution; real project deployment and concurrent database integration remain outstanding.
