# KACAU website-only preorder plan

Updated 15 October 2026 (Asia/Kuala_Lumpur).

Queue update: see [QUEUE-LAUNCH.md](QUEUE-LAUNCH.md). New preview reservations now use a five-minute checkout window with 50 active queue slots; the earlier 24-hour initial hold below is superseded. Receipt-correction windows remain separate. The queue SQL foundation is not yet applied or connected to live commerce.
 The latest user instruction supersedes the previous WhatsApp transition plan: **all 1,000 copies belong to the website preorder flow. No WhatsApp allocation, ordering, imports or redirects.**

## Confirmed release

- KACAU: Movie Tie-In, Ariff Adly, RM30, 328 pages.
- Limited to 1,000 units, no reprint.
- Expected publication: 1 November 2026. Dispatch date is separate and unconfirmed.
- Cinema release: 12 November 2026.
- KACAU is the only purchasable title; the six existing real titles remain visible for browsing. Fictional demo titles are hidden.
- Mock login now. Google OAuth stays last and requires explicit user instruction.
- QR payment with receipt upload, followed by staff/admin verification.
- Tracking numbers and courier integration remain deferred.

## Implementation delivered in this checkout

The application now has a functioning **device-local mock workflow**, not production commerce:

1. KACAU homepage, supplied jacket with front/back preview, movie countdown and preorder explanation.
2. Catalog-only rules for other books; stale/forged carts rejected by the shared mock checkout rules.
3. Guest plus distinct customer A, customer B, staff, admin and superadmin preview identities.
4. KACAU checkout with contact/address details, book and sample postage breakdown and one combined receipt.
5. Unpaid holds, customer copy limit, expiry, cancellation and inventory release.
6. Receipt type/size/signature checks, transfer reference, private-to-preview UI access, rejection with reason and resubmission.
7. Staff/admin review queue, bank-check acknowledgement, own-payment review denial, and confirmed preorder status.
8. Customer order history and timeline, preparation gate, refund request and admin recording of an externally completed refund.
9. Catalog editing, campaign pause/resume and Malaysia-time schedule editor, reports, role management and audit views.
10. Production builds without explicit mock mode disable all commerce and account mutations. The browser does not connect the new workflow to the legacy Supabase schema.

The supplied KACAU jacket is integrated unchanged, with front/back views. Director, producer and cinema release are verified from the public @filemkacau Instagram biography; see KACAU-ASSETS.md. The merchant QR remains unconfigured and non-payable.

Confirmed 15 October 2026: no per-account purchase cap; quantities are limited by remaining campaign stock. Flat postage per order is RM5 for Semenanjung Malaysia and RM10 for Sabah/Sarawak/Labuan. International postage is not configured. Dispatch is expected to start around 1 November 2026, not a guaranteed arrival date. Checkout leases last five minutes. Receipt corrections remain 24 hours; payment uses one combined transfer. Campaign dates remain preview configuration.

## Roles and purposes

| Feature                                     | Guest         | Customer          | Staff                                    | Admin                              | Superadmin                        |
| ------------------------------------------- | ------------- | ----------------- | ---------------------------------------- | ---------------------------------- | --------------------------------- |
| Public catalog and film information         | Read          | Read              | Read                                     | Read                               | Read                              |
| Cart                                        | Local         | Own               | Own                                      | Own                                | Own                               |
| Checkout and receipt submission             | Sign in first | Own               | Own as buyer                             | Own as buyer                       | Own as buyer                      |
| Own orders, timeline, contact details       | No            | Yes               | Yes                                      | Yes                                | Yes                               |
| Operational orders and receipts             | No            | No                | Yes                                      | Yes                                | Yes                               |
| Payment approval/rejection                  | No            | No                | Yes, not own                             | Yes, not own                       | Yes, not own                      |
| Preparation updates                         | No            | No                | Yes, after confirmed payment/publication | Same                               | Same                              |
| Cancel unpaid order without pending receipt | No            | Own               | Operational                              | Operational                        | Operational                       |
| Request paid cancellation/refund            | No            | Own               | Operational                              | Operational                        | Operational                       |
| Record completed manual refund              | No            | No                | No                                       | Yes, with reference                | Yes                               |
| Catalog content and campaign schedule       | No            | No                | No                                       | Yes                                | Yes                               |
| Pause new preorders                         | No            | No                | No                                       | Yes                                | Yes                               |
| Financial reports/CSV                       | No            | Own totals        | No bulk financial export                 | Yes                                | Yes                               |
| Customer/staff roles and deactivation       | No            | No                | No                                       | Yes, excluding self-access changes | Yes                               |
| Admin/superadmin appointments               | No            | No                | No                                       | No                                 | Yes, protecting last superadmin   |
| Operational audit                           | No            | Own safe timeline | Related order events                     | Yes                                | Yes                               |
| Security/role-change audit                  | No            | No                | No                                       | No                                 | Yes                               |
| Real QR destination changes                 | No            | No                | No                                       | Request later                      | Activate later after verification |
| Tracking                                    | Deferred      | Deferred          | Deferred                                 | Deferred                           | Deferred                          |

Guest is not a stored profile role. Mock switching is deliberately available only in the development preview and is not authentication. Role mutations, rather than account-switch buttons, determine the current permissions. Real signup must always produce a customer and may never accept a privileged role from editable metadata.

## Customer and payment flow

Browse KACAU → add copies → choose account → review address/contact/total → place preorder → reservation starts → pay through merchant QR (future live integration) → upload receipt → staff reviews actual bank transfer → approve or reject → confirmed preorder or correction request.

The preview uses one combined receipt for books plus sample postage. The existing Payment.kind field remains book for compatibility, but its amount is the full preview order total. **This is not compatible with the legacy two-payment SQL adapter.** The live schema must use payment obligations/allocations explicitly, with books and postage as accounting lines.

Order states: awaiting_payment → payment_review → confirmed → preparing. Alternatives: cancelled, expired, refund_requested, refunded. Tracking/shipped/delivered actions are not exposed in this release.

Receipt states: pending → verified or rejected. Each replacement is a new immutable attempt. Rejection requires a reason; approval requires a bank-check note and UI acknowledgement. Paid and pending-review orders never auto-expire. A refund request does not release inventory; recording a completed pre-dispatch refund does. No preview action actually moves money.

## Inventory rules

One website edition, one campaign, hard ceiling of 1,000. Catalog visibility does not confer purchase eligibility. Checkout requires the KACAU ID, preorder sale mode, matching open campaign, available capacity and valid quantity. The preview recomputes held copies from active orders; it never accepts a submitted price.

Unpaid holds expire after the provisional deadline. Submission moves the order into review protection; staff delays do not lose the customer's reservation. Expiry is idempotent and records one event. Checkout retries with the same request ID return the same order. A new order cannot evade the cumulative per-customer copy limit.

The local preview is intended for one browser tab; it is not a cross-device or concurrent inventory authority. Production must use PostgreSQL transactions, row locks, unique idempotency keys and scheduled expiry. Completed shipments must continue consuming the edition allocation, and returns must not restock until explicitly assessed.

## Supabase implementation plan — next backend deliverable

The existing SQL is preserved as legacy prototype material, not applied to this new flow. Provide additive migrations, RLS and transaction functions as one coherent delivery after the model below is finalized. Do not use the old README setup instructions or old seed to launch KACAU commerce.

| Table/module                                    | Changes                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| profiles / role assignments                     | Four authenticated roles, suspension, safe profile updates, protected role management                                 |
| books / catalog view                            | Separate visibility and sale mode, page count, expected publication, approved artwork and source classification       |
| preorder_campaigns / edition inventory          | Fixed 1,000 ceiling, one KACAU allocation, pause, open/close times, versioned policy                                  |
| orders / order_items                            | Authenticated owner, readable reference, idempotency, contact/address/price/postage snapshots, deadline, order status |
| reservations / inventory events                 | Atomic hold, confirm, expire and release with exactly-once accounting                                                 |
| payment obligations / submissions / allocations | Combined or separate obligations, immutable attempts, verified transaction reference, amount and review metadata      |
| order events / internal notes                   | Customer-safe timeline separate from restricted notes                                                                 |
| refunds                                         | Request, authorization, actual manual payout evidence and immutable adjustments                                       |
| shipping rates / payment instructions           | Versioned approved rates, merchant QR/payee and supported zones                                                       |
| film content / settings                         | Approved assets, credits, release date and explicit storefront readiness                                              |
| audit / notification outbox                     | Actor/time/reason, security visibility, reliable optional notifications                                               |

### RLS design

- Anonymous access is limited to safe published catalog/campaign/film fields. No customer, order, payment or audit access.
- Customers read only their own linked rows; they cannot assign roles, change ownership, approve payments or write totals/status directly.
- Staff read operational order/payment records and only the contact data needed for service. Staff cannot change prices, roles, QR destination or access bulk financial exports.
- Admins manage catalog/campaign/staff operations but cannot create admin/superadmin grants or change their own access.
- Superadmins manage elevated access and sensitive settings; they are application users, not database superusers or service-role key holders.
- All mutations use explicit permission-checked functions with fixed search paths, scoped grants and state/input checks. Lock order must be consistent across expiry, receipt, review and cancellation.
- Receipt Storage is private. Unique paths bind to owner/order; uploads cannot replace reviewed evidence. Signed URLs expire. Validate actual file content server-side as well as client-side. Cleanup is limited to unreferenced expired uploads under a reviewed retention policy.
- Views must respect caller security and expose only allowed columns. RLS governs rows, so sensitive fields require safe projections/separate tables or column privileges.
- Suspended/demoted users lose capabilities on the next protected operation. OAuth metadata is never authoritative for roles.

Deliver runnable SQL with schema changes, policies, Storage setup, grants, functions, production seed, first-superadmin bootstrap and tests. Supabase reference sources: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage policies](https://supabase.com/docs/guides/storage/security/access-control), [database functions](https://supabase.com/docs/guides/database/functions).

## Remaining phases

1. **Complete mock acceptance**: verify catalog restrictions, role separation, orders, receipt rejection/resubmission/approval, holds, refunds and responsive layout. This is the current delivered implementation.
2. **Finalize business inputs**: merchant QR/payee, shipping rules, purchase limits, reservation deadlines, exact preorder window, cancellation/refund policy, privacy/support information and dispatch estimates.
3. **Supabase backend**: implement the model/RLS above, connect a staging adapter, remove browser-local assumptions, test real private Storage and concurrent inventory. Mock stays the UI development login; isolated backend test identities validate auth/RLS without public Google login.
4. **Production readiness**: server-rendered public data/SEO, pagination, monitoring, abuse controls, backup/restore, security review, bank reconciliation, publication-delay handling and deployment rehearsal.
5. **Google OAuth last, only on instruction**: provider/callback/session/account-linking setup, default customer role, privileged onboarding, logout/revocation tests. Once all launch gates pass, enable real website checkout. Until then display website opening-soon mode, never WhatsApp.
6. **Tracking later**: courier/tracking fields and customer dispatch updates when requested.

## Launch acceptance

- Direct API tests deny all unauthorized role/ownership mutations and catalog-only purchases, including missing/forged campaign IDs.
- Last-copy concurrent checkouts never exceed 1,000; retries never double-reserve; expiry/review/cancellation races are safe.
- Verified money and submitted evidence are distinct. Partial/excess/late payments require an explicit exception workflow before live launch.
- Receipt privacy/type/size/path checks pass through actual Supabase Storage; stale signed links fail; orphan cleanup does not delete evidence.
- Customers see only their own data. Staff/admin do not approve own orders. Last superadmin protected. Audit records cannot be changed by application users.
- No mock accounts, production demo fallback, placeholder payment destination or demo postage in the live transaction path.
- Google login and real identity tests pass only in the final authorized phase.
- Mobile/keyboard/reduced-motion, slow connection, retry, refresh, duplicate click and session expiry tests pass.
- Backup/restore and checkout-pause runbooks tested. Rollback never resets/deletes paid orders or receipts.

## Verification notes

Historical coursework verification is separate from this release. Current checks and screenshots are described in README. New browser tests exercise the website-only mock workflow; the legacy PGlite suite only checks migration 001 and cannot certify the new model's production security.
