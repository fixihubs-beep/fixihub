# Telegram notifications

## Topics
Create a private Telegram supergroup with Topics enabled and four topics: LOGIN, ORDER, PAYMENT, FEEDBACK. Add your bot and grant permission to send messages and documents in those topics. Restrict membership to staff authorized to see customer details and payment receipts.

LOGIN means a new FIXIHUB account, once on its first successful database registration, not every sign-in. ORDER contains name, full delivery address, quantity, phone, email, order ID and total. PAYMENT contains the order ID, reference, amount and original JPG/PNG/PDF proof as an attachment. FEEDBACK contains the signed-in user's name/email, category, message and page path. No old records are broadcast when installing this upgrade.

Configured local destination: group `-1003706909501`; LOGIN `2`, FEEDBACK `4`, ORDER `6`, PAYMENT `8`. Set these same values in the hosting environment.

## Install
1. Run `supabase/production/commerce.sql` if this project is new. Then run the latest `supabase/production/telegram.sql` in Supabase SQL Editor. If Telegram SQL was already installed, run `supabase/production/telegram-immediate.sql` to add immediate delivery support. It is safe to rerun; it preserves existing jobs.
2. Set server-only environment variables from `.env.example`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_TOPIC_LOGIN`, `TELEGRAM_TOPIC_ORDER`, `TELEGRAM_TOPIC_PAYMENT`, `TELEGRAM_TOPIC_FEEDBACK`, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`. Keep tokens and keys out of chat and source control. Topic IDs must be positive numeric message thread IDs. The group ID is usually a negative number starting with -100.
3. Restart/redeploy. Configure your hosting scheduler to call `GET https://YOUR-DOMAIN/api/notifications/dispatch` every minute, with the header `Authorization: Bearer YOUR_CRON_SECRET`. The secret must be long and random. A cron call is required even when nobody is browsing the website. The worker endpoint is not a public notification submission API.
4. Test a new Google account, one order, one real test receipt and feedback. Confirm each reaches the correct private topic. No real Telegram sends have been tested by the implementation tests.

The worker processes up to 15 jobs per run, spaced apart, within a bounded execution window. Allow 60 seconds for the route in your hosting plan. The website requests immediate delivery after a successful first account snapshot, new order or feedback submission; receipt verification schedules it directly on the server. The response returns before Telegram delivery finishes. The scheduler is the backup for failed, interrupted or missed immediate attempts, including direct database/API events. Bursts and Telegram rate limits can delay delivery. Telegram rate limits return jobs to the queue with a retry delay. Inspect pending jobs periodically:

```sql
select kind, count(*) as pending, min(created_at) as oldest,
       max(attempts) as highest_attempts
from fixihub_live.notifications
where sent_at is null group by kind;

select id, kind, attempts, available_at, last_error
from fixihub_live.notifications
where sent_at is null order by created_at limit 50;
```

Notifications are captured by database triggers in the same transaction as new records, so closing a browser does not lose them. Telegram failure does not undo checkout or receipts. Unique event records prevent duplicate jobs; leases prevent concurrent workers handling the same job. Delivery is at-least-once: a network timeout after Telegram accepts a message can cause a duplicate on retry. IDs in each message identify duplicates. A notification never automatically approves payment.

Receipt files are read server-side from private Storage and uploaded directly as Telegram documents; public receipt links are not created. Telegram receives a copy. The privacy page and feedback form disclose this sharing. Feedback is limited to three submissions per account per ten minutes and requires sign-in. Guests can open the button and follow the Google sign-in link.

Official API reference: https://core.telegram.org/bots/api#sendmessage and https://core.telegram.org/bots/api#senddocument (topic routing uses message_thread_id).

Immediate delivery uses `/api/notifications/immediate`, which verifies the Google session and accepts no custom message, destination or user ID. It claims only new jobs owned by that user. Retries cannot bypass their backoff through this endpoint. Immediate requests use Next.js `after`; the hosting runtime must support it. Keep the minute-by-minute scheduler enabled even after immediate delivery is active.
