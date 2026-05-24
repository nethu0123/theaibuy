/**
 * summaryGenerator.ts
 * AI-powered summary generator supporting Anthropic (preferred),
 * OpenAI (backup), and Google Gemini (automatic backup) interfaces.
 */

import { GoogleGenAI } from "@google/genai";
import { AuditResult, AuditInput } from "./auditEngine";

function getFallbackSummary(input: AuditInput, result: AuditResult): string {
  const { totalMonthlySavings, totalAnnualSavings, recommendations, overlappingToolsDetected } = result;

  if (totalMonthlySavings === 0) {
    return `Your team of ${input.teamSize} is currently highly optimized for the ${input.useCase} use case! Everything is configured on the best matching tiers with zero redundancy detected across your SaaS tools. We advise maintaining your current setup and continuing to monitor prices.`;
  }

  const primaryRem = recommendations.find((r) => r.monthlySavings > 0);
  const mainTool = primaryRem ? `${primaryRem.toolName} (${primaryRem.currentPlanName})` : "your software tools";
  const mainAction = primaryRem ? primaryRem.reason : "consolidating your accounts";

  let summary = `Your stack has a potential savings of $${totalMonthlySavings.toLocaleString()}/month ($${totalAnnualSavings.toLocaleString()}/year). `;
  
  if (overlappingToolsDetected.length > 0) {
    summary += `We discovered overlapping subscription footprints with ${overlappingToolsDetected.join(" and ")}. `;
  }

  summary += `The single largest optimization comes from ${mainTool}: we recommend ${mainAction}. Making these simple portfolio changes will immediately free up budget without disrupting team productivity.`;
  
  return summary;
}

export async function generateAiSummary(input: AuditInput, result: AuditResult): Promise<string> {
  const { teamSize, useCase } = input;
  const { currentMonthlySpend, recommendedMonthlySpend, totalMonthlySavings, recommendations } = result;

  const topRecommendations = recommendations
    .filter((r) => r.monthlySavings > 0)
    .map((r) => `- ${r.toolName}: Current ${r.currentPlanName} -> Recommended ${r.recommendedPlanName}, Saves $${r.monthlySavings}/mo because: ${r.reason}`)
    .join("\n");

  const promptText = `
You are the financial auditor of "theaibuy", a service tasked with saving teams money on AI subscriptions.
Craft a highly personalized, smart, actionable executive summary of approximately 100 words (do not exceed 120 words).

Context:
- Team Size: ${teamSize}
- Primary Use Case: ${useCase}
- Current Monthly Spend: $${currentMonthlySpend}
- Recommended Monthly Spend: $${recommendedMonthlySpend}
- Monthly Savings: $${totalMonthlySavings}
- Annual Savings: $${totalMonthlySavings * 12}

Here are the specific tool recommendations analyzed:
${topRecommendations || "None. The user's stack is already completely optimized."}

Your writing style must be clean, professional, objective, and SaaS-focused. Explain the main source of waste (e.g. overlapping tools, seat count minimums, excessive enterprise plans) and the prompt actions to take to salvage this budget.
`;

  // 1. TRY ANTHROPIC (Preferred)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 300,
          messages: [{ role: "user", content: promptText }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data?.content?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (err) {
      console.error("Anthropic API failed, falling back to OpenAI or Gemini...", err);
    }
  }

  // 2. TRY OPENAI (Backup)
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 300,
          messages: [{ role: "user", content: promptText }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (err) {
      console.error("OpenAI API failed, falling back to Gemini...", err);
    }
  }

  // 3. TRY GEMINI (Automatic standard, works immediately out of the box in the environment!)
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes("leaked") || errMsg.includes("403") || errMsg.includes("PERMISSION_DENIED")) {
        console.log("Gemini API key is invalid/leaked or permission denied. Bypassing Gemini LLM and using our reliable rule-based audit analysis summary engine.");
      } else {
        console.log("Gemini API skipped: falls back to custom spend formulas. Reason:", errMsg);
      }
    }
  }

  // 4. TEMPLATED HIGH-FIDELITY FALLBACK
  return getFallbackSummary(input, result);
}
