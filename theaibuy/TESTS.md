# Tests

This file records the tests and verification work completed for `theaibuy`.

## Current Verification

### Documentation review

- Checked the README content against the current project structure.
- Confirmed app scripts from `package.json`.
- Confirmed the main backend entry point is `server.ts`.
- Confirmed the core audit engine lives in `src/auditEngine.ts`.
- Confirmed pricing data lives in `src/pricing.ts`.
- Confirmed AI summaries live in `src/summaryGenerator.ts`.
- Confirmed abuse protection is documented in `ABUSE_PROTECTION.md`.

### Code path review

Reviewed the following application paths:

- `GET /api/health`
- `POST /api/audit`
- `POST /api/lead`
- `GET /api/audit/:slug`
- Frontend route `/`
- Frontend route `/audit-result`
- Frontend route `/audit/:slug`

### Manual behavior checks described by code

The current implementation supports these expected behaviors:

- Audit endpoint rejects missing `teamSize`, `useCase`, or `tools`.
- Audit endpoint rate-limits repeated requests from the same IP.
- Lead endpoint rate-limits repeated requests from the same IP.
- Lead endpoint ignores submissions with a filled honeypot field.
- Public audit endpoint returns audit data without private lead fields.
- Summary generation falls back to deterministic copy if AI providers are unavailable.
- Supabase persistence falls back to local storage when credentials are missing.
- Resend delivery falls back to local logging when credentials are missing.

## Tests Still Needed

### Unit tests

- `runAudit` should be tested with fixed fixture inputs.
- Seat minimum logic should be tested for ChatGPT Team and Claude Team.
- Overlap detection should be tested for coding tools, chatbots, and direct APIs.
- Small-team downgrade rules should be tested for business and enterprise tiers.
- Use-case mismatch rules should be tested for non-coding Copilot usage.

### Integration tests

- `POST /api/audit` should be tested with valid and invalid payloads.
- `POST /api/lead` should be tested with normal and honeypot payloads.
- `GET /api/audit/:slug` should be tested for existing and missing audits.
- Local JSON fallback should be tested when Supabase is not configured.
- Local email logging should be tested when Resend is not configured.

### Frontend tests

- Form state should persist after reload.
- Adding and removing tool rows should keep valid row state.
- Audit results should render after a successful API response.
- Public share pages should render from slug data.
- Copy-link fallback should work when clipboard access fails.

## Recommended Test Commands

```bash
npm run lint
npm run build
```

## Current Test Status

No dedicated automated test suite is currently configured. The project currently uses TypeScript checking through `npm run lint` as the main automated verification step.

Latest run:

```text
2026-05-26: npm run lint passed
```
