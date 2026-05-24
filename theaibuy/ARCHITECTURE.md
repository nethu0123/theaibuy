# `theaibuy` Full-Stack Architecture Design Directory

This document details the software engineering layouts, database schemas, and external API interfaces of **theaibuy**.

---

## 🧭 Architectural Overview
The system utilizes a modern, unified single-process full-stack architecture running **Express.js** as the master platform controller and **React 19 + Vite** as the client-side presentation viewport.

```
       [ Client Browser Vewports ]
         |                     ^
         | HTTP POST / GET     | Served HTML/Assets (Vite SPA)
         v                     |
      +---------------------------+
      |      Express Server       | <-- Port 3000 Ingress proxy Router
      +---------------------------+
        |            |           |
        | Run Logic  | Save DB   | Trigger EM
        v            v           v
  [Rules Engine]  [db.ts]    [mailer.ts]
                     |           |
                     +---> Supabase API (Fallback: JSON file)
                     +---> Resend API (Fallback: Log file)
```

---

## 🧬 Frontend Application Layout
1. **Dynamic Core States**: Uses React custom context state trackers that sync to `localStorage`. This guarantees users never lose entered subscription lists on soft-reloads.
2. **Unified Navigation Router**: Fully supports the requested explicit URL routes:
   - `/`: Landing stage and interactive multi-row subscription questionnaire.
   - `/audit-result`: Comprehensive graphical audit screen displaying aggregated savings, compared timelines, per-unit recommendations, AI evaluations, and anonymized lead submit triggers.
   - `/audit/[slug]`: Public share page. Retains high-fidelity diagrams while omitting email addresses, roles, and private information.
3. **Typography and Palettes**: Combines Inter, Playfair Display, and JetBrains Mono fonts. Integrates a yellow, charcoal black, and slate-white design system emphasizing fluid interaction and 44px responsive click zones.

---

## 📐 Audit Rules Engine (`src/auditEngine.ts`)
Calculations are hardcoded for speed, security, and reproducibility. The engine reviews overlapping patterns:
- **Redundancies**: Detects pairs like `copilot` + `cursor`, or `chatgpt` + `claude` and recommends total subtraction of copycats to avoid waste.
- **Plan Sizing Rules**:
  - Overriding seat restrictions: `chatgpt` Team requires a minimum of 2 seats. If 1 seat is inputted, recommend Plus instead ($40 difference). Claude Team requires a minimum of 5 seats. If fewer, suggest Pro.
  - Trim Enterprise tiers: Small groups (< 4 seats) utilizing Business or Enterprise are advised to downgrade to Pro/Individual tiers.
  - Mismatched Use Cases: GitHub Copilot is flagged as safe to drop if the user's primary use case is "Writing" or "Research" instead of "Coding".

---

## 🗄️ Database Schemas
The app supports direct PostgreSQL REST inserts on Supabase, falling back to containerized files if unpopulated:

### `audits` Table Schema
```sql
CREATE TABLE audits (
  id BIGSERIAL PRIMARY KEY,
  public_slug VARCHAR(255) UNIQUE NOT NULL,
  input_json JSONB NOT NULL,
  result_json JSONB NOT NULL,
  total_monthly_savings NUMERIC NOT NULL,
  total_annual_savings NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `leads` Table Schema
```sql
CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  audit_id VARCHAR(255) REFERENCES audits(public_slug),
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  role VARCHAR(255),
  team_size INT,
  high_savings BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
