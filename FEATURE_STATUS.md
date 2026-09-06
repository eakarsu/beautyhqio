# BeautyHQ feature assessment — September 6, 2026

BeautyHQ is not complete. This assessment is based on the two Desktop screenshots (9:09:54 and 9:10:14 AM), repository code, and the documented supported workflow. It is not a full acceptance test of every menu item.

## Screenshots

Both screenshots show a successful owner login to Luxe Beauty Studio. The dashboard displays six appointments, 25 clients, no walk-ins, zero revenue for today, and zero staff on duty. Those values alone do not indicate an error. The code calculates revenue from completed transactions and staff on duty from working-day schedules; having booked appointments does not automatically make either number nonzero. The staff metric is scheduled availability, not proof of clock-in or presence.

## Current status

| Area | Evidence | Remaining work |
| --- | --- | --- |
| Appointment lifecycle | Central booking service, idempotency, tenant checks, overlap prevention, versioned transitions, audit, and delivery outbox exist | Full role and browser acceptance, legacy overlapping data review, timezone and concurrency coverage |
| Clients, services, staff, products | Models, pages and routes exist | Verify create/edit/archive, tenant boundaries, searches, pagination and error states |
| Calendar, walk-ins, kiosk, recurring and voice bookings | Multiple entry points exist | Route all writes through the central booking service; legacy writes are disabled by default in production |
| POS, billing, gift cards, loyalty, subscriptions | Implementation and provider code exist | Provider test-mode validation, refunds, duplicate webhooks, balances, reconciliation, permissions and customer acceptance |
| Marketing, reviews, CRM and marketplace | UI and API routes exist | Consent and delivery checks, complete data flows, provider failures and end-to-end tests |
| AI scheduling, messages, summaries and recommendations | Numerous provider-backed routes exist; middleware requires AI configuration and authentication | Validate each route's tenant scope, input/output, provenance, review/save behavior, cost limits and failure handling |
| Skin-image kiosk | Accepts imageData but sends only text to the provider | Implement actual multimodal transmission with consent and image validation; never present text-only output as image analysis |
| Wearables | Fitbit and Apple Health connect/sync endpoints explicitly report unavailable; no samples are ingested | Implement real provider authorization/sync; Apple Health requires a native HealthKit integration, not an invented OAuth bridge |
| Release readiness | Booking-focused operational documentation and tests exist | Reconcile stale startup/migration documentation; full acceptance, accessibility, backup/restore and provider validation |

## Corrections made during this review

- Non-platform dashboard queries retain a location filter even when the business has no locations; an empty location list can no longer produce a global query.
- Staff and users without a business cannot access the business-wide dashboard API.
- Dashboard loading failures show a retryable error instead of displaying zero totals as if loading succeeded.
- Four targeted dashboard isolation tests pass. The source changes require rebuilding/restarting the production-mode local server before they appear there.

## Proposed AI and non-AI backlog

These are implementation candidates to prioritize, not completed features. Reuse and finish existing code wherever it meets the workflow requirements.

| Phase | Non-AI | AI |
| --- | --- | --- |
| 1. Complete the foundation | Tenant/role tests, dashboard correctness, working navigation, booking lifecycle, real error states | Audit existing routes; schema validation, provider timeouts, source records, human review and saved drafts |
| 2. Front desk | Unified online/kiosk/voice booking, waitlist, cancellations, rescheduling, deposits, reminders and customer portal | Enquiry intake, appointment suggestions, translation, message drafts and front-desk assistance |
| 3. Salon operations | Staff shifts, time off, clock-in/out, timesheets, commission/payroll exports, room turnover and resource conflicts | Draft staffing/availability suggestions and explain scheduling conflicts |
| 4. Sales and stock | POS, returns, refunds, cash reconciliation, gift-card/loyalty balances, suppliers, purchase orders and receiving | Stock reorder recommendations, invoice anomalies and revenue explanations |
| 5. Customer growth | Leads/referrals, service packages, memberships, consent-aware campaigns, review requests and response history | Review-response drafts, service-history summaries, customer-approved rebooking and relevant service suggestions |
| 6. Integrations | Accounting/calendar/payment/SMS/email connections, retry queues, delivery status and per-business credentials | Voice transcription/intake and photo-based cosmetic assistance with actual multimodal inputs |
| 7. Advanced options | Multi-location/franchise operations, hardware POS, native mobile/offline workflows and optional wearable connections | Knowledge search with sources, optional personalization, and measured evaluations of predictive features |
| 8. Release | Accessibility, mobile layouts, backup/restore exercise, monitoring, import/export and support procedures | Usage/cost dashboards, failure monitoring, evaluation datasets and review/audit records |

Health-related screens must be scoped separately from ordinary salon operations and must not imply medical diagnosis or validated clinical performance. External integrations require the selected provider's account, capabilities, consent flow and test configuration. Implementing delivery/payment software is separate from actually sending messages, charging customers or publishing changes.

No new external delivery, charge, wearable access, migration or deployment was performed for this assessment. HomeServices implementation remains a separate in-progress project unless the user changes priority.

## Implementation in progress (September 6)

The full backlog is authorized. This section records actual progress; the original assessment above is retained as the starting point, not a statement that new code has passed all acceptance tests.

Implemented so far:
- Tenant-scoped transactional gift-card and loyalty redemptions with durable idempotency receipts, positive amounts, balance checks and audit records.
- Atomic purchase-order receiving with quantity bounds, tenant ownership and rollback; stock adjustments with audit reasons.
- Persistent clock-in/out, unpaid breaks, submitted/approved timesheets and approved hourly-pay CSV export.
- Persistent treatment rooms, cleaning checklists, status changes and appointment reservations with overlap checks.
- Central booking validation for staff location, service eligibility, time off, shifts and buffers; price overrides denied to clients; consent respected when queuing confirmations.
- Atomic recurring series with local-time/DST handling; versioned rescheduling that preserves appointment identity and payment links and updates room reservations.
- Authenticated online/marketplace booking and kiosk check-in adapters use central lifecycle services.
- AI workspace for 11 draft tasks, source inspection, saved review decisions, actual provider usage/cost fields and business request limits; knowledge documents/search.
- Actual image content blocks for kiosk cosmetic assistance, image validation and client consent; removed fabricated skin score prompts.
- Encrypted per-business provider configuration, delivery history and retries; campaign sending now queues consenting recipients instead of simulating successful sends.
- Refund reservation records and stable Stripe idempotency keys; cumulative refundable balance checks and explicit unknown/failed/processing outcomes.
- Product/service/vendor create/edit/archive handlers being consolidated with role/tenant validation; reward demo-success fallback removed.

Verification checkpoints:
- 79 unit tests passed after booking, balance, time, room and AI-validation changes.
- 13 PostgreSQL integration tests passed in a disposable schema, then that schema was removed. Coverage includes concurrent gift/loyalty redemption, receiving rollback, timesheets, booking lifecycle and resource reservations.
- TypeScript passed at the latest completed checkpoint. Subsequent changes still require final build/browser/provider-contract validation.
- Applied local additive migrations `20260906000000_operations_workflows` and `20260906010000_provider_workflows` after a database backup at `/Users/erolakarsu/.codex/backups/beautyhqio/before-operations-20260906.dump`.
- No external messages, charges or refunds have been sent. Provider calls and device flows remain to be tested using configured test accounts/devices.

Still in progress: remaining legacy tenant boundaries, complete UI paths for new services, purchasing UI, waitlist/shift/review flows, provider callback/reconciliation contracts, native/offline/hardware and wearable integrations, and full release acceptance. Do not label the whole application complete based on these checkpoints.

### Paid-plan activation and browser checkpoint — September 6

- Added persistent owner billing requests, stable Stripe checkout retry keys, open-checkout reuse and a hold after uncertain outcomes or the retry window. Requests cannot be reused for another plan or actor.
- Added owner reconciliation/expiration of provider checkout sessions and explicit refresh of the current subscription. Paid entitlement requires an active subscription, supported single-plan price/currency, a matching paid invoice line and a current billing period. The subscription screen displays billing request outcomes and errors; returning from checkout never grants a paid plan.
- Older subscription-list/create APIs now require a current platform administrator. Direct paid-plan creation is rejected, newly created profiles remain unlisted, and billing history cannot be deleted through the legacy endpoint. Owner/manager reads recheck current active accounts.
- Fixed refund ownership lookup to reject a foreign payment before accessing provider credentials. Remaining POS/refund integrity is still being implemented; this checkpoint does not establish full checkout acceptance.
- Startup no longer requires AI credentials, preserves existing role-account passwords, limits seeding to the explicit demo-data setting, and builds the current code by default. BeautyHQ authentication cookies are namespaced to avoid collisions with the other local apps.

Verification: 82 unit tests passed, 14 PostgreSQL integration tests passed in separately isolated disposable schemas, TypeScript and production build passed. The new billing scenario covers an accepted checkout followed by a simulated network timeout, recovery without a second create, paid-invoice requirements, repeat reconciliation, wrong-customer receipts and owner revocation. Both disposable schemas were removed. Authenticated browser reads/rendering passed for subscription, timesheets, purchasing, AI and provider settings; anonymous private reads returned 401. Subscription and purchasing screenshots were inspected. The production-mode local server was restarted on its configured ports.

Migration `20260906020000_business_billing_attempts` was applied after private backup `/Users/erolakarsu/.codex/backups/beautyhqio/before-billing-1788717219137.dump`; the backup archive catalog was checked. No provider billing, charges, refunds, messages or AI calls were performed. Real provider acceptance, full POS/refund and delivery reconciliation, remaining tenant/role paths and the broad release/device backlog are still unfinished.

### POS payment integrity checkpoint — September 6

- Replaced the broken legacy POS submission with saved, reviewed sales using current catalog prices, exact cents/tax calculations, manager-reviewed tax settings, manager discount/price reasons and atomic tracked-stock reservations. Unpaid voids release reserved stock once; sales and receipts retain history.
- Added partial cash and gift-card payments, explicit cash received/change, original-tender partial/full refunds and gift-card balance restoration. Verified payment rows are append-only. Legacy unverified receipts cannot enter this refund flow.
- Added persistent salon Stripe checkout attempts, stable provider retry keys, uncertain-outcome holds, current-state retry recovery, explicit reconciliation/expiration, signed checkout/refund callbacks, amount/currency/reference checks and duplicate callback protection. Paid callback receipts, rather than browser returns, settle card sales. Changing Stripe credentials is blocked while payments/refunds need reconciliation; existing verified receipts require an account migration before credential replacement.
- Added POS screens for drafts, review, payments, refunds and reconciliation, plus completed-appointment service import. Appointments containing add-ons require separate manager pricing; automatic add-on import is not implemented. Old direct charge/confirmation endpoints no longer accept arbitrary client amounts or mark sales paid without this receipt flow.
- Validation: 82 unit tests passed; 20 PostgreSQL integration tests passed across three disposable schemas (6 POS, 6 operations/billing, 8 booking). POS coverage includes exact discounted tax, concurrent stock, stale versions, tenant/staff boundaries, split cash/gift payment, refund caps, receipt immutability, unknown checkout recovery and genuine Stripe SDK signature checks with local fixtures. TypeScript and production build passed. Restarted the local application; authenticated POS/API rendering and anonymous denial passed, and the POS screenshot was visually inspected.
- Applied additive migration `20260906030000_sales_integrity` after a private database backup at `/Users/erolakarsu/.codex/backups/beautyhqio/before-billing-1788718219604.dump`. This is a backup verification, not a restore rehearsal.
- Remaining sales scope includes cash-drawer closeout, loyalty tender/earning in this POS, commission/tip payroll allocation, packages/deposits, merchandise return/restocking workflows, polished receipt export, hardware acceptance and real Stripe test-account acceptance. No actual charges, refunds or messages were sent. The full feature backlog remains incomplete.

### Full restore rehearsal — September 6

A fresh private custom-format PostgreSQL backup was restored into a disposable local database. Every public table was read, schema constraints were restored, and the restored database had zero invalid indexes. The disposable database was removed afterward. The backup is retained under `/Users/erolakarsu/.codex/backups/` in this project's directory as `restore-verified-*.dump` with owner-only file permissions. This supersedes the earlier archive-catalog-only checkpoint.

`npm run test:restore` repeats the backup and restore rehearsal against the configured local database. This verifies local restoration; off-site storage, retention scheduling, production disaster recovery and broader release acceptance remain separate work.

### Cash drawer closeout checkpoint — September 6

- Added `/cash-drawer` for one shared USD drawer per location, with actual opening balance, confirmed cash additions/withdrawals, physical count, manager review and approved CSV export.
- The initial baseline records which existing verified cash receipts/refunds are already included in the opening count. Later sessions carry forward the last approved physical count. Receipt identities are allocated once under the business transaction lock; cash activity after a submitted count, including between sessions, is picked up by the next session. This avoids timestamp precision/timezone differences in older receipt records affecting financial allocation.
- Expected cash includes verified CASH-source payments, successful original-cash refunds and recorded drawer movements. Card/gift-card and unverified historical payments are excluded. Cash received minus change is represented by the existing verified net payment amount. Counts reject changed receipt evidence or stale versions.
- Submitted counts freeze their evidence. Any variance requires review by a different owner/manager from the counter. Closed sessions, cash movements and allocation history are protected against updates/deletion in PostgreSQL. Current business role checks apply before replaying drawer mutation receipts.

Validation: **82 unit tests and 23 PostgreSQL integration scenarios passed**, including three new cash-drawer scenarios. Coverage includes concurrent opening, exact net receipts/refunds, late receipt carry-forward, stale count rejection, independent variance approval, cross-business/current-account checks, replay and append-only history. Type checking, focused lint and production build passed. An isolated production browser journey passed opening, recording a cash movement, submitting the count, approval, CSV download and anonymous API privacy. Screenshots were inspected. No physical cash, provider charges or real business drawer records were changed by these tests.

Applied additive migration `20260906050000_cash_closeout` after private backup `~/.codex/backups/beautyhqio/before-cash-closeout-1788725032039.dump`. Remaining major sales/staff scope includes POS loyalty integration, packages/deposits, commission/tip allocation and payroll exports, merchandise return/restocking, receipt presentation and device/provider acceptance. This drawer workflow does not operate drawer hardware, make bank deposits or calculate payroll.

After the closeout migration and restart, fresh owner login, nine authenticated API reads and six business pages passed the local browser smoke, including Cash drawer, POS and subscription. Anonymous drawer/sales/billing/connection requests remained protected; no real business writes or provider calls were performed.

A fresh full restore rehearsal after the latest schema changes passed: 98 public tables, 227 constraints, zero invalid indexes, and successful reads of every restored table. Temporary restore databases were removed; private verified archives remain under this project's backup directory.
