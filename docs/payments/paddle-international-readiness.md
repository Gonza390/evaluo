# Evaluo: international payments / Paddle readiness (October 2026)

## Current status: DESIGN ONLY — NOT ENABLED
- This branch is preparatory. It does **not** open Paddle checkout, change production prices, write to Supabase, or grant Premium.
- Argentina continues using Mercado Pago via the existing `/api/payments/checkout` and `/api/webhooks/mercadopago` flows.
- Any international flow must fail closed until merchant approval, complete lifecycle support and verified sandbox tests.
- Paddle's AUP explicitly lists "certifications and exam preparation services" among prohibited activities. Evaluo needs **written approval**, describing the actual product without relabeling it, before any live processing.
  https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle

## Audit of existing code (master when this branch was created)
- `components/pricing/PaymentCheckoutCard.tsx`: renders amounts strictly in ARS and allowlists Mercado Pago checkout domains.
- `app/api/payments/checkout/route.ts`: creates Mercado Pago recurring subscriptions or fixed-term semester payments; stores checkout attempts with ARS-denominated columns.
- `app/api/webhooks/mercadopago/route.ts`: verifies Mercado Pago events and reconciles subscription/payment records in Supabase.
- `app/api/payments/status/route.ts`: derives active Premium and billing mode from stored subscriptions.
- `app/api/payments/cancel/route.ts`: cancels subscriptions with Mercado Pago only.
- `lib/payments/provider-selection.ts` in THIS BRANCH is a future routing policy **not used by production**. Non-AR returns unavailable unless both approvals are explicit.
- `lib/payments/paddle-signature.ts` in THIS BRANCH authenticates raw Paddle notifications. No event handling, grants or status updates are wired.
- The default main GitHub branch is different from the active product branch; this work is based on `master`.

## Required approvals and business setup (blocking)
1. Send Paddle the actual product URL, activity description and an explicit question about exam-preparation AUP. Obtain written acceptance for Evaluo's AI study, flashcards and mock exam practice from uploaded PDFs.
2. Verify that the exact legal/fiscal holder of Evaluo's merchant account in Argentina can be onboarded, and confirm available payout rails, currency, limits and charges.
3. Establish seller profile, domain, support contact, refund/cancellation policy, privacy and billing documents.
4. Confirm whether prices include or exclude destination-country consumption tax and compare received net proceeds for a USD 10 benchmark.
5. Create Paddle **sandbox** first. Never use live keys or enable global checkout before the blockers above clear.

## Planned configuration (DO NOT SET LIVE YET)
- `PADDLE_ENVIRONMENT=sandbox` for testing
- `PADDLE_API_KEY` — server only
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` — limited browser token (never the API key)
- `PADDLE_WEBHOOK_SECRET` — server only, notification destination specific
- `PADDLE_MONTHLY_PRICE_ID` — monthly recurring catalog price
- `PADDLE_SEMESTER_PRICE_ID` — **one-time** six-month access; do not silently make it a 6-month recurring charge
- `PADDLE_ACCOUNT_APPROVED` and `PADDLE_CHECKOUT_ENABLED` — explicit server-side gates, both default OFF
- Keep keys in Vercel secrets/approved environment stores. Do not commit credentials or paste them into a chat.

## Technical implementation sequence after written approval
1. Formalize a provider-agnostic `billing` model: provider, provider_customer_id, provider_subscription_id, offer, price_id, amount, currency, tax breakdown, payment status and an internal attempt UUID. Audit RLS, ownership and existing ARS fields before a migration; do not overwrite established Mercado Pago history.
2. Price localization: display a seller-approved quote from the relevant provider; never assume ARS can be converted into a globally valid price. Country can determine UX routing but **not** authorize payment or Premium.
3. Authenticate the user on the server when creating checkout. Derive product and allowed price IDs on the server; do not accept arbitrary price IDs or amounts from the client. Attach a validated internal attempt ID to Paddle `custom_data`.
4. Build Paddle.js sandbox checkout and a sandbox webhook endpoint. Verify `Paddle-Signature` on the **unmodified** raw body with endpoint secret before any parse/write. Test invalid signatures, stale timestamps, and cross-account attempts.
5. Use transactional, idempotent event reconciliation. Deduplicate on `event_id` and handle events arriving out of order using `occurred_at`. Reconcile `subscription.created` / `subscription.updated`; use `transaction.completed` to record completed payments, including fixed-term purchases. Never grant Premium based solely on browser `checkout.completed`, a success URL or unverified event data.
6. Handle subscription cancellation, past-due, pause, chargeback, refund, expiry and renewal; avoid double billing or double granting Premium. Six-month purchases expire on the exact computed date.
7. Recheck `/api/payments/status`, account settings, cancellation UI, invoicing, refunds, referrals and pricing analytics for all providers. Keep MP behavior unchanged.
8. Sandbox QA matrix: one monthly purchase, one semester purchase, failed payment, refund, cancellation, duplicated webhook, out-of-order events, unauthorized checkout and both account providers. Verify no production entitlement changes.
9. Launch behind feature flag to small allowed markets only after written approval, merchant KYC and accepted payout conditions.

## Test command
`node --import ./tests/alias-loader.mjs --experimental-strip-types tests/paddle-readiness.smoke.ts`

This tests only routing safety and HMAC verification. It is **not** an end-to-end Paddle integration test.

## Paddle documentation
- AUP: https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle
- Webhook verification: https://developer.paddle.com/webhooks/about/signature-verification/
- Provisioning: https://developer.paddle.com/build/subscriptions/provision-access-webhooks/
- Checkout: https://developer.paddle.com/build/checkout/build-overlay-checkout/
- Sandbox: https://developer.paddle.com/get-started/quickstart/
