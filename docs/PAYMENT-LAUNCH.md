# Production payment setup — FIXIHUB

## Run the SQL

Run the complete `supabase/production/commerce.sql` in your Supabase SQL Editor. This file includes the catalogue, private receipt bucket, RLS, role checks, shared 50-person queue, five-minute deadlines, server-calculated prices/postage, order and receipt operations, and audit records. Do not run the old prototype migration or seed for this launch. The earlier queue-foundation file is separate and is not used by this integration.

The installation leaves checkout CLOSED. Rerunning it preserves orders and settings. Customer accounts are created on the first authenticated snapshot. Google sign-in must be configured separately.

## Merchant information and server configuration

1. Run the latest complete `commerce.sql`. If you already ran the previous version, run only `payment-settings.sql` to add superadmin-managed bank settings and the public merchant-QR bucket. Customer receipt storage remains private.
2. Configure `SUPABASE_SERVICE_ROLE_KEY` in the server hosting environment (never NEXT_PUBLIC, committed, or sent in chat). Restart/redeploy afterwards. The QR is no longer required as a local website file.
3. After assigning the first superadmin, open Publisher workspace → Security → Merchant QR & bank details. Save the actual bank name, account number, payee, support contact and merchant QR. Only superadmins can publish these settings. Pause the campaign and finish active payment reservations before changing payment destinations. The public QR bucket accepts JPG/PNG up to 10 MB; existing images cannot be overwritten by the browser API.

4. Sign in with Google once. In SQL Editor, find your own `id` in `fixihub_live.profiles`, then bootstrap the first superadmin by exact user ID:

```sql
update fixihub_live.profiles set role='superadmin'
where id='REPLACE WITH YOUR AUTH USER UUID';
```

Do not assign admin access through Google metadata. Later role changes are restricted and audited in the workspace.

5. Confirm the actual campaign schedule. Defaults: opens 16 October 2026 00:00 MYT, closes 31 October 2026 23:59:59 MYT, expected publication/dispatch from 1 November 2026. Open the campaign in the admin workspace only after the checks below. Database settings and the server/QR readiness check both gate the website.

## Check before accepting payments

- Test Google sign-in, then refresh to load the database role.
- Test an actual private upload for JPG, PNG and PDF up to 10 MB. The bucket and server both enforce size/type; the server also checks the file signature. This is not antivirus scanning. Staff should open receipts only in an updated browser/PDF viewer.
- Use two real test accounts to check order isolation, signed receipt access (two-minute links), rejection/resubmission and approval. A staff member cannot review their own receipt.
- Check the bank payee and QR destination independently. Receipt submission is NOT payment confirmation; staff must match the transfer against bank records.
- Check RM5 Semenanjung / RM10 Sabah, Sarawak and Labuan. Postage is flat per order. No per-account purchase cap; total inventory is 1,000.
- Check refresh/navigation, five-minute expiry, queue position and late payment. Expiry is evaluated transactionally whenever the queue/orders are read or changed. Expired reservations do not count against inventory even between reads.
- A late receipt can be submitted for up to seven days. If stock remains it is reserved again for review; otherwise the order becomes `payment_issue`, requiring admin refund handling. Refund buttons record an externally completed refund; they never send money.
- Tracking remains deferred. Preparing is allowed only after the expected publication date.

## Operational boundaries

Uploading goes directly to private Supabase Storage; only a small JSON request goes through the website, avoiding common serverless request-body limits. Uploads cannot be overwritten through the customer API. Five upload allocations per order per ten minutes limit retries; unsubmitted allocations expire after ten minutes. Orphan files may remain in private storage after failed submissions: inspect and delete them through the Storage dashboard after confirming they have no payment record. Do not delete storage metadata directly with SQL.

Polling uses the shared server clock. Queue requests are serialized with stock and payment decisions. Browser polls happen about every 10–12 seconds, with a local one-second countdown. Load testing on the deployed Supabase/hosting plan is still required before a high-traffic announcement; local tests do not certify hosting capacity.

Current automated database tests use local PostgreSQL-compatible PGlite, including simulated Storage RLS tables. They do not replace testing against the real Supabase Storage service. No remote SQL is installed by the public-key connection.
