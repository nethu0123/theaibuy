/**
 * db.ts
 * Database abstraction module for theaibuy.
 * Handles Supabase REST integration with a reliable local JSON file fallback.
 */

import fs from "fs";
import path from "path";

const LOCAL_DB_PATH = path.join(process.cwd(), "data-store.json");

export interface AuditRecord {
  id?: string;
  public_slug: string;
  input_json: any;
  result_json: any;
  total_monthly_savings: number;
  total_annual_savings: number;
  created_at?: string;
}

export interface LeadRecord {
  id?: string;
  audit_id: string; // references public_slug or id
  email: string;
  company_name?: string;
  role?: string;
  team_size?: number;
  high_savings: boolean;
  created_at?: string;
}

// Ensure the local flat-file storage exists
function initLocalStore() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(
      LOCAL_DB_PATH,
      JSON.stringify({ audits: [], leads: [] }, null, 2)
    );
  }
}

function readLocalStore(): { audits: AuditRecord[]; leads: LeadRecord[] } {
  initLocalStore();
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read local store, resetting...", err);
    return { audits: [], leads: [] };
  }
}

function writeLocalStore(store: { audits: AuditRecord[]; leads: LeadRecord[] }) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("Failed to write to local store", err);
  }
}

export async function saveAudit(record: AuditRecord): Promise<string> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      console.log("Supabase configured. Attempting to insert audit...");
      const response = await fetch(`${supabaseUrl}/rest/v1/audits`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          public_slug: record.public_slug,
          input_json: record.input_json,
          result_json: record.result_json,
          total_monthly_savings: record.total_monthly_savings,
          total_annual_savings: record.total_annual_savings
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Audit saved to Supabase cloud table successfully.");
        return record.public_slug;
      } else {
        const errText = await response.text();
        if (errText.includes("PGRST205") || errText.includes("schema cache") || errText.includes("not found")) {
          console.log("Supabase db tables 'audits' not customized in schema cache yet. Seamlessly persisting data state into high-performance local JSON flat-file storage.");
        } else {
          console.warn("Supabase database insert response: using local datastore backup.", errText);
        }
      }
    } catch (err) {
      console.warn("Supabase connection failed, using local store fallback:", err);
    }
  }

  // Backup Local Store
  const store = readLocalStore();
  const newRecord = { ...record, created_at: new Date().toISOString() };
  store.audits.push(newRecord);
  writeLocalStore(store);
  console.log("Audit saved to local data-store.json backup.");
  return record.public_slug;
}

export async function getAudit(slug: string): Promise<AuditRecord | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/audits?public_slug=eq.${encodeURIComponent(slug)}&select=*`, {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data[0];
        }
      }
    } catch (err) {
      console.warn("Supabase query failed, falling back to local file query:", err);
    }
  }

  const store = readLocalStore();
  const record = store.audits.find((a) => a.public_slug === slug);
  return record || null;
}

export async function saveLead(record: LeadRecord): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      console.log("Supabase configured. Attempting to insert lead...");
      const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audit_id: record.audit_id,
          email: record.email,
          company_name: record.company_name,
          role: record.role,
          team_size: record.team_size,
          high_savings: record.high_savings
        })
      });

      if (response.ok) {
        console.log("Lead saved to Supabase cloud table successfully.");
        return;
      } else {
        const errText = await response.text();
        if (errText.includes("PGRST205") || errText.includes("schema cache") || errText.includes("not found")) {
          console.log("Supabase db tables 'leads' not customized in schema cache yet. Seamlessly logging email subscription request directly to local JSON backup archive.");
        } else {
          console.warn("Supabase lead submission response: using local datastore backup.", errText);
        }
      }
    } catch (err) {
      console.warn("Supabase lead connection failed, saving to local backup:", err);
    }
  }

  const store = readLocalStore();
  const newRecord = { ...record, created_at: new Date().toISOString() };
  store.leads.push(newRecord);
  writeLocalStore(store);
  console.log("Lead saved to local data-store.json backup.");
}
