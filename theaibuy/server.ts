/**
 * server.ts
 * Main Express server script of theaibuy application.
 * Manages rule audit processing, AI summary generation, Supabase logging,
 * email dispatching, rate limiting, and serves Vite frontend bundles.
 */

import express from "express";
import path from "path";
import * as dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { runAudit } from "./src/auditEngine";
import { generateAiSummary } from "./src/summaryGenerator";
import { saveAudit, saveLead, getAudit } from "./src/db";
import { sendAuditConfirmation } from "./src/mailer";

// Load configuration
dotenv.config();

const app = express();
const PORT = 3000;

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple IP Rate Limiting Maps
const auditLimiter = new Map<string, { timestamp: number; count: number }>();
const leadLimiter = new Map<string, { timestamp: number; count: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const LIMIT_COUNT = 15; // Max 15 requests/minute

function checkRateLimit(ip: string, map: Map<string, { timestamp: number; count: number }>): boolean {
  const now = Date.now();
  const record = map.get(ip);
  if (!record) {
    map.set(ip, { timestamp: now, count: 1 });
    return false;
  }
  if (now - record.timestamp > WINDOW_MS) {
    map.set(ip, { timestamp: now, count: 1 });
    return false;
  }
  if (record.count >= LIMIT_COUNT) {
    return true;
  }
  record.count++;
  return false;
}

// Ensure proper APP_URL fallback
const getAppUrl = (req: express.Request): string => {
  const protocolHeader = req.headers["x-forwarded-proto"];
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader || req.protocol;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || `localhost:${PORT}`;
  const requestUrl = `${protocol}://${host}`;
  const configuredUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");

  if (!configuredUrl || configuredUrl.includes("MY_APP_URL")) {
    return requestUrl;
  }

  const configuredHost = (() => {
    try {
      return new URL(configuredUrl).hostname;
    } catch {
      return "";
    }
  })();
  const requestHost = host.split(":")[0];

  if ((configuredHost === "localhost" || configuredHost === "127.0.0.1") && requestHost !== configuredHost) {
    return requestUrl;
  }

  return configuredUrl;
};

function hasConfiguredValue(value: string | undefined, invalidNeedles: string[] = []): boolean {
  if (!value) return false;
  return !invalidNeedles.some((needle) => value.includes(needle));
}

// ==========================================
// API ENDPOINTS
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    appUrl: getAppUrl(req),
    services: {
      gemini: {
        configured: hasConfiguredValue(process.env.GEMINI_API_KEY, ["MY_GEMINI_API_KEY"])
      },
      supabase: {
        configured: hasConfiguredValue(process.env.SUPABASE_URL, ["your-supabase-project"]) &&
          hasConfiguredValue(process.env.SUPABASE_ANON_KEY, ["your-supabase-anon-key"])
      },
      resend: {
        configured: hasConfiguredValue(process.env.RESEND_API_KEY, ["123456789"]),
        mode: hasConfiguredValue(process.env.RESEND_API_KEY, ["123456789"]) ? "resend" : "local-log"
      }
    }
  });
});

/**
 * POST /api/audit
 * Trigger a new subscription audit logic
 */
app.post("/api/audit", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous";
  if (checkRateLimit(ip, auditLimiter)) {
    return res.status(429).json({ error: "Too many audit requests. Please wait a minute and retry." });
  }

  try {
    const { teamSize, useCase, tools } = req.body;

    if (!teamSize || !useCase || !tools || !Array.isArray(tools)) {
      return res.status(400).json({ error: "Missing required inputs schema: teamSize, useCase, and tools list." });
    }

    // Execute rule-based calculations
    const result = runAudit({ teamSize: Number(teamSize), useCase, tools });

    // Generate personalized AI report block
    const summary = await generateAiSummary({ teamSize: Number(teamSize), useCase, tools }, result);

    // Persist audit record under a distinct shareable slug
    const publicSlug = `audit-${Math.random().toString(36).substr(2, 9)}`;
    await saveAudit({
      public_slug: publicSlug,
      input_json: { teamSize, useCase, tools },
      result_json: { ...result, summary },
      total_monthly_savings: result.totalMonthlySavings,
      total_annual_savings: result.totalAnnualSavings
    });

    console.log(`Generated audit slug: ${publicSlug} for IP: ${ip}`);

    res.json({
      success: true,
      publicSlug,
      entry: { teamSize, useCase, tools },
      result,
      summary
    });
  } catch (error: any) {
    console.error("Critical error while compiling audit:", error);
    res.status(500).json({ error: "Server failed to compile your spend audit: " + error.message });
  }
});

/**
 * POST /api/lead
 * Lead email capture form after value is displayed
 */
app.post("/api/lead", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous";
  if (checkRateLimit(ip, leadLimiter)) {
    return res.status(429).json({ error: "Too many requests. Please wait and retry." });
  }

  try {
    const { auditSlug, email, companyName, role, teamSize, honeypot } = req.body;

    // Honeypot Protection
    if (honeypot && honeypot.trim() !== "") {
      console.log(`Honeypot trigger detected. Fake response sent for email: ${email}`);
      return res.json({ success: true, fake: true, message: "Receipt sent successfully." });
    }

    if (!auditSlug || !email || !companyName?.trim() || !role?.trim()) {
      return res.status(400).json({ error: "Audit token, email address, company name, and role are required identifiers." });
    }

    // Retrieve original audit calculation for mailing aggregates
    const auditRecord = await getAudit(auditSlug);
    if (!auditRecord) {
      return res.status(404).json({ error: "Reference audit trace was not found in database." });
    }

    const { total_monthly_savings, total_annual_savings } = auditRecord;

    // Direct database insert
    await saveLead({
      audit_id: auditSlug,
      email,
      company_name: companyName.trim(),
      role: role.trim(),
      team_size: teamSize ? Number(teamSize) : undefined,
      high_savings: total_monthly_savings > 500
    });

    // Send styled notification email via Resend
    const appUrl = getAppUrl(req);
    const emailDelivery = await sendAuditConfirmation({
      email,
      auditSlug,
      monthlySavings: total_monthly_savings,
      annualSavings: total_annual_savings,
      appUrl
    });

    console.log(`Lead documented and dispatched for email: ${email}`);

    res.json({ success: true, emailDelivery });
  } catch (err: any) {
    console.error("Lead submission failure:", err);
    res.status(500).json({ error: "Failed to store lead and send email: " + err.message });
  }
});

/**
 * GET /api/audit/:slug
 * Retrieves public-safe audit records with active redaction of private fields
 */
app.get("/api/audit/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const auditRecord = await getAudit(slug);

    if (!auditRecord) {
      return res.status(404).json({ error: "Requested audit report not found." });
    }

    // Strictly redact/remove any trace of raw user emails, roles, etc. if attached
    const publicSafeOutput = {
      publicSlug: auditRecord.public_slug,
      input: auditRecord.input_json,
      result: auditRecord.result_json,
      totalMonthlySavings: auditRecord.total_monthly_savings,
      totalAnnualSavings: auditRecord.total_annual_savings,
      createdAt: auditRecord.created_at
    };

    res.json(publicSafeOutput);
  } catch (err: any) {
    console.error("Failed querying single active audit:", err);
    res.status(500).json({ error: "Failed listing audit trace: " + err.message });
  }
});

// ==========================================
// VITE SETUP & STATIC SERVER MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT stage (with Vite HMR middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION stage (serving static distribution files)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Handle SPA routing wildcard responses
    app.get("*", (req, res, next) => {
      // Exclude API lines
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`theaibuy full-stack service successfully initialized at http://localhost:${PORT}`);
  });
}

startServer();
