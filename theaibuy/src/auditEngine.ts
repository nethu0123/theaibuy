/**
 * auditEngine.ts
 * Hardcoded, defensive, number-based rules engine for theaibuy.
 */

import { PRICING_DATA } from "./pricing";

export interface AuditToolInput {
  toolId: string;
  planId: string;
  seats: number;
}

export interface AuditInput {
  teamSize: number;
  useCase: "coding" | "writing" | "data" | "research" | "mixed";
  tools: AuditToolInput[];
}

export interface ToolRecommendation {
  toolId: string;
  toolName: string;
  currentPlanName: string;
  currentSpend: number;
  recommendedPlanName: string;
  recommendedSpend: number;
  action: "keep" | "downgrade" | "remove" | "switch";
  monthlySavings: number;
  reason: string;
}

export interface AuditResult {
  currentMonthlySpend: number;
  recommendedMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  recommendations: ToolRecommendation[];
  overlappingToolsDetected: string[];
}

export function runAudit(input: AuditInput): AuditResult {
  const { teamSize, useCase, tools } = input;
  const recommendations: ToolRecommendation[] = [];
  const overlappingToolsDetected: string[] = [];

  // Helper to calculate cost for a tool on a given plan
  const getToolCost = (toolId: string, planId: string, seats: number): number => {
    const tool = PRICING_DATA[toolId];
    if (!tool) return 0;
    const plan = tool.plans[planId];
    if (!plan) return 0;

    let billingSeats = seats;
    if (plan.minSeats && seats < plan.minSeats) {
      // If of lower seats, they still pay the minimum seats pricing
      billingSeats = plan.minSeats;
    }
    return plan.pricePerSeatMonth * billingSeats;
  };

  // Convert inputs to easily accessible map
  const activeToolsMap = new Map<string, AuditToolInput>();
  tools.forEach((t) => {
    activeToolsMap.set(t.toolId, t);
  });

  // Calculate Overlaps
  // 1. Coding overlaps: Cursor & GitHub Copilot & Windsurf are overlapping IDE coding tools
  const codingTools = ["cursor", "copilot", "windsurf"].filter((id) => activeToolsMap.has(id));
  if (codingTools.length > 1) {
    overlappingToolsDetected.push("Multiple AI Coding Tools (" + codingTools.map(id => PRICING_DATA[id]?.name).join(", ") + ")");
  }

  // 2. Chatbot write/research overlaps: Claude & ChatGPT & Gemini
  const chatTools = ["claude", "chatgpt", "gemini"].filter((id) => activeToolsMap.has(id));
  if (chatTools.length > 1) {
    overlappingToolsDetected.push("Multiple General-Purpose Chatbots (" + chatTools.map(id => PRICING_DATA[id]?.name).join(", ") + ")");
  }

  // 3. API direct overlaps: OpenAI API & Anthropic API
  const apiTools = ["anthropic-api", "openai-api"].filter((id) => activeToolsMap.has(id));
  if (apiTools.length > 1) {
    overlappingToolsDetected.push("Multiple Direct Developer APIs (" + apiTools.map(id => PRICING_DATA[id]?.name).join(", ") + ")");
  }

  // Evaluate each tool in the input list
  tools.forEach((toolInput) => {
    const { toolId, planId, seats } = toolInput;
    const toolMeta = PRICING_DATA[toolId];
    if (!toolMeta) return;

    const planMeta = toolMeta.plans[planId];
    if (!planMeta) return;

    const currentCost = getToolCost(toolId, planId, seats);
    let recommendedPlanId = planId;
    let recommendedSeats = seats;
    let action: "keep" | "downgrade" | "remove" | "switch" = "keep";
    let reason = "Keep current plan. Your spend is optimized for your use case and team size.";

    // Track state modifications
    let evaluated = false;

    // RULE 1: If user has GitHub Copilot but primarily does Writing / Research
    if (toolId === "copilot" && (useCase === "writing" || useCase === "research")) {
      action = "remove";
      recommendedPlanId = "individual"; // Not used if action is remove
      recommendedSeats = 0;
      reason = "Subtracting Github Copilot entirely since your primary use case is " + useCase + ", where Copilot provides little utility.";
      evaluated = true;
    }

    // RULE 2: If BOTH Cursor and GitHub Copilot are used for coding, consolidate
    if (!evaluated && toolId === "copilot" && activeToolsMap.has("cursor")) {
      action = "remove";
      recommendedPlanId = "individual";
      recommendedSeats = 0;
      reason = "Consolidate coding tools: Cursor includes autocomplete models similar to GitHub Copilot, rendering Copilot redundant.";
      evaluated = true;
    }
    if (!evaluated && toolId === "windsurf" && activeToolsMap.has("cursor")) {
      action = "remove";
      recommendedPlanId = "free";
      recommendedSeats = 0;
      reason = "Consolidate IDEs: Cursor and Windsurf are overlapping agentive code IDEs. Retain Cursor for superior team settings.";
      evaluated = true;
    }

    // RULE 3: Plan constraints checks
    // ChatGPT Team has minimum 2 seats. If user has only 1 seat, recommend downgrading to ChatGPT Plus.
    if (!evaluated && toolId === "chatgpt" && planId === "team" && seats < 2) {
      action = "downgrade";
      recommendedPlanId = "plus";
      reason = "ChatGPT Team requires a 2-seat minimum. Downgrade to ChatGPT Plus for individual premium access, saving $40/month.";
      evaluated = true;
    }

    // Claude Team has minimum 5 seats ($150/mo minimum). If user has fewer seats, suggest Claude Pro.
    if (!evaluated && toolId === "claude" && planId === "team" && seats < 5) {
      action = "downgrade";
      recommendedPlanId = "pro";
      reason = "Claude Team has a minimum 5-seat billing rule. Downgrade to Claude Pro to pay only for the exact individual seats you use.";
      evaluated = true;
    }

    // RULE 4: Enterprise/Business review for small teams
    if (!evaluated && (planId === "enterprise" || planId === "business" || planId === "teams") && seats <= 3) {
      // Look for a pro/individual plan alternative
      const availablePlans = Object.keys(toolMeta.plans);
      const isTeamsPlan = planId === "teams" || planId === "business";
      
      if (isTeamsPlan && availablePlans.includes("pro")) {
        action = "downgrade";
        recommendedPlanId = "pro";
        reason = `Downgrade ${toolMeta.name} from business tier to Pro tier. Individual licenses are sufficient for teams under 3 people.`;
        evaluated = true;
      } else if (isTeamsPlan && availablePlans.includes("individual")) {
        action = "downgrade";
        recommendedPlanId = "individual";
        reason = `Downgrade ${toolMeta.name} from business to Individual. Individual licences are sufficient for small teams.`;
        evaluated = true;
      } else if (planId === "enterprise") {
        const potentialFallback = availablePlans.includes("business") ? "business" : (availablePlans.includes("pro") ? "pro" : null);
        if (potentialFallback) {
          action = "downgrade";
          recommendedPlanId = potentialFallback;
          reason = `Enterprise plans represent huge price-markups. Small teams of ${seats} are better optimized on the ${toolMeta.plans[potentialFallback].name} plan.`;
          evaluated = true;
        }
      }
    }

    // RULE 5: Chatbot consolidation if they use both ChatGPT and Claude
    if (!evaluated && toolId === "chatgpt" && activeToolsMap.has("claude")) {
      const claudeInput = activeToolsMap.get("claude")!;
      if (claudeInput.seats >= seats) {
        action = "remove";
        recommendedPlanId = "plus";
        recommendedSeats = 0;
        reason = "Consolidate Chatbots: Claude has superior writing/reasoning and its Team/Pro features cover ChatGPT requirements.";
        evaluated = true;
      }
    }

    // RULE 6: Windsurf Pro VS Cursor Pro pricing
    if (!evaluated && toolId === "cursor" && planId === "pro" && useCase === "coding") {
      // Windsurf Pro is $15/month whereas Cursor is $20/month.
      // Mention Windsurf but specify keeping custom Cursor plan unless they prefer alternative.
      // Let's suggest: "Keep current plan, but consider Windsurf Pro if looking for a cheaper $15 alt."
      action = "keep";
      reason = "Cursor Pro is excellent for coding. You can consider Windsurf Pro ($15/mo) to save 25% on your IDE bill.";
      evaluated = true;
    }

    // Finalize cost calculations
    const recommendedCost = action === "remove" ? 0 : getToolCost(toolId, recommendedPlanId, recommendedSeats);
    const savings = currentCost - recommendedCost;

    recommendations.push({
      toolId,
      toolName: toolMeta.name,
      currentPlanName: planMeta.name,
      currentSpend: currentCost,
      recommendedPlanName: action === "remove" ? "None (Remove)" : toolMeta.plans[recommendedPlanId].name,
      recommendedSpend: recommendedCost,
      action: savings > 0 ? action : "keep", // Only apply action if it saves money
      monthlySavings: Math.max(0, savings),
      reason: savings > 0 ? reason : "Your current use of " + toolMeta.name + " (" + planMeta.name + ") is well-priced and optimized."
    });
  });

  // Calculate Aggregates
  const currentMonthlySpend = recommendations.reduce((sum, r) => sum + r.currentSpend, 0);
  const recommendedMonthlySpend = recommendations.reduce((sum, r) => sum + r.recommendedSpend, 0);
  const totalMonthlySavings = Math.max(0, currentMonthlySpend - recommendedMonthlySpend);
  const totalAnnualSavings = totalMonthlySavings * 12;

  return {
    currentMonthlySpend,
    recommendedMonthlySpend,
    totalMonthlySavings,
    totalAnnualSavings,
    recommendations,
    overlappingToolsDetected
  };
}
