# Laravel Website Security Audit Checklist
**For:** Kilo Code / Kilo Agent  
**Purpose:** Conduct a comprehensive, evidence-based security audit of a Laravel application without damaging data, disrupting service, or changing production behavior.

> **Operating rule:** Audit first, remediate only when explicitly authorized. Do not run destructive, intrusive, load, brute-force, denial-of-service, data-modifying, or externally targeted tests against production. Prefer a local or staging environment with sanitized data. Obtain explicit authorization and a rollback plan before any change.

---

## 0. Audit setup, scope, and safety

- [ ] Identify the Laravel application root and confirm this is the intended repository.
- [ ] Record the current Git branch, commit hash, and working-tree status.
- [ ] Identify Laravel, PHP, Composer, Node, database, web-server, and operating-system versions.
- [ ] Identify the deployment model: shared hosting, VPS, container, managed platform, or other.
- [ ] Identify environments available: local, test, staging, production.
- [ ] Confirm the authorized audit scope: application, APIs, admin panel, subdomains, integrations, storage, infrastructure.
- [ ] Do not scan or test domains, IP addresses, services, or third-party systems outside the explicitly authorized scope.
- [ ] Do not expose, copy, print, or commit secrets, personal data, access tokens, or production database contents.
- [ ] Never include secret values in audit reports. Refer to variable names or redact values.
- [ ] Do not run migrations, seeders, queue workers, cache-clearing commands, or deployment scripts against production as part of an audit unless specifically approved.
- [ ] Do not modify files, dependencies, configuration, database records, permissions, or server settings during the assessment unless remediation is explicitly requested.
- [ ] Use read-only inspection wherever possible.
- [ ] If a test could send email/SMS, charge a payment method, publish content, delete records, trigger a webhook, or affect a real user, do not run it without approval.
- [ ] Establish a safe test account and sanitized test data for authenticated testing.
- [ ] Record any assumptions, unavailable systems, and checks that could not be completed.

## 1. Repository and dependency security

### Composer / PHP dependencies
- [ ] Inspect `composer.json` and `composer.lock`.
- [ ] Check for abandoned, unmaintained, vulnerable, or suspicious Composer packages.
- [ ] Run `composer audit` in a safe environment and record all findings.
- [ ] Check whether Laravel and supported packages are on maintained versions.
- [ ] Identify direct and transitive dependencies with known security advisories.
- [ ] Check for packages loaded from untrusted repositories, custom VCS sources, or unpinned branches.
- [ ] Check whether production dependencies are installed with appropriate production settings.
- [ ] Check whether development-only packages or debugging tools are exposed in production.
- [ ] Review custom Composer scripts and plugins for unexpected execution behavior.
- [ ] Check PHP version compatibility and whether the deployed PHP version receives security updates.

### JavaScript / frontend dependencies
- [ ] Inspect `package.json` and the lockfile (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`).
- [ ] Run the appropriate package-manager audit command in a safe environment.
- [ ] Check for vulnerable, abandoned, or unnecessary frontend packages.
- [ ] Review install scripts and packages that execute code during installation.
- [ ] Check whether dependencies are pinned reproducibly through a committed lockfile.
- [ ] Ensure source maps do not expose secrets or sensitive internal source in production.
- [ ] Check whether third-party scripts are necessary and trustworthy.

### Repository hygiene
- [ ] Confirm `.env`, private keys, certificates, credentials, dumps, backups, and logs are excluded from Git.
- [ ] Search Git history for accidentally committed secrets; do not print secret values in the report.
- [ ] Check for hard-coded credentials, API keys, tokens, private URLs, and encryption keys.
- [ ] Check that `.env.example` contains placeholders only.
- [ ] Inspect `.gitignore` for appropriate exclusions.
- [ ] Check for abandoned debug files, test endpoints, temporary scripts, and database dumps.
- [ ] Check that sensitive files are not stored in publicly served directories.

## 2. Laravel configuration and environment

- [ ] Confirm production uses `APP_ENV=production`.
- [ ] Confirm production uses `APP_DEBUG=false`.
- [ ] Confirm `APP_KEY` is present, strong, private, and not committed to source control.
- [ ] Do not generate or rotate `APP_KEY` during the audit; doing so can invalidate encrypted data and sessions.
- [ ] Check that production configuration is not accidentally using local or testing settings.
- [ ] Review `config/app.php`, `config/auth.php`, `config/session.php`, `config/cors.php`, `config/filesystems.php`, `config/mail.php`, `config/queue.php`, `config/logging.php`, and relevant custom config.
- [ ] Check for insecure default credentials or permissive fallback configuration.
- [ ] Check that secrets are supplied through protected environment variables or a secrets manager.
- [ ] Check that secrets are not exposed through frontend build variables (for example, `VITE_*` values).
- [ ] Confirm configuration caching does not result in stale or incorrect production settings.
- [ ] Check that exception pages and error responses do not reveal stack traces, file paths, SQL, environment values, or framework internals.
- [ ] Check that logs do not record passwords, session IDs, authorization headers, tokens, payment data, or unnecessary personal information.
- [ ] Check that log files are not publicly accessible.
- [ ] Check that maintenance mode and health/debug endpoints do not disclose sensitive information.

## 3. Authentication and account security

- [ ] Identify every authentication entry point: web login, API login, admin login, mobile clients, OAuth/SSO, passwordless login.
- [ ] Verify passwords are hashed using Laravel's supported secure hashing configuration (Argon2id or appropriately configured bcrypt).
- [ ] Confirm plaintext passwords are never stored, logged, emailed, or returned by APIs.
- [ ] Check password policy and whether it is appropriate to the application’s risk.
- [ ] Check login throttling and resistance to automated credential stuffing.
- [ ] Check whether login responses avoid revealing whether an email/username exists.
- [ ] Verify session IDs are regenerated after successful authentication and privilege changes.
- [ ] Check logout invalidates the session and rotates/invalidates relevant tokens as appropriate.
- [ ] Check password reset tokens are random, time-limited, single-use, and safely stored.
- [ ] Verify password reset responses do not reveal account existence.
- [ ] Check reset links use the correct trusted HTTPS host and cannot be redirected to attacker-controlled hosts.
- [ ] Check that changing an email address requires appropriate verification.
- [ ] Check whether sensitive account changes require current-password or step-up verification.
- [ ] Check multi-factor authentication availability and enforcement for privileged accounts where appropriate.
- [ ] Check recovery codes and MFA reset flows for abuse.
- [ ] Check remember-me functionality and persistent token handling.
- [ ] Check account lockout or throttling behavior without attempting real brute-force attacks.
- [ ] Check inactive, disabled, suspended, and deleted accounts cannot authenticate.
- [ ] Check that admin accounts use stronger authentication controls where supported.
- [ ] Check for default, shared, demo, or test accounts in production.

## 4. Authorization, roles, and access control

- [ ] Inventory roles, permissions, policies, gates, middleware, and ownership rules.
- [ ] Map sensitive actions to the authorization rule that protects them.
- [ ] Verify authorization is enforced server-side, not only by hiding frontend buttons or routes.
- [ ] Check every controller action and API endpoint for the correct authorization check.
- [ ] Check for insecure direct object references (IDOR/BOLA): users must not access another user's records by changing an ID, UUID, slug, or request parameter.
- [ ] Check tenant, organization, department, and account boundaries wherever multi-tenancy exists.
- [ ] Verify users cannot assign themselves roles, permissions, ownership, status, or approval fields.
- [ ] Verify ordinary users cannot access admin, staff, moderator, or internal functions.
- [ ] Check privilege escalation through mass assignment, request parameters, nested objects, or role-management endpoints.
- [ ] Check that authorization is applied to exports, downloads, reports, search results, and background jobs—not just detail pages.
- [ ] Check that deleted, archived, or soft-deleted records follow intended access rules.
- [ ] Check policy behavior for list, view, create, update, delete, restore, force-delete, and bulk actions.
- [ ] Check that API tokens are limited by abilities/scopes and cannot perform unintended actions.
- [ ] Check that revoked, expired, or disabled tokens are rejected.
- [ ] Check that administrative actions are auditable.

## 5. Input validation and data handling

- [ ] Inventory all user-controlled input: route parameters, query strings, form fields, headers, cookies, uploaded files, API payloads, and webhook bodies.
- [ ] Verify Laravel Form Requests or equivalent server-side validation are used consistently.
- [ ] Validate type, length, format, range, allowed values, and ownership for each field.
- [ ] Use allowlists for enumerations, sort columns, filter fields, and dynamic options.
- [ ] Never trust client-supplied user IDs, role IDs, prices, totals, approval states, or ownership fields.
- [ ] Check mass-assignment protection in Eloquent models (`$fillable` / `$guarded`).
- [ ] Ensure sensitive fields are excluded from serialization and API responses.
- [ ] Check for SQL injection in raw queries, `DB::raw`, dynamic `orderBy`, search filters, and custom query builders.
- [ ] Use parameter binding; never concatenate untrusted input into SQL.
- [ ] Check for command injection in shell/process execution and avoid passing user input to commands.
- [ ] Check for server-side template injection in user-controlled Blade/template content.
- [ ] Check for path traversal in file paths, exports, imports, and download endpoints.
- [ ] Check for unsafe deserialization or unserialization of untrusted data.
- [ ] Check for unsafe dynamic class names, method names, or file includes derived from user input.
- [ ] Check for regular-expression denial-of-service risks in custom validation or parsing patterns.
- [ ] Check numeric boundaries, decimal precision, negative values, overflow, and currency calculations.
- [ ] Check date/time parsing, timezone assumptions, and date-range validation.
- [ ] Check that HTML or rich-text input is sanitized according to the allowed content model.

## 6. Cross-site scripting (XSS) and browser security

- [ ] Review Blade templates for unescaped output (`{!! !!}`) and verify every use is intentional and safely sanitized.
- [ ] Prefer escaped Blade output (`{{ }}`) for untrusted text.
- [ ] Check JavaScript-rendered content for unsafe `innerHTML`, `document.write`, and unsafe DOM insertion.
- [ ] Check rich-text editors and user-generated HTML for robust sanitization.
- [ ] Check URL, attribute, CSS, and JavaScript contexts for context-appropriate encoding.
- [ ] Check that user-controlled values are not inserted into inline scripts without safe serialization.
- [ ] Review Content Security Policy (CSP); identify whether it is absent, overly permissive, or weakened by broad `unsafe-inline` / `unsafe-eval` allowances.
- [ ] Check `X-Content-Type-Options: nosniff`.
- [ ] Check clickjacking protection through CSP `frame-ancestors` or suitable `X-Frame-Options`.
- [ ] Check `Referrer-Policy`.
- [ ] Check `Permissions-Policy`.
- [ ] Check cookie security attributes: `Secure`, `HttpOnly`, and appropriate `SameSite`.
- [ ] Check that HTTPS is enforced and HTTP redirects to HTTPS.
- [ ] Check HSTS configuration only where HTTPS is correctly deployed across the intended host scope.
- [ ] Check for mixed content and insecure external resources.
- [ ] Check third-party scripts for integrity controls (SRI) where applicable.

## 7. CSRF, CORS, and HTTP method handling

- [ ] Verify state-changing browser routes use Laravel CSRF protection.
- [ ] Check that CSRF middleware has not been broadly disabled or bypassed.
- [ ] Check every CSRF exception and confirm it is limited to routes that genuinely require it, such as validated webhook endpoints.
- [ ] Verify state-changing actions do not use GET requests.
- [ ] Check CORS allowed origins, methods, and headers are narrowly scoped.
- [ ] Do not combine wildcard origins with credentialed CORS requests.
- [ ] Check preflight handling and ensure CORS is not treated as authentication or authorization.
- [ ] Check that API endpoints reject unsupported HTTP methods.
- [ ] Check method override behavior and ensure it cannot bypass authorization or validation.

## 8. Session and cookie security

- [ ] Check production session storage is appropriate and access-controlled.
- [ ] Check session cookie name, domain, path, lifetime, and security flags.
- [ ] Confirm session cookies are `Secure` under HTTPS and `HttpOnly`.
- [ ] Set an appropriate `SameSite` policy based on application flows.
- [ ] Check session fixation protection and session regeneration.
- [ ] Check idle and absolute session expiration requirements.
- [ ] Check session invalidation after password changes, account suspension, and privilege changes.
- [ ] Check concurrent-session behavior if relevant.
- [ ] Check that session data does not contain unnecessary secrets or excessive personal data.
- [ ] Check shared-cache behavior to ensure authenticated pages are not served to other users.

## 9. File uploads, storage, and downloads

- [ ] Inventory every upload endpoint and accepted file type.
- [ ] Validate file size, extension, MIME type, and actual file content; do not rely on the filename or browser-provided MIME type.
- [ ] Use an allowlist of necessary file types.
- [ ] Generate server-side filenames; do not trust user-supplied paths or filenames.
- [ ] Prevent executable uploads and script execution in upload directories.
- [ ] Store private files outside the public web root or on private object storage.
- [ ] Check public storage symlinks and ensure only intentionally public files are exposed.
- [ ] Check uploaded SVG, HTML, XML, PDF, office, and image files for active-content risks relevant to the application.
- [ ] Consider malware scanning and image/document re-encoding where the risk warrants it.
- [ ] Check archive extraction for path traversal, symlink abuse, and decompression bombs.
- [ ] Check that file downloads enforce authorization and ownership.
- [ ] Check `Content-Disposition`, content type, and `nosniff` behavior for downloads.
- [ ] Check temporary download URLs for short expiry and appropriate access restrictions.
- [ ] Check that deleting a record also handles associated files according to retention requirements.
- [ ] Check backups, exports, and generated reports are not publicly accessible.

## 10. Database security and privacy

- [ ] Check production database credentials are not committed or exposed.
- [ ] Check the database account uses least privilege.
- [ ] Confirm the application does not connect as a database superuser/root account.
- [ ] Check database network access is restricted to required hosts/services.
- [ ] Check database connections use TLS where appropriate and supported.
- [ ] Check sensitive fields are encrypted at rest where required by the threat model.
- [ ] Check encryption keys are stored separately from encrypted data.
- [ ] Check database backups are encrypted, access-controlled, and retained appropriately.
- [ ] Check backups cannot be downloaded through public routes or web directories.
- [ ] Check production data is not copied into development environments without sanitization and authorization.
- [ ] Check retention, deletion, anonymization, and export workflows for personal data.
- [ ] Check database migrations do not unintentionally weaken constraints or expose sensitive columns.
- [ ] Check foreign keys, unique constraints, and transactional integrity for security-sensitive operations.
- [ ] Check audit logs for tamper resistance and sensitive-data minimization.
- [ ] Check SQL query logging and error reporting do not leak personal or secret data.

## 11. API security

- [ ] Inventory API routes and document authentication requirements.
- [ ] Check every endpoint for authentication and object-level authorization.
- [ ] Check API rate limits for login, password reset, search, OTP, expensive operations, and public endpoints.
- [ ] Check request size limits and pagination limits.
- [ ] Check API validation and response schemas.
- [ ] Check mass assignment and excessive data exposure in JSON responses.
- [ ] Check API resource serialization does not reveal internal fields, secrets, or unrelated relationships.
- [ ] Check token storage, expiry, revocation, rotation, and scope/ability restrictions.
- [ ] Check API versioning and deprecated endpoints.
- [ ] Check GraphQL endpoints, if present, for authorization, query depth/complexity limits, introspection policy, and batching abuse.
- [ ] Check webhook signatures, timestamp validation, replay protection, and idempotency.
- [ ] Check webhook endpoints cannot be abused to trigger arbitrary internal actions.
- [ ] Check API error messages do not reveal stack traces or internal implementation details.
- [ ] Check pagination and filtering cannot be abused to enumerate sensitive records.

## 12. Business logic and workflow abuse

- [ ] Map critical workflows: registration, approval, payment, order processing, booking, publishing, account changes, and administration.
- [ ] Check whether steps can be skipped by calling endpoints directly.
- [ ] Check whether users can repeat one-time actions or replay requests.
- [ ] Check race conditions in balances, inventory, quotas, approvals, coupon use, and one-time tokens.
- [ ] Check financial calculations are performed server-side.
- [ ] Check price, discount, tax, quantity, and payment status cannot be trusted from the client.
- [ ] Check payment confirmation is verified server-to-server with the payment provider.
- [ ] Check webhook and callback processing is authenticated and idempotent.
- [ ] Check approval and moderation workflows enforce separation of duties where required.
- [ ] Check bulk actions enforce per-record authorization.
- [ ] Check status transitions follow an explicit server-side state machine or equivalent rules.
- [ ] Check that cancelled, refunded, expired, or rejected operations cannot be improperly revived.
- [ ] Check referral, invitation, coupon, reward, and free-trial mechanisms for abuse.
- [ ] Check business-critical actions are logged with actor, timestamp, target, and outcome.

## 13. SSRF, redirects, and outbound requests

- [ ] Inventory features that fetch remote URLs, import remote images, call external APIs, or accept callback URLs.
- [ ] Check URL allowlisting and reject unexpected schemes, hosts, ports, and IP ranges.
- [ ] Prevent requests to loopback, private, link-local, and cloud metadata addresses unless explicitly required and safely controlled.
- [ ] Check DNS rebinding and redirect-following behavior in URL fetch features.
- [ ] Apply connection/read timeouts and response-size limits to outbound requests.
- [ ] Check redirects cannot send users to untrusted destinations after login or other sensitive actions.
- [ ] Check email links and generated URLs use a trusted configured application host, not an untrusted `Host` header.
- [ ] Check outbound integrations do not leak credentials to attacker-controlled destinations.

## 14. Email, notifications, queues, and scheduled tasks

- [ ] Check mail credentials and provider API keys are protected.
- [ ] Check email templates safely escape user-controlled values.
- [ ] Check password reset, invitation, and verification emails cannot be abused for spam or account enumeration.
- [ ] Check notification preferences and recipient authorization.
- [ ] Check queued jobs re-check authorization and record ownership when they execute.
- [ ] Check jobs do not trust serialized client-controlled data for privileged actions.
- [ ] Check queue dashboards and worker controls are protected.
- [ ] Check failed-job records do not expose secrets or personal data.
- [ ] Check scheduled commands and task endpoints are not publicly triggerable without authorization.
- [ ] Check job retries and idempotency for payment, email, and other side-effecting operations.
- [ ] Check queue payloads and failed-job storage are access-controlled.

## 15. Admin panel and operational interfaces

- [ ] Inventory admin routes, dashboards, management panels, debug tools, and internal endpoints.
- [ ] Verify strong authentication and role-based authorization for all admin functions.
- [ ] Check admin creation, role assignment, and privilege changes.
- [ ] Check admin actions for CSRF, validation, authorization, and audit logging.
- [ ] Check user impersonation features, if present, for strict authorization and visible audit trails.
- [ ] Check exports, bulk deletion, imports, and configuration changes for confirmation and authorization.
- [ ] Check admin search and filters for injection and data leakage.
- [ ] Check development tools such as Telescope, Debugbar, Ignition, Horizon, and database managers are not publicly exposed without strong protection.
- [ ] Check internal status pages and health endpoints disclose only necessary information.
- [ ] Check there are no undocumented maintenance, diagnostic, or backdoor routes.

## 16. Web server, hosting, and deployment

- [ ] Confirm the web server document root points to Laravel's `public/` directory only.
- [ ] Confirm `.env`, source code, vendor files, storage, logs, backups, and Git metadata cannot be fetched over HTTP.
- [ ] Check directory listing is disabled.
- [ ] Check server rules deny access to dotfiles and sensitive extensions.
- [ ] Check PHP execution is disabled in user-uploaded and other non-code directories.
- [ ] Check file and directory permissions follow least privilege.
- [ ] Confirm the application does not need world-writable permissions.
- [ ] Check `storage/` and `bootstrap/cache/` are writable only by the required deployment/runtime user.
- [ ] Check SSH, hosting control panel, database administration, and deployment access are restricted.
- [ ] Check production uses HTTPS with a valid certificate and renewal process.
- [ ] Check TLS configuration and disable obsolete protocols/ciphers where controllable.
- [ ] Check security headers at the web-server/proxy layer as well as application middleware.
- [ ] Check reverse-proxy trusted-host and trusted-proxy configuration.
- [ ] Check host-header handling and canonical URL configuration.
- [ ] Check production error pages and server banners do not disclose unnecessary version details.
- [ ] Check firewall rules expose only required services.
- [ ] Check backups are stored separately, access-controlled, and periodically restore-tested.
- [ ] Check deployment scripts do not print secrets or expose environment files.
- [ ] Check deployment runs with least privilege and does not run as root unnecessarily.
- [ ] Check release deployments are atomic or have a documented rollback procedure.
- [ ] Check dependency installation and build steps are reproducible.
- [ ] Check CI/CD secrets are scoped and protected; review workflow permissions and untrusted pull-request execution.
- [ ] Check production environment files are not overwritten by deployment automation.
- [ ] Check old releases, temporary archives, and abandoned deployment directories are not web-accessible.

## 17. Logging, monitoring, and incident readiness

- [ ] Check security-relevant events are logged: authentication failures, password resets, permission changes, admin actions, token revocation, and sensitive exports.
- [ ] Check logs include useful timestamps and actor/context identifiers without recording secrets.
- [ ] Check logs are protected from public access and unauthorized modification.
- [ ] Check log retention and rotation.
- [ ] Check alerting for repeated login failures, suspicious privilege changes, abnormal exports, and unexpected application errors.
- [ ] Check monitoring does not expose sensitive request bodies, cookies, headers, or environment values.
- [ ] Check an incident-response contact/process exists.
- [ ] Check credentials and keys can be rotated through a documented process.
- [ ] Check backup restoration and recovery procedures are documented and tested.
- [ ] Check audit logs cannot be altered by ordinary users or the actors whose actions they record.

## 18. Laravel-specific code review targets

Inspect the following areas where they exist:

- [ ] `routes/web.php`, `routes/api.php`, and custom route files.
- [ ] `app/Http/Controllers/` and any invokable controllers.
- [ ] `app/Http/Middleware/`.
- [ ] `app/Http/Requests/`.
- [ ] `app/Policies/`, gates, and authorization providers.
- [ ] `app/Models/` for mass assignment, casts, hidden fields, scopes, and relationships.
- [ ] `app/Providers/` for service bindings and authorization setup.
- [ ] `app/Exceptions/` or exception rendering configuration.
- [ ] `bootstrap/app.php` and middleware registration for the installed Laravel version.
- [ ] `config/` for security-sensitive configuration.
- [ ] `resources/views/` for Blade output and unsafe HTML.
- [ ] `resources/js/` and frontend source for DOM XSS and exposed secrets.
- [ ] `database/migrations/` and seeders for schema and default-account risks.
- [ ] `app/Jobs/`, `app/Console/`, events, listeners, notifications, and mailables.
- [ ] `app/Http/Resources/` and API transformers for excessive data exposure.
- [ ] Custom service classes, repositories, helpers, traits, and packages.
- [ ] Tests for authentication, authorization, validation, and security-sensitive workflows.

## 19. Automated checks and safe test execution

Run only commands appropriate to the project's installed tooling and environment. First inspect scripts and configuration; do not assume a command exists.

- [ ] Record PHP and Laravel versions (`php -v`, `php artisan --version`).
- [ ] Run `composer validate --no-check-publish` where appropriate.
- [ ] Run `composer audit` in a safe environment.
- [ ] Run the project's existing test suite in a dedicated test environment.
- [ ] Run the project's configured static analysis tools, if present (for example, PHPStan or Larastan).
- [ ] Run the project's configured code-quality and lint tools, if present.
- [ ] Run the appropriate JavaScript dependency audit command.
- [ ] Review route registration (`php artisan route:list`) and identify unprotected or unexpectedly exposed routes.
- [ ] Review scheduled tasks (`php artisan schedule:list`) if supported by the installed version.
- [ ] Review middleware assignments and route groups.
- [ ] Use a reputable SAST tool if available and authorized.
- [ ] Use a dependency scanner and secret scanner on the repository and, where practical, Git history.
- [ ] If dynamic testing is authorized, use a staging environment and a non-destructive test plan.
- [ ] Do not run brute-force, fuzzing at high volume, load testing, destructive payloads, exploit chains, or intrusive scanners against production.
- [ ] Do not test real users' accounts or access real users' private records.
- [ ] Preserve test output and tool versions so findings can be reproduced.

## 20. Security test cases to add or verify

Use isolated test users and records. Tests must assert denial as well as successful authorized access.

- [ ] Unauthenticated users cannot access authenticated pages or APIs.
- [ ] Authenticated users cannot access admin-only routes.
- [ ] A user cannot view, update, delete, export, or download another user's record.
- [ ] A user cannot cross tenant or organization boundaries.
- [ ] Users cannot modify protected fields such as role, owner ID, approval status, or account balance.
- [ ] Invalid or expired password reset tokens are rejected.
- [ ] Login and password reset throttling works.
- [ ] CSRF protection applies to state-changing web requests.
- [ ] Validation rejects unexpected types, oversized values, and invalid enum values.
- [ ] SQL-sensitive filters and sorting inputs cannot alter query structure.
- [ ] Stored and reflected XSS payloads are rendered as inert text or safely sanitized.
- [ ] Upload validation rejects disallowed, oversized, or mismatched file content.
- [ ] Private files cannot be accessed without authorization.
- [ ] API responses omit passwords, tokens, internal flags, and unrelated private fields.
- [ ] Revoked and expired API tokens are rejected.
- [ ] Webhook requests with invalid signatures or replayed events are rejected.
- [ ] State-changing operations cannot be invoked through GET.
- [ ] Sensitive actions produce appropriate audit events.
- [ ] Error responses do not expose stack traces or secrets.

## 21. Finding severity and reporting

Classify each finding using a consistent risk model:

- **Critical:** Direct compromise of the application, server, privileged accounts, or highly sensitive data with severe impact and practical exploitability.
- **High:** Serious unauthorized access, privilege escalation, sensitive data exposure, or security-control bypass.
- **Medium:** Meaningful weakness with limited exploitability or impact, or a vulnerability requiring specific conditions.
- **Low:** Limited impact, defense-in-depth gap, or hardening issue.
- **Informational:** Observation, improvement opportunity, or item requiring confirmation.

For every finding, include:

- [ ] Unique finding ID.
- [ ] Title and severity.
- [ ] Affected file, route, component, configuration key, or service.
- [ ] Evidence: exact code location, safe command output, or reproducible test result.
- [ ] Preconditions and required attacker privileges.
- [ ] Impact and realistic attack scenario.
- [ ] Reproduction steps that are safe and do not expose real data.
- [ ] Recommended remediation.
- [ ] Regression test that should be added.
- [ ] Confidence level: confirmed, likely, or needs validation.
- [ ] Whether the issue was verified in code, staging, or production configuration.
- [ ] Any compensating controls or limitations.

### Required final report structure

1. **Executive summary**
   - Overall security posture (qualitative; do not invent a numeric score).
   - Critical/high findings count.
   - Most important risks.
   - Scope and environments assessed.

2. **Scope and methodology**
   - Repository/commit audited.
   - Laravel/PHP versions.
   - Tools and commands used.
   - Files and systems inspected.
   - Tests not performed and why.

3. **Findings**
   - Ordered by severity.
   - Include evidence, impact, remediation, and regression test.

4. **Positive controls**
   - Security controls that were verified as working.

5. **Unverified areas**
   - Checks blocked by missing access, unavailable services, or lack of staging.

6. **Prioritized remediation plan**
   - Immediate: Critical and High.
   - Short term: Medium.
   - Planned hardening: Low and Informational.

7. **Appendix**
   - Safe command outputs, dependency audit summaries, route review notes, and test results.
   - Redact secrets and personal data.

## 22. Agent execution protocol

The agent must follow this sequence:

1. **Reconnaissance:** Inspect repository structure, versions, routes, configuration, dependencies, and deployment files.
2. **Threat modeling:** Identify assets, trust boundaries, user roles, entry points, sensitive workflows, and likely abuse cases.
3. **Static review:** Inspect Laravel code and configuration against this checklist.
4. **Automated checks:** Run safe, read-only dependency, static-analysis, and test commands where available.
5. **Controlled validation:** Verify suspected issues using isolated test data and staging only when authorized.
6. **Evidence collection:** Record precise file paths, line numbers, route names, test names, and sanitized outputs.
7. **Risk assessment:** Rate severity based on exploitability and business impact.
8. **Reporting:** Produce the final report and remediation plan.
9. **Stop:** Do not implement fixes unless the user explicitly asks for remediation.

### Mandatory agent constraints

- Do not claim a check passed unless it was actually performed and evidence supports the result.
- Mark each item **PASS**, **FAIL**, **NEEDS REVIEW**, or **NOT APPLICABLE**.
- Explain why any item is not applicable.
- Distinguish code-level findings from live-server verification.
- Never infer production settings solely from local `.env.example` or source defaults.
- Never reveal secret values in terminal output, chat, logs, screenshots, or reports.
- Never modify production data or configuration.
- Never disable security controls to make tests pass.
- Never silently change dependencies, lockfiles, migrations, or application code.
- Do not automatically fix findings during the audit.
- If an action is potentially disruptive or destructive, stop and request explicit approval.
- At completion, provide a concise prioritized summary and the full detailed report.

---

## Audit status tracker

| Area | Status | Notes / evidence |
|---|---|---|
| Scope and safety | NEEDS REVIEW | |
| Dependencies and repository hygiene | NEEDS REVIEW | |
| Laravel configuration | NEEDS REVIEW | |
| Authentication | NEEDS REVIEW | |
| Authorization and IDOR | NEEDS REVIEW | |
| Input validation and injection | NEEDS REVIEW | |
| XSS and browser security | NEEDS REVIEW | |
| CSRF and CORS | NEEDS REVIEW | |
| Sessions and cookies | NEEDS REVIEW | |
| File uploads and downloads | NEEDS REVIEW | |
| Database and privacy | NEEDS REVIEW | |
| API security | NEEDS REVIEW | |
| Business logic | NEEDS REVIEW | |
| SSRF and redirects | NEEDS REVIEW | |
| Email, queues, and scheduler | NEEDS REVIEW | |
| Admin panel | NEEDS REVIEW | |
| Hosting and deployment | NEEDS REVIEW | |
| Logging and incident readiness | NEEDS REVIEW | |
| Automated checks and tests | NEEDS REVIEW | |
| Final report | NOT STARTED | |

**Audit completion rule:** The audit is complete only when every applicable checklist item has a status, every finding has evidence and a severity, and all unverified areas are explicitly disclosed.
