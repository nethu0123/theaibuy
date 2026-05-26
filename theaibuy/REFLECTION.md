# Reflection

## Hardest Bugs And Decisions

The hardest part of this project was keeping the audit math deterministic while still making the product feel intelligent.

AI spend tools are easy to overbuild around LLMs, but the most important output here is a financial recommendation. That meant the calculations needed to come from fixed pricing data and explicit rules, not from generated text. The LLM can explain a recommendation, but it should not decide the savings number.

## Main Challenge

The biggest technical challenge was connecting three moving parts without making the app fragile:

- The frontend collects team size, use case, tools, plans, and seats.
- The backend calculates current spend, recommended spend, and savings.
- The summary generator turns the result into a useful executive explanation.

If any one of those layers uses different assumptions, the product becomes confusing. For example, if the frontend estimates a plan one way but the backend applies a different seat minimum, the user may see numbers jump unexpectedly. The project solves this by keeping pricing in `src/pricing.ts` and using server-side audit logic as the final source of truth.

## Hardest Bug Class

The hardest bug class was state and route consistency.

The app has multiple views:

- `/` for the audit form
- `/audit-result` for the active result
- `/audit/:slug` for a public shared report

The app also uses `localStorage` for form and result recovery. That creates several edge cases:

- A user refreshes after generating an audit.
- A user opens a public audit link directly.
- A user navigates back to the form and changes inputs.
- A public audit loads while local session data also exists.

The key lesson was to separate public shared audit state from the user's local active audit state.

## Product Reflection

The product is strongest when it behaves like a quick diagnostic tool, not a heavy finance platform. The target user does not want to configure a procurement system. They want to know whether their AI stack is wasteful, what to cancel, and how much money that saves.

The most important product constraint is trust. Users are more likely to share an email or report if the tool gives value first. That is why lead capture happens after the audit result, not before it.

## What I Would Improve Next

- Add unit tests around every audit rule.
- Add fixture tests for known subscription stacks.
- Move pricing source dates into structured metadata.
- Add clearer handling for custom enterprise pricing.
- Add analytics events for each funnel step.
- Add a lightweight admin view for captured leads and high-savings accounts.

