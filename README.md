# FIXIHUB — KACAU website preorder preview

KACAU: Movie Tie-In is the featured release: Ariff Adly, RM30, 328 pages, 1,000 copies, no reprint. Expected publication is 1 November 2026; cinema release is 12 November 2026. All planned preorders are through this website. Other real titles are browsing-only.

## Run locally
ccc
Requires Node.js 22+.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Development defaults to mock mode. At `/account`, select Aina or Daniel (customers), Sarah (staff), Amir (admin), Hana (superadmin), or guest. Each identity has separate permissions and order visibility. Google OAuth and tracking are intentionally deferred.

To build a **preview** for a production-style server, explicitly set `NEXT_PUBLIC_APP_MODE=mock` before building (see `.env.example`). A production build without this flag, or with `NEXT_PUBLIC_APP_MODE=live`, shows the catalog with checkout/login disabled. Environment changes require rebuilding. This is a fail-closed launch gate, not a completed live adapter.

## Test the journey

1. Choose Aina at `/account`, open KACAU, add one copy, and checkout using fictional contact/address details.
2. On `/orders`, view the unconfigured payment QR panel and upload a fictional JPG/PNG/PDF with a made-up transfer reference. Do not send money or upload real banking evidence.
3. Choose Sarah, open `/admin`, then Payment review. Load the private preview receipt, acknowledge the simulated bank check, and approve with a note. Rejection requires a reason and allows a new submission.
4. Return to Aina to see the confirmed preorder and timeline. Daniel cannot see Aina's orders.
5. Amir can manage catalog, campaign schedule/pause, reports, customer/staff access and refund cases. Hana additionally manages elevated roles and security audit.

The preview uses a provisional two-copy limit across active customer orders, 24-hour unpaid holds/correction windows, 15–31 October campaign dates and RM8 sample postage. One receipt covers book plus sample postage. These are not approved commercial terms.

## What is implemented

KACAU homepage/movie countdown, catalog-only restrictions, guest and four authenticated mock roles, checkout, one combined receipt, payment review/rejection/resubmission, customer order timeline, copy-limit/expiry/cancellation rules, mock refund handling, campaign management, catalog content editing, reporting, role controls and audit views. The supplied KACAU jacket, front/back controls and motion-accessible cinematic design are integrated. Film credits are verified from the public Instagram biography (see docs/KACAU-ASSETS.md). The merchant QR remains pending.

## Important boundaries

- Mock records use localStorage, receipts use IndexedDB, identity/cart use sessionStorage. This is a single-browser-tab preview, not a shared or secure production database. UI permissions simulate the intended access model; browser storage is inspectable by the device owner.
- The new provider **does not connect to Supabase**. Existing `lib/supabase.ts`, migration 001, seed and coursework documents are legacy foundations. They use two roles and separate book/postage payments and are not compatible with this new flow. Do not deploy them as the KACAU production backend.
- Mock balances, reviews and refund actions do not move funds. Merchant payment setup, real authentication, final postage/policies and the new Supabase migrations/RLS are still required.
- Google OAuth is the last integration and will only be implemented on instruction. Tracking/courier actions remain deferred.
- No live service has been deployed by this implementation.

See [the revised production plan](docs/PRODUCTION-PREORDER-PLAN.md) for the full role matrix, implementation status, Supabase/RLS design and remaining launch gates.

## Verification

```sh
npm run typecheck
npm test
npm run build
# With npm run dev running on port 3000:
npm run test:e2e
```

Browser tests use Chrome and a fixed 15 October 2026 date to exercise the preview campaign consistently. Screenshots go to `docs/screenshots/kacau-*.png`. The historical `npm run test:db` suite tests only legacy migration 001; it does not validate the new preorder model. The service worker retains its offline shell and does not cache authenticated pages or payment data.
