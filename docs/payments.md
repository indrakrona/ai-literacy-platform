# Payments (placeholder)

**Status:** test mode only. No real payment gateway is connected and no money can be charged.
Prices in `apps/web/src/lib/payments/index.ts` (`PLANS`) are placeholders and must be set by the
business team before launch.

## What works today

- **School admin flow:** in `/sekolah`, a school admin chooses a number of student seats and clicks
  *Lanjut ke pembayaran*. An order (`orders` collection) is created with status `pending`.
- **Test payment page:** with the `mock` provider, the admin goes to `/sekolah/bayar/[order]`. That
  page can simulate a successful or failed payment.
- **Webhook:** the simulation goes through the same signed webhook path a real gateway would use
  (`POST /api/orders/webhook`).
- **On a successful payment:**
  - The order becomes `paid`.
  - The school's `licence` gets the seats and is extended by the plan length. An active licence is
    extended from its end date.
- **Safety rules:**
  - Webhooks are idempotent: only a `pending` order can change.
  - An amount that differs from the order marks the order `failed`.
  - A bad signature is rejected with 401.
- **Production servers:** test payments are switched off when `NODE_ENV=production` unless
  `PAYMENTS_ALLOW_MOCK=true` is set. Set it on a pilot server only.
- **Seat limits:** not enforced yet. The licence card warns when students exceed seats. During the
  pilot, every feature works without a licence.

## Environment variables

| Variable | Purpose |
|---|---|
| `PAYMENTS_PROVIDER` | `mock` (default), `midtrans` or `xendit` |
| `PAYMENTS_WEBHOOK_SECRET` | HMAC secret for the mock provider's webhook signature |
| `PAYMENTS_ALLOW_MOCK` | `true` to allow test payments on a production build (pilot only) |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` | Midtrans credentials |
| `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN` | Xendit credentials |

## To connect a real gateway later

1. **Pick a gateway.** Both Midtrans and Xendit support bank transfer (virtual account), QRIS and
   e-wallets, and issue invoices that school finance offices can use. Implement one of them.
2. **Write the provider.** In `apps/web/src/lib/payments/index.ts`, replace `NotConfiguredProvider`
   with a real class:
   - `createCheckout`: create a payment or invoice for the order and return the hosted payment page
     URL plus the provider's reference.
     - Midtrans: Snap transaction API.
     - Xendit: Invoice API.
   - `parseWebhook`: verify the callback and map the provider's status to
     `paid | failed | expired | pending`.
     - Midtrans: check `signature_key` = SHA512(order_id + status_code + gross_amount + server_key).
     - Xendit: compare the `x-callback-token` header with `XENDIT_CALLBACK_TOKEN`.
3. **Register the webhook.** In the provider dashboard, set the callback URL to
   `https://ailearning.impact.id/api/orders/webhook`.
4. **Test in sandbox.** Set the credentials, set `PAYMENTS_PROVIDER`, and test end to end in the
   provider's sandbox before switching to production keys.
5. **Set the real prices** in `PLANS` and set `PRICES_ARE_PLACEHOLDERS = false`.
6. **Decide the remaining policies:** tax invoices (PPN/faktur), refunds, payment by purchase order
   or BOS funds, and whether to enforce seat limits.
