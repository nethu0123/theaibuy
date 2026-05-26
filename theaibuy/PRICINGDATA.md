# Pricing Data

This file documents the pricing inputs used by `theaibuy`.

The app's code source of truth is `src/pricing.ts`. Prices are represented as monthly USD estimates and are used for deterministic audit calculations. Pricing should be rechecked before production use because AI product plans change frequently.

## Cursor

Source used: https://www.cursor.com/pricing

| Plan | Monthly price used |
| --- | ---: |
| Hobby | $0 |
| Pro | $20 per seat |
| Business | $40 per seat |
| Enterprise | $100 per seat estimate |

Notes:

- Cursor is treated as a coding tool.
- Windsurf Pro is listed as a cheaper alternative for some coding workflows.

## GitHub Copilot

Source used: https://github.com/features/copilot/plans

| Plan | Monthly price used |
| --- | ---: |
| Individual | $10 |
| Business | $19 per seat |
| Enterprise | $39 per seat |

Notes:

- Copilot is treated as a coding tool.
- The audit engine may recommend removing Copilot when Cursor is already present or when the primary use case is writing or research.

## Claude

Source used: https://www.anthropic.com/claude and https://support.anthropic.com/

| Plan | Monthly price used |
| --- | ---: |
| Free | $0 |
| Pro | $20 |
| Max | $20 estimate in current app data |
| Team | $30 per seat, 5-seat minimum |
| Enterprise | $75 per seat estimate |
| API Direct | $10 estimate |

Notes:

- Claude is treated as a general chatbot and reasoning/writing tool.
- Claude Team has a 5-seat minimum in the audit engine.
- Enterprise and API Direct values are estimates for audit modeling, not guaranteed vendor quotes.

## ChatGPT

Source used: https://openai.com/chatgpt/pricing

| Plan | Monthly price used |
| --- | ---: |
| Plus | $20 |
| Team | $30 per seat, 2-seat minimum |
| Enterprise | $60 per seat estimate |
| API Direct | $10 estimate |

Notes:

- ChatGPT is treated as a general chatbot.
- ChatGPT Team has a 2-seat minimum in the audit engine.
- Enterprise and API Direct values are estimates for audit modeling.

## Anthropic API Direct

Source used: https://docs.anthropic.com/en/docs/about-claude/pricing

| Plan | Monthly price used |
| --- | ---: |
| API Direct | $15 estimate |

Notes:

- Real API cost is usage-based and depends on model, input tokens, output tokens, caching, and tools.
- The app uses a fixed monthly estimate so it can compare subscription stacks quickly.

## OpenAI API Direct

Source used: https://openai.com/api/pricing

| Plan | Monthly price used |
| --- | ---: |
| API Direct | $15 estimate |

Notes:

- Real API cost is usage-based and depends on model and token volume.
- The app uses a fixed monthly estimate for simple SaaS-style audit comparison.

## Gemini

Source used: https://one.google.com/explore-plan/gemini-advanced

| Plan | Monthly price used |
| --- | ---: |
| Pro / Advanced | $20 |
| Ultra | $20 estimate in current app data |
| API | $5 estimate |

Notes:

- Gemini is treated as a general chatbot and Google ecosystem AI tool.
- API pricing is modeled as a simple fixed estimate even though real API usage can vary.

## Windsurf

Source used: https://windsurf.com/pricing

| Plan | Monthly price used |
| --- | ---: |
| Free | $0 |
| Pro | $15 per seat |
| Teams | $30 per seat |
| Enterprise | $60 per seat estimate |

Notes:

- Windsurf is treated as a coding tool.
- The audit engine may recommend consolidating Windsurf if Cursor is already present.

## Pricing Maintenance Notes

- Recheck pricing monthly.
- Store the date checked beside each source in a future structured format.
- Separate official public prices from internal estimates.
- Add support for custom enterprise pricing if the user enters a custom value.
- Add usage-based API calculators once the product needs more precise API spend modeling.

