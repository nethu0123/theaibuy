# `theaibuy` Abuse Protection Architecture

Security, cost-efficiency, and resilience are critical parameters for `theaibuy`. We protect resource-intensive API endpoints (especially LLM generation and email routing logs) through a multi-layered defense scheme.

---

## 🍯 1. Honeypot Guard
- **Mechanism**: The email capture form contains an input field named `honeypot` (rendered in off-screen container CSS to hide it from real users).
- **Execution**: Real users never fill in this form. Automation engines or bots parse the page DOM and populate all inputs.
- **Handling**: If the `honeypot` parameter contains any text on a POST `/api/lead` callback, the server marks the request as successfully submitted, returns a mock `200 OK` response instantly, but **bypasses any actual database inserts or Resend email dispatches**, completely neutralizing bot-spam without wasting API credits.

---

## ⏱️ 2. Memory-Efficient Sliding Rate Limiter
- **Mechanism**: Implemented memory Maps tracking client IP indicators.
- **Rules**:
  - Limits POST `/api/audit` (AI calling operations) to a maximum of **15 requests per minute** per client IP.
  - Limits POST `/api/lead` (Email captures) to a maximum of **15 requests per minute** per client IP.
- **Action**: Responds with a clean `429 Too Many Requests` state, informing the user about the cool-down interval.

---

## 🛡️ 3. Input Bounds Sanitization
- All client-side inputs are parsed and strictly restricted before processing:
  - Team Size values are forced to valid positive integers.
  - Subscription pricing entries are matched against official enumerated values inside `pricing.ts` to prevent price spoofing.
  - Private parameters (Email, Role, Company, Team Size) are saved securely in database records but are **strictly redacted** during any slug retrieval calls via `/api/audit/:slug` to prevent harvesting and protect confidentiality.
