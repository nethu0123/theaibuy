# `theaibuy` 

## Buy smarter AI tools. Spend less. 

`theaibuy` is a client-friendly, production-ready, free AI spend audit SaaS application. It allows people and small-business teams to review their subscription stack seamlessly, locate redundant tool purchases, align seat allocations to lower cost parameters, and calculate monthly and annual savings instantly.

---

## 🚀 Core Value Proposition & Mechanics
- **Zero Login Friction**: No sign-ups or credentials required to get a complete structural analysis of your company's AI tool assets.
- **Rule-Based Mathematical Accuracy**: All calculations are formulated using real-world plan configurations and seat minimum boundaries rather than stochastic AI approximations.
- **AI-Powered Personalized Explanations**: Uses leading LLMs (including Anthropic, OpenAI, and Google Gemini with standard zero-config fallbacks) to formulate elegant text suggestions summarizing cost-cutting opportunities of your specific tool parameters.
- **Secure Lead Capture & Share Loops**: Email data and company profile information is ONLY requested after displaying full value audits, storing leads, and shooting structured email summaries through Resend. Deep sharing URLs are sanitized of any private credentials to protect confidentiality.

---

## 🛠️ Stack Configuration
- **Runtime Environment**: Vite, React 19, TypeScript
- **Backend Service**: Express.js with custom ESM compiler structures (`tsx` in dev, `esbuild` to unified `.cjs` in prod)
- **Database Architecture**: Supabase REST PostgREST backend with local Container fallback (`data-store.json`)
- **Email Service**: Resend API integration with local disk simulator logging fallback (`emails-sent.log`)
- **UI Components & Styling**: Custom responsive Tailwind CSS layout featuring full screen fluid containers, bold micro-animations (`motion/react`), yellow-black high contrast branding theme, and standard icons (`lucide-react`).

---

## 📦 Run and Install

```bash
# 1. Install workspace dependencies
npm install

# 2. Run express + frontend server simultaneously
npm run dev

# 3. Build for standard deployment container pipelines
npm run build

# 4. Start standalone production release
npm run start
```
