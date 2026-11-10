# WhatsApp messages and scheduled jobs

## What is sent

| Template (register as) | When | To | Parameters |
|---|---|---|---|
| `ailit_consent_request` | A student under 18 signs up with a parent's number | Parent | 1 student's first name, 2 consent link |
| `ailit_test_reminder` | 24 hours before a booked AILIS session | Candidate (if they turned on WhatsApp) | 1 first name, 2 session title, 3 date and time, 4 place |
| `ailit_weekly_summary` | Sunday from 17:00 WIB | Parent (if they gave a number and kept WhatsApp on) | 1 parent's first name, 2 summary, 3 link |
| `ailit_login_code` | Someone asks for a sign-in code with their phone number | That account's number | 1 six-digit code (category **Authentication**) |
| `ailit_score_ready` | A rated AILIS result is released | Candidate (if they turned on WhatsApp) | 1 first name, 2 result link |

Every template exists in Bahasa Indonesia (`id`) and English (`en`). The exact texts are in
`apps/web/src/lib/whatsapp.ts` (`WA_TEMPLATES`); submit them to Meta word for word, with
`{{1}}`, `{{2}}` … where the parameters go. Category: **Utility**, except `ailit_login_code` (**Authentication**).

In-app notifications and email are sent as well, so nothing depends on WhatsApp alone.

## Until a provider is connected

`WHATSAPP_PROVIDER=console` (the default) writes each message to the server log instead of sending it.
Teachers and school admins can still pass consent links by WhatsApp by hand from the school and class
pages, and students can send their parent code by WhatsApp from the Account page.

## Connecting the WhatsApp Cloud API (later)

1. Create a Meta Business account and a WhatsApp Business app; add the platform's phone number.
2. Register the four templates above, in both languages, and wait for approval.
3. Create a permanent system-user token with `whatsapp_business_messaging`.
4. Set in `.env.selfhost`: `WHATSAPP_PROVIDER=meta`, `WHATSAPP_TOKEN=…`, `WHATSAPP_PHONE_NUMBER_ID=…`, then restart.

A BSP (for example a local WhatsApp partner) can be added later as another provider in `lib/whatsapp.ts`.

## Scheduled jobs

The `scheduler` service in `docker-compose.selfhost.yml` calls `POST /api/jobs/run` every hour with the
header `x-cron-secret: $CRON_SECRET`. Each run:

- sends test reminders for bookings whose session starts in the next 24 hours (once per booking);
- on Sunday from 17:00 Jakarta time, sends the weekly summary to each parent (at most once every 6 days);
- sends notifications for announcements whose start time has come.

Running it twice does no harm. A super admin can run it by hand, and send the weekly summary at once:

```bash
curl -X POST -H "Content-Type: application/json" -b cookies.txt -d '{"forceWeekly":true}' https://ailearning.impact.id/api/jobs/run
```
