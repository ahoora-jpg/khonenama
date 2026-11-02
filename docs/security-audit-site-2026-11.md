# Security Audit — Khonenama Site — 2026-11

## Executive Summary

Scope was the main Khonenama site and its primary Worker. The independent SMS Worker, SMS database, `wrangler.sms.jsonc`, and `SMS_SERVICE` architecture were excluded from implementation changes. No production deploy or merge was performed by this audit.

The site already had meaningful controls: HTTPS redirect, HSTS, baseline security headers, same-origin mutation checks, request-size limits, parameterized D1 access, hashed business sessions, PBKDF2 password hashes, reset-token hashing, payment-side validation, and protected business media routes.

The highest remaining operational risk is GitHub `main` protection: the connected GitHub integration cannot read or set repository-administration settings, so this must be enabled by a repository owner. CSP is now introduced in report-only mode because the current framework output and Image Rescue use inline scripts; enforcing it before nonce-compatible migration could break the site.

## Scope

- `ahoora-jpg/khonenama`, baseline `ecfe6844a5ecaf19ae1a1318d9c68c23516d5c7f`.
- Main site Worker and site D1 only.
- Non-destructive production checks only, except explicitly approved removal of test businesses and enabling Cloudflare Always Use HTTPS.

## Existing Controls

- HTTPS redirect, HSTS, `nosniff`, frame denial, referrer and permissions policies.
- Same-origin and `Sec-Fetch-Site` checks before mutation routes in the request gate.
- Request-body limits and path-specific request limiting.
- PBKDF2-HMAC-SHA-256 password storage with random salt, business session token hashing, reset token hashing, one-time 15-minute recovery, and session revocation on reset.
- Server-calculated payment pricing and payment callback checks.
- Authenticated ownership lookup for `/api/me/business/*` media and business operations.
- Media size/type limits, provider-side reprocessing, controlled storage paths, and `nosniff` media delivery.

## Critical Findings

No confirmed critical application vulnerability was found in the reviewed paths.

## High Findings

### GitHub main protection

- **Severity:** High
- **Location:** Repository settings
- **Risk:** Direct or unchecked updates to `main` can bypass CI.
- **Evidence:** GitHub branch-protection API read returned `403 Resource not accessible by integration`; earlier audit indicated no protection/ruleset.
- **Fix:** Pending repository-owner configuration: require pull requests and successful `CI`, block force-push and deletion, require up-to-date branch if supported; do not require an impossible self-approval rule for a single-owner repository.
- **Test:** Verify protection and ruleset with an owner credential after configuration.
- **Status:** Remaining operational action.

## Medium Findings

### CSP cannot safely be enforced yet

- **Severity:** Medium
- **Location:** `lib/request-security.ts`, `app/layout.tsx`
- **Risk:** The former minimal CSP did not constrain scripts/styles/connect sources.
- **Fix:** Added a full `Content-Security-Policy-Report-Only` policy without `unsafe-inline` or `unsafe-eval`. Existing enforced baseline remains in place.
- **Test:** Header test in `tools/test-security-hardening.mjs`.
- **Status:** Report-only. Collect browser violations, migrate Image Rescue/framework inline scripts to nonces or hashes, then enforce.

### Admin signing-secret coupling

- **Severity:** Medium
- **Location:** `lib/server/admin-session.ts`
- **Risk:** `ADMIN_ACCESS_KEY` previously both authenticated an administrator and signed cookies.
- **Fix:** Added `ADMIN_SESSION_SECRET` support. New cookies use it; legacy cookies remain valid only during their existing short lifetime.
- **Test:** Source and build checks.
- **Status:** Code complete. Set a distinct Cloudflare Worker secret before deployment; no secret value is in the repository.

### Password work factor and distributed guessing

- **Severity:** Medium
- **Location:** `lib/server/password.ts`, `app/api/auth/business/login/route.ts`
- **Risk:** The prior 100k PBKDF2 work factor and IP-only login limit provided less resistance to offline cracking and distributed account guessing.
- **Fix:** New hashes use PBKDF2-SHA-256 with 600k iterations; successful login progressively rehashes legacy passwords. Login limits now use independent hashed IP and hashed account keys.
- **Test:** `tools/test-security-hardening.mjs`, existing password recovery tests, build.
- **Status:** Fixed in branch; no bulk password migration is performed.

### Public health disclosure

- **Severity:** Medium
- **Location:** `/api/health/db`
- **Risk:** It disclosed database and provider configuration state.
- **Fix:** Public response now contains only `{ ok: boolean }`, is no-store and noindex.
- **Test:** Build and route inspection.
- **Status:** Fixed in branch.

### Centralized JSON-LD escaping

- **Severity:** Medium
- **Location:** `lib/safe-json-ld.ts` and all JSON-LD renderers
- **Risk:** Inconsistent `dangerouslySetInnerHTML` JSON serialization could permit script-context breakout when data becomes user-influenced.
- **Fix:** All JSON-LD scripts now use `safeJsonLd`, escaping `<`, `>`, `&`, U+2028, and U+2029.
- **Test:** `tools/test-security-hardening.mjs`.
- **Status:** Fixed in branch.

## Low Findings

- `npm audit --audit-level=high` has no high/critical result. It reports three moderate transitive `satori` findings through Vinext; the available automated fix requires a potentially breaking Vinext upgrade and was not applied blindly.
- Public CSP reporting does not yet have a production collector/retention dashboard.
- Central security-event logging and a documented restore drill are not yet complete.

## Authentication

Business passwords are length-bounded (8–128), salted and verified with constant-time comparison. Progressive rehash prevents plaintext migration. Recovery does not return account-existence information for valid-shaped requests and invalidates existing sessions on success.

## Authorization / IDOR

Reviewed `/api/me/business/*` media routes use the owned-business lookup, and public media delivery checks publication and owner pause state. Existing lifecycle, billing, gallery, and customer-safeguard tests remain part of CI. Full two-account black-box coverage for every mutation remains a follow-up test expansion.

## Sessions

Business session tokens are random and stored only as SHA-256 hashes; cookies are `HttpOnly`, `Secure`, and `SameSite=Lax`. Admin cookies are `HttpOnly`, `Secure`, and `SameSite=Strict`; signing-secret separation is implemented with short-lived compatibility verification.

## CSRF

The global request gate rejects cross-site API mutations using Origin and `Sec-Fetch-Site`; admin and business session helpers repeat this check. Existing no-Origin native/Bearer behavior remains supported.

## XSS

All reviewed JSON-LD uses the central serializer. The only remaining non-JSON `dangerouslySetInnerHTML` is the controlled local Image Rescue source, which is why the stronger CSP begins in report-only mode.

## SQL Injection

Reviewed D1 user input paths use `.bind(...)`. Dynamic fragments seen in the reviewed code are fixed application-owned fragments. Continue requiring allowlists for any future SQL fragment construction.

## Upload Security

The current path validates size/type and provider-processed media. SVG is not accepted. Follow-up: add pre-provider magic-byte/decode validation for every supported raster container and malformed/polyglot fixtures.

## Payment Security

Existing billing callback, activation, receipt, and duplicate handling tests remain in CI. No change was made to price or payment behavior.

## Admin Security

Admin APIs use admin-session checks and no-store responses. Admin credential/session-secret separation is implemented. Main-branch protection remains a repository setting action.

## Database

D1 queries reviewed use bound values. Expired password reset tokens and recovery limits are cleaned on recovery use; scheduled retention/restore-drill documentation remains a follow-up.

## Secrets

No secret value is included in this report or branch. `.env*` and `.dev.vars` are ignored. Local gitleaks/trufflehog binaries were unavailable; the attempted package wrapper was unavailable. A full-history scan with a trusted CI-installed scanner remains required before the next merge.

## Git History

Tracked-file checks found no committed environment files, private-key extensions, dumps, or credential-named artifacts. This is not a substitute for the pending full-history scanner.

## Dependencies

`npm audit --audit-level=high` completed without high or critical findings. Three moderate transitive findings remain as described above.

## Cloudflare / TLS

- Zone active; certificate packs active for apex and wildcard names.
- TLS 1.2 minimum and TLS 1.3 enabled.
- Managed WAF and L7 DDoS rulesets present.
- **Changed:** `Always Use HTTPS` enabled on 2026-11-02.
- **Not changed:** Full → Full (strict), because the non-proxied external payment host needs its own origin-certificate compatibility confirmation. HSTS `includeSubDomains`/preload remains off because every external subdomain has not been verified.

## Security Headers / CSP

Baseline security headers are retained. COOP `same-origin` and report-only CSP were added. CSP enforcement is explicitly deferred pending nonce/hash migration and observed reports.

## Logging / Monitoring

Existing logging avoids password/reset-token output in reviewed paths. Add a retention-bounded, privacy-minimized security-event store for failed logins, rate limits, authorization failures, CSRF rejection, suspicious upload, and payment mismatch as a dedicated follow-up.

## Tests

- `tools/test-security-hardening.mjs`
- Existing request-security, password-recovery, gallery, payment, lifecycle, and customer-safeguard test suites in CI.
- TypeScript and Vinext production build must pass before PR creation.

## Remaining Risks

1. GitHub protection/ruleset needs repository-owner administration permission.
2. CSP is report-only until inline script nonce/hash migration is verified.
3. Full gitleaks/trufflehog history scan and automated secret scanning remain pending tool installation/CI integration.
4. Full two-account IDOR matrix, upload magic-byte fixtures, security-event retention, and restore drill need dedicated completion.
5. Full (strict) requires external payment-origin certificate confirmation.

## Follow-up

After deployment to a staging-compatible environment: collect CSP reports, set `ADMIN_SESSION_SECRET` in Cloudflare, verify legacy admin cookie migration, run two-account API authorization tests, install CI secret scanning, enable GitHub protection, and only then consider CSP enforcement.
