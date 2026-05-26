# theaibuy

Buy smarter AI tools. Spend less.

`theaibuy` is a production-ready AI spend audit SaaS app. It lets users enter their AI subscription stack, compare current spend against recommended plans, uncover redundant tools, and generate shareable audit reports with estimated monthly and annual savings.

## What It Does

- Audits AI subscriptions without requiring account creation
- Calculates savings with deterministic pricing and seat rules
- Detects redundant tools across coding, chatbot, and API categories
- Recommends removals, downgrades, or plan changes
- Generates concise AI-powered summaries when provider keys are configured
- Falls back to local summary generation when AI APIs are unavailable
- Saves audits to Supabase or local JSON storage
- Captures leads after results are shown
- Sends reports through Resend or logs emails locally
- Creates public audit links with private lead data removed

## Stack

- React 19
- TypeScript
- Vite
- Express
- Tailwind CSS
- Motion
- Lucide React
- Supabase, optional
- Resend, optional
- Anthropic, OpenAI, and Gemini APIs, optional

## Install

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env
```

## Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The development server runs Express and Vite middleware in one process.

## Build And Start

```bash
npm run build
npm run start
```

The production build creates Vite static assets and bundles `server.ts` into `dist/server.cjs`.

## Scripts

```bash
npm run dev    # Start the full-stack development server
npm run build  # Build frontend assets and bundled backend
npm run start  # Run the compiled production server
npm run lint   # Type-check with TypeScript
```

## Environment Variables

```env
APP_URL="http://localhost:3000"

GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""

SUPABASE_URL=""
SUPABASE_ANON_KEY=""

RESEND_API_KEY=""
RESEND_VERIFIED_DOMAIN=""
```

External services are optional for local development:

- Without Supabase, records are stored in `data-store.json`.
- Without Resend, emails are written to a local log.
- Without AI provider keys, the app uses a deterministic fallback summary.

## API

- `GET /api/health` checks app and service configuration
- `POST /api/audit` runs a subscription audit
- `POST /api/lead` stores lead details and sends/logs the report email
- `GET /api/audit/:slug` retrieves a public-safe shareable audit

## Audit Engine

The core savings logic lives in `src/auditEngine.ts`. It checks:

- Coding tool overlap: Cursor, GitHub Copilot, Windsurf
- Chatbot overlap: Claude, ChatGPT, Gemini
- API overlap: Anthropic API and OpenAI API
- Seat minimum problems for team plans
- Enterprise or business plans on very small teams
- Use-case mismatches, such as coding tools for writing or research teams

Pricing assumptions are defined in `src/pricing.ts` and documented in `PRICING_DATA.md`.

## Security

The app includes a few lightweight protections:

- Honeypot handling for lead spam
- Per-IP rate limits on audit and lead endpoints
- Server-side required-field validation
- Plan prices resolved from internal pricing data
- Public audit routes that redact private lead data

See `ABUSE_PROTECTION.md` for more detail.

## Docs

- `ARCHITECTURE.md` explains the full-stack design
- `PRICING_DATA.md` documents pricing assumptions
- `PROMPTS.md` stores the AI summary prompt
- `ABUSE_PROTECTION.md` explains abuse and privacy controls
- `DEVLOG.md` tracks product and implementation changes
- `REFLECTION.md` records hardest bugs, decisions, and lessons
- `TESTS.md` summarizes completed and recommended testing
- `PRICINGDATA.md` lists pricing inputs and source links
- `GTM.md` defines the target user and go-to-market motion
- `ECONOMICS.md` models CAC, conversion, and $1M ARR assumptions
- `METRICS.md` defines B2B lead-generation metrics
