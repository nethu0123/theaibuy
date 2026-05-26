# DEVLOG

A short chronological log of the `theaibuy` build journey.

## 2026-05-24

### 1. Repository start

Created the repo with a basic root `README.md` and established the project name: `theaibuy`.

### 2. App workspace

Added the main app folder with Vite, React, TypeScript, Express, package scripts, environment examples, and project config files.

### 3. Full-stack server

Built `server.ts` so the app can run frontend and backend from one Express process. In development it uses Vite middleware, and in production it serves the built `dist` files.

### 4. Main UI

Built the React audit flow in `src/App.tsx`: team size, use case, tool rows, plan selection, seat counts, estimated spend, audit results, lead capture, and public report views.

### 5. Pricing data

Added `src/pricing.ts` as the pricing source for Cursor, GitHub Copilot, Claude, ChatGPT, Anthropic API, OpenAI API, Gemini, and Windsurf.

### 6. Audit engine

Added `src/auditEngine.ts` with deterministic savings logic for current spend, recommended spend, monthly savings, annual savings, and per-tool recommendations.

### 7. Optimization rules

Added rules for coding-tool overlap, chatbot overlap, API overlap, seat minimums, small-team downgrades, and use-case mismatches.

### 8. AI summaries

Added `src/summaryGenerator.ts` to generate executive summaries through Anthropic, OpenAI, or Gemini, with a deterministic fallback when no AI provider is available.

### 9. Persistence

Added `src/db.ts` with Supabase support and local JSON fallback so audits and leads can be stored in both production and local development.

### 10. Email reports

Added `src/mailer.ts` with Resend support and local email-log fallback for sending audit report links.

## 2026-05-25

### 11. API routes

Added backend routes for health checks, audit creation, lead capture, and public audit retrieval:

- `GET /api/health`
- `POST /api/audit`
- `POST /api/lead`
- `GET /api/audit/:slug`

### 12. Sharing and lead capture

Added public audit slugs, copyable report links, shared audit pages, and post-result email capture.

### 13. Abuse protection

Added basic protection with rate limits, required input validation, a lead-form honeypot, and public report redaction.

### 14. First docs

Added architecture, pricing, prompt, abuse-protection, and README documentation.

## 2026-05-26

### 15. Branding

Added the favicon, updated `index.html`, and added the custom `BrandLogo` component inside the UI.

### 16. Styling pass

Improved the visual design, responsive layout, dark/yellow brand styling, and result-page polish.

### 17. Supabase configuration

Expanded Supabase configuration, improved database fallback behavior, and added `data-store.json` for local development.

### 18. App URL and email improvements

Improved app URL detection for hosted links and made email fallback states clearer in the frontend.

### 19. README cleanup

Rebuilt the root README and app README with setup steps, API docs, environment variables, deployment notes, and documentation links.

### 20. Business docs

Added supporting docs:

- `REFLECTION.md`
- `TESTS.md`
- `PRICINGDATA.md`
- `GTM.md`
- `ECONOMICS.md`
- `METRICS.md`

### 21. File naming cleanup

Renamed the new docs to capital format and updated README links.

### 22. Bug check and USD cleanup

Checked the app for bugs, removed the INR currency toggle so all prices display only in USD, fixed a copied-link icon class typo, and verified the app with `npm run lint`, `npm run build`, and a production `/api/health` smoke test.

### 23. Mandatory lead details

Made company name and person role mandatory in the lead form. The frontend now requires both fields, and the backend rejects direct lead submissions that do not include company name and role.

## Current state

`theaibuy` is now a working full-stack AI spend audit app with deterministic audit math, optional AI summaries, local and Supabase persistence, Resend/local email handling, public share pages, lead capture, and supporting business documentation.
