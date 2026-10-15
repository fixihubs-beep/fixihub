# FIXIHUB workspace plan and verification

Updated 15 October 2026. Applies to the device-local preview. Google OAuth, Supabase integration, actual payments, tracking and deployment remain deferred.

## Role and tab plan

| Tab              | Roles                    | Purpose and implemented features                                                                                   | Required safeguards                                                                                                                                    |
| ---------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Overview         | Staff, admin, superadmin | Available/reserved copies, receipt queue, confirmed orders or net verified payments, task shortcuts, recent orders | Counts represent preview records; reservations are not revenue; newest orders first                                                                    |
| Orders           | All workspace roles      | Search, status filter, customer/contact/address detail, cancellation, preparation and refund requests              | Revalidate current status on mutation; reason required; pending/paid orders cannot be cancelled as unpaid; preparation blocked before publication      |
| Payment review   | All workspace roles      | Search references/orders/customers, status filter, receipt access, review decisions and history                    | No own-payment reviews; load receipt, acknowledge bank check and provide note before approval; reject with correction reason; stale reviews rejected   |
| Catalog          | Admin, superadmin        | Cover thumbnails, title/author search, edit title/author/description/visibility                                    | Only existing books; KACAU remains visible; other titles stay browse-only; edition price and eligibility fixed                                         |
| Campaigns        | Admin, superadmin        | Schedule in Malaysia time, capacity/reservations, pause/resume                                                     | Fixed 1,000-copy ceiling; opening precedes closing; closing cannot exceed stored publication date; pause does not cancel existing orders               |
| Team & customers | Admin, superadmin        | Search accounts, show active state, review proposed role/access change before confirmation                         | Admin manages customer/staff only; superadmin handles elevated roles; no self-access change; last active superadmin protected; validate role values    |
| Reports          | Admin, superadmin        | Gross verified funds, recorded refunds, net funds, reservation commitments, CSV export                             | Reservations and refunds clearly separated; CSV formula escaping; export only visible authorized records; no actual funds moved                        |
| Audit            | Admin, superadmin        | Search chronological operational events, actor, timestamp and detail                                               | Admin view excludes access-governance events through provider; superadmin sees elevated audit; immutable server audit still required before production |
| Security         | Superadmin               | Role boundaries, authentication/payment/tracking readiness, access-change history                                  | Readiness is informational; cannot enable live commerce or expose secrets from the browser                                                             |

Guests/customers never receive workspace access. Staff do not receive catalog, financial export, people, audit or security controls. All mutations still check current role independently of tab visibility.

## Design

FIXIHUB branding throughout, monochrome availability card, consistent panel headings, active navigation indication, visible preview mode, scoped search and status controls. Mobile navigation scrolls horizontally inside its own container; operational tables become labelled cards. Desktop retains tables for scanning. Modals retain accessible dialog semantics, explicit error messages and disabled busy actions. Role changes show the target and proposed access before confirmation.

## Review findings addressed

- Access selectors previously applied changes immediately: now use a review dialog.
- Orders lacked status filters; payment/catalog/people/audit tabs lacked search: added scoped controls and empty results.
- Campaign validation used the submitted release date even though publication is fixed: now validates against the stored release date.
- Runtime role values were only TypeScript-constrained: now reject unknown roles.
- Receipt approval could be attempted on one's own payment until the provider rejected it: controls now disable this early and explain why; provider checks remain.
- Overview selected the first campaign and assumed it existed: now selects KACAU by identity and guards missing inventory data.
- Mobile tables required horizontal scanning: now render labelled rows without page overflow.

## Production boundaries / remaining work

This is not a production security certification and no claim of zero defects is made. Browser storage and mock role switching are not authentication or RLS. Live launch requires server-authoritative transactions for capacity/copy limits/expiry, authenticated role enforcement, Supabase RLS and private receipt storage, concurrency/idempotency checks, immutable audit events, verified merchant payment destination, refund evidence, confirmed shipping/hold policies, and backups/monitoring. Shared/multi-device inventory is not guaranteed by this local preview. Approval acknowledgement remains a UI gate, not a bank integration. Receipt matching and refund completion are simulated manual operations.

The existing production preorder plan remains the source for deferred schema/RLS and launch requirements. Do not enable Google login, real payments, shipping/tracking, or live checkout as part of this design update.

## Verification completed

- 12 unit checks passed: commerce rules, expiry, inventory holds, permissions, own-payment denial, protected administrator roles, invalid-role rejection and CSV escaping.
- 9 relevant browser checks passed across the workspace and customer flows: all role-specific tabs, mobile overflow, access confirmation/cancellation, catalog edits, campaign validation/pause/resume, audit search, report download, receipt correction/approval, cancellation and customer isolation.
- Desktop and mobile screenshots inspected. Type checking passed; production build validation recorded with this change.

These checks cover the scenarios above; they do not establish that every edge case is defect-free or replace production authentication, database and concurrency testing.

Brand refinement: FIXIHUB uses black, white and neutral greys. Workspace navigation has no left-edge or underline accent; active tabs use a soft grey fill. Green is reserved for KACAU promotional artwork and calls to action.
