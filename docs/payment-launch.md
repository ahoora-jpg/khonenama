# Subscription payment activation

Paid tiers: `pro` (حرفه‌ای), `premium` (ویژه). Free registration is unchanged.
No price is seeded. The example 350,000 toman is used only in isolated tests.

## Before opening real checkout

1. Finalize the provider, merchant approval, final prices and duration. A production Zarinpal adapter is prepared; other providers need an adapter with the same `PaymentProvider` interface and an exact redirect allowlist in web/native.
2. In `/admin/billing`, configure each final amount **in toman**, duration **in days** and enable its published price. These are final payable amounts; no discounts or extra tax are currently added.
3. Store `ZARINPAL_MERCHANT_ID` as a Worker secret. Set `PAYMENT_PROVIDER=zarinpal` and `PAYMENTS_ENABLED=true` only when ready for the controlled live test. Do not put credentials in source, public env variables or this document.
4. Register the HTTPS callback on the merchant account: `https://www.khonenama.ir/api/billing/callback`. Query parameters contain a checkout identifier and a random return secret; no session or arbitrary return URL is accepted.
5. Test a real payment, cancellation, retry after a network interruption and duplicate callback. Confirm the receipt in the actual merchant portal, invoice amount, correct business and subscription end date. A mock test or configured secret is not evidence of real gateway readiness.
6. Keep receipts and reconcile outstanding invoices. `/api/billing/reconcile` allows an authenticated owner to recover a missing callback; do not start a second purchase to resolve an uncertain first payment.

## Rules enforced

- Owner/business comes from the authenticated session. Client business IDs and amounts never set the charge.
- The confirmed quote must match the current server price and duration before any invoice is created.
- Immutable checkout snapshots pin plan, price and duration. A later price edit cannot change an existing charge.
- Gateway request and verification use **rial**, exactly ten times the invoice's **toman** amount.
- Return status is advisory; server verification determines success. Callbacks require the correct checkout secret and authority.
- Unique checkout keys, gateway authorities and receipt references prevent duplicate requests and reused receipts. Atomic activation prevents replay and concurrent callback extensions.
- Same-tier renewal adds duration to the existing future expiry. An upgrade starts a new period at payment time; there is no prorated credit calculation. This is disclosed before checkout.
- A late lower-tier payment cannot silently downgrade a newly activated higher tier; its verified receipt remains recorded for support/refund review. Refund execution is not implemented.
- Network/unknown verification stays pending. No fake gateway or sandbox activation is enabled on production.
- Membership and plan entitlements are shared between web and mobile; photos above the limit remain stored after expiry.

## Schema

Additive migration: `db/migrations/0008_billing_checkout.sql`. The billing service also creates these tables idempotently through the Worker D1 binding, consistent with existing runtime migrations. No existing business/subscription rows are rewritten by migration.

## Sources consulted

- https://github.com/ZarinPal-Lab/Zarinpal-RestAPI-Sample-php/blob/master/Request.php
- https://github.com/ZarinPal-Lab/Zarinpal-RestAPI-Sample-php/blob/master/Verification.php
- https://docs.expo.dev/versions/v57.0.0/sdk/linking/
- https://reactnative.dev/docs/appstate
