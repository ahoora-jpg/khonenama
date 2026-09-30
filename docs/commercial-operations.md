# Commercial operations

Real checkout is disabled. Paid plan prices are unset. Invoice/payment tables and the activation helper do not constitute an implemented payment gateway. Choose the revenue model and provider before implementing a callback. Validate ownership, server-side price/currency, retry keys, verification, concurrent callback activation, reconciliation and refunds before enabling payments.

`GET /api/admin/readiness` requires the existing admin cookie. It reports schema/configuration prerequisites without secret values or customer records. A successful response means the diagnostic completed, not that commerce is ready. External/legal approvals remain unverified.

Reading the dashboard no longer publishes draft/pending profiles. Registration currently publishes unverified profiles; publication and verification are distinct. Define moderation policy before scaling supply.

## Encrypted backup

The manual `Encrypted D1 Backup` workflow requires `CLOUDFLARE_API_TOKEN` with D1 export permission and a separate `D1_BACKUP_PASSPHRASE` GitHub Actions secret of at least 32 characters. Use a randomly generated secret and keep a recovery copy outside GitHub in an owner-controlled password manager. Never paste it in chat or commit it.

SQL is encrypted with GPG AES256 before artifact upload; temporary plaintext is removed on exit. The encrypted artifact is retained for seven days. Retain approved recovery copies in durable owner-controlled storage. This is not yet a recurring backup service and does not back up ImageKit files.

For a recovery drill, check SHA256SUMS, decrypt privately and import into an isolated test D1 database using current Wrangler documentation. Verify row counts, foreign keys, login, profile access, lead ownership and media references. Record recovery point and elapsed time. Do not test by importing over production.

Adding the workflow does not confirm a successful backup or restore. Payment launch also requires verified recovery and media retention.

## Measurement

Track valid leads separately from clicks, offers and verified orders. Maintain city/category cohorts, response times, reported outcomes, complaints, retention, acquisition costs and service costs. Expand after coverage, reliable responses and unit economics are demonstrated. GA4 linkage, abuse protection and order outcome measurement remain separate work items.
