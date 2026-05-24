/**
 * pricing.ts
 * Single source of truth for theaibuy subscription pricing.
 * All pricing data is current as of May 2026.
 */

export interface PlanPricing {
  name: string;
  pricePerSeatMonth: number;
  isApiDirect?: boolean;
  minSeats?: number;
}

export interface ToolPricing {
  id: string;
  name: string;
  plans: { [planId: string]: PlanPricing };
  alternative?: {
    toolId: string;
    planId: string;
    reason: string;
  };
}

export const PRICING_DATA: { [toolId: string]: ToolPricing } = {
  cursor: {
    id: "cursor",
    name: "Cursor",
    plans: {
      hobby: { name: "Hobby", pricePerSeatMonth: 0 },
      pro: { name: "Pro", pricePerSeatMonth: 20 },
      business: { name: "Business", pricePerSeatMonth: 40 },
      enterprise: { name: "Enterprise", pricePerSeatMonth: 100 }
    },
    alternative: {
      toolId: "windsurf",
      planId: "pro",
      reason: "Windsurf Pro offers similar advanced agentive coding features at a lower entry price."
    }
  },
  copilot: {
    id: "copilot",
    name: "GitHub Copilot",
    plans: {
      individual: { name: "Individual", pricePerSeatMonth: 10 },
      business: { name: "Business", pricePerSeatMonth: 19 },
      enterprise: { name: "Enterprise", pricePerSeatMonth: 39 }
    },
    alternative: {
      toolId: "cursor",
      planId: "pro",
      reason: "Cursor Pro offers far superior codebase indexing and fast-paced completions for development."
    }
  },
  claude: {
    id: "claude",
    name: "Claude",
    plans: {
      free: { name: "Free", pricePerSeatMonth: 0 },
      pro: { name: "Pro", pricePerSeatMonth: 20 },
      max: { name: "Max", pricePerSeatMonth: 20 },
      team: { name: "Team", pricePerSeatMonth: 30, minSeats: 5 },
      enterprise: { name: "Enterprise", pricePerSeatMonth: 75, minSeats: 1 },
      "api-direct": { name: "API Direct", pricePerSeatMonth: 10, isApiDirect: true }
    },
    alternative: {
      toolId: "gemini",
      planId: "pro",
      reason: "Gemini Pro/Advanced provides a massive 2M token context window and integration with Google Workspace for similar premium writing/data extraction needs."
    }
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    plans: {
      plus: { name: "Plus", pricePerSeatMonth: 20 },
      team: { name: "Team", pricePerSeatMonth: 30, minSeats: 2 },
      enterprise: { name: "Enterprise", pricePerSeatMonth: 60, minSeats: 1 },
      "api-direct": { name: "API Direct", pricePerSeatMonth: 10, isApiDirect: true }
    },
    alternative: {
      toolId: "claude",
      planId: "pro",
      reason: "Claude Pro has superior performance for coding logic and long-form analytical writing tasks."
    }
  },
  "anthropic-api": {
    id: "anthropic-api",
    name: "Anthropic API direct",
    plans: {
      direct: { name: "API Direct", pricePerSeatMonth: 15, isApiDirect: true }
    }
  },
  "openai-api": {
    id: "openai-api",
    name: "OpenAI API direct",
    plans: {
      direct: { name: "API Direct", pricePerSeatMonth: 15, isApiDirect: true }
    }
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    plans: {
      pro: { name: "Pro", pricePerSeatMonth: 20 },
      ultra: { name: "Ultra", pricePerSeatMonth: 20 },
      api: { name: "API", pricePerSeatMonth: 5, isApiDirect: true }
    }
  },
  windsurf: {
    id: "windsurf",
    name: "Windsurf",
    plans: {
      free: { name: "Free", pricePerSeatMonth: 0 },
      pro: { name: "Pro", pricePerSeatMonth: 15 },
      teams: { name: "Teams", pricePerSeatMonth: 30 },
      enterprise: { name: "Enterprise", pricePerSeatMonth: 60 }
    }
  }
};
