# theaibuy

Buy smarter AI tools. Spend less.

`theaibuy` is a free AI subscription audit app for people, startups, and small teams. It helps users enter their current AI tool stack, detect overlapping subscriptions, identify oversized plans, and estimate monthly and annual savings.

The app combines a deterministic pricing rules engine with optional AI-generated summaries, shareable audit reports, lead capture, email delivery, and local fallbacks for development.

## Features

- Free AI spend audit with no login required
- Rule-based savings calculations for AI subscriptions and seat minimums
- Support for common tools such as ChatGPT, Claude, Gemini, Cursor, GitHub Copilot, Windsurf, OpenAI API, and Anthropic API
- Personalized executive summaries through Anthropic, OpenAI, or Gemini when keys are configured
- Local fallback summary generation when AI providers are unavailable
- Public share links at `/audit/:slug` with private lead data redacted
- Lead capture after audit results are shown
- Resend email integration with local log fallback
- Supabase persistence with local JSON fallback
- Basic abuse protection with honeypot fields, per-IP rate limits, and input bounds

## Tech Stack

- React 19
- TypeScript
- Vite
- Express
- Tailwind CSS
- Motion
- Lucide React
- Supabase REST API, optional
- Resend, optional
- Anthropic, OpenAI, and Gemini APIs, optional

## Project Structure

```text
.
├── README.md
└── theaibuy/
    ├── server.ts              # Express API and Vite middleware server
    ├── src/
    │   ├── App.tsx            # React UI and client-side route handling
    │   ├── auditEngine.ts     # Deterministic savings rules
    │   ├── db.ts              # Supabase/local JSON persistence
    │   ├── mailer.ts          # Resend/local email fallback
    │   ├── pricing.ts         # Tool and plan pricing data
    │   └── summaryGenerator.ts# AI and fallback audit summaries
    ├── ARCHITECTURE.md
    ├── ABUSE_PROTECTION.md
    ├── PRICING_DATA.md
    ├── PROMPTS.md
    └── package.json
```

## Getting Started

Install dependencies from the app directory:

```bash
cd theaibuy
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev    # Start Express with Vite middleware
npm run build  # Build the Vite client and bundled server
npm run start  # Start the production server from dist/server.cjs
npm run lint   # Type-check the project
```

## Environment Variables

All external services are optional for local development because the app includes local fallbacks.

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

When Supabase is not configured, audit and lead records are stored in `data-store.json`. When Resend is not configured, email sends are logged locally.

## API Routes

- `GET /api/health` returns app and service configuration status
- `POST /api/audit` runs the subscription audit and returns savings recommendations
- `POST /api/lead` stores lead information and sends or logs an audit email
- `GET /api/audit/:slug` returns a public-safe audit report for sharing

## Audit Logic

The savings engine in `src/auditEngine.ts` uses fixed pricing data and explicit rules rather than relying on an LLM for math. It checks for:

- Overlap between coding tools such as Cursor, Copilot, and Windsurf
- Overlap between general chat tools such as ChatGPT, Claude, and Gemini
- Overlap between direct API providers
- Seat minimum issues such as ChatGPT Team and Claude Team minimum billing
- Enterprise or business plans that are oversized for small teams
- Use-case mismatches, such as Copilot on non-coding workflows

AI providers are used only to explain the result in polished language. If no provider is available, the app returns a deterministic fallback summary.

## Security And Abuse Protection

The app includes:

- Honeypot protection on the lead form
- Per-IP sliding-window rate limits for audit and lead endpoints
- Server-side validation of required audit inputs
- Pricing lookups from internal enumerated plan data
- Public audit routes that omit private lead data

More detail is available in `theaibuy/ABUSE_PROTECTION.md`.

## Deployment

Build the app:

```bash
npm run build
```

Start the compiled server:

```bash
npm run start
```

The production server serves the built Vite assets and the Express API from one process on port `3000`.

## Documentation

- `theaibuy/ARCHITECTURE.md` describes the full-stack architecture
- `theaibuy/PRICING_DATA.md` documents pricing assumptions
- `theaibuy/PROMPTS.md` contains the audit summary prompt
- `theaibuy/ABUSE_PROTECTION.md` describes rate limiting, honeypots, and data redaction
- `theaibuy/DEVLOG.md` tracks product and implementation changes
- `theaibuy/REFLECTION.md` records hardest bugs, decisions, and lessons
- `theaibuy/TESTS.md` summarizes completed and recommended testing
- `theaibuy/PRICINGDATA.md` lists pricing inputs and source links
- `theaibuy/GTM.md` defines the target user and go-to-market motion
- `theaibuy/ECONOMICS.md` models CAC, conversion, and $1M ARR assumptions
- `theaibuy/METRICS.md` defines B2B lead-generation metrics
