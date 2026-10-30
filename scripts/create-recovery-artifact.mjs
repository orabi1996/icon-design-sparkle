import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = "https://ylfpyugoxxxyjglyppcn.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_KK5d6zzm7t4zJUxFoOc9yQ_8n7Plrl0";
const SOURCE_PROJECT_REF = "ylfpyugoxxxyjglyppcn";
const RELEASE_CANDIDATE_SHA = "7176b9caba88dd68d6045df4ca9da44317c2be4a";
const FINAL_MIGRATION = "20260920150000_fix_m08_and_employee_lifecycle_triggers.sql";

const adminClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: false }
});

const TABLES_TO_EXPORT = [
  "hr_tenants",
  "hr_company_profiles",
  "org_branches",
  "org_departments",
  "org_jobs",
  "org_positions",
  "org_cost_centers",
  "org_historical_assignments",
  "employees",
  "employee_contracts",
  "employee_lifecycle_transitions",
  "user_roles",
  "profiles",
  "permission_groups",
  "permission_features",
  "permission_group_members",
  "leave_policies",
  "leave_ledger",
  "leave_requests",
  "employee_permits",
  "work_shifts",
  "work_shift_groups",
  "m08_devices",
  "m08_device_events",
  "m08_attendance_results",
  "m08_attendance_exceptions",
  "loans",
  "loan_installment_schedules",
  "loan_transactions",
  "payroll_periods",
  "payroll_runs",
  "payroll_inputs",
  "payroll_results",
  "payroll_payment_batches",
  "payroll_bank_files",
  "end_of_service_requests",
  "eos_settlements",
  "security_audit_logs",
  "email_settings",
  "email_logs",
  "wf_outbox_events",
  "wf_request_instances"
];

async function createRecoveryArtifact() {
  console.log("================================================================================");
  console.log("           PHASE 6: CREATE REAL STAGING RECOVERY ARTIFACT                       ");
  console.log("================================================================================");
  console.log(`Source Project:      ${SOURCE_PROJECT_REF}`);
  console.log(`Release Candidate:   ${RELEASE_CANDIDATE_SHA}`);
  console.log(`Final Migration:     ${FINAL_MIGRATION}\n`);

  // Authenticate as Admin
  const { data: authData, error: authErr } = await adminClient.auth.signInWithPassword({
    email: "uat.admin@acme.staging",
    password: "StagingUat2026!"
  });
  if (authErr) {
    console.error("Admin authentication failed:", authErr);
    process.exit(1);
  }
  console.log(`Authenticated Admin: ${authData.user.id}`);

  const backupTimestamp = new Date().toISOString();
  const backupData = {
    metadata: {
      backupType: "logical_domain_export",
      timestamp: backupTimestamp,
      sourceProjectRef: SOURCE_PROJECT_REF,
      releaseCandidateSha: RELEASE_CANDIDATE_SHA,
      finalMigration: FINAL_MIGRATION,
      totalMigrations: 43
    },
    tables: {}
  };

  let totalRecords = 0;

  for (const table of TABLES_TO_EXPORT) {
    try {
      const { data, error } = await adminClient.from(table).select("*");
      if (error) {
        console.warn(`[WARN] Table ${table}: ${error.message} (Code: ${error.code})`);
        backupData.tables[table] = { status: "error", error: error.message, count: 0, rows: [] };
      } else {
        const count = data?.length || 0;
        totalRecords += count;
        backupData.tables[table] = { status: "exported", count, rows: data || [] };
        console.log(`  [DUMP] Table '${table}': ${count} records exported`);
      }
    } catch (e) {
      console.warn(`[WARN] Table ${table} exception: ${e.message}`);
      backupData.tables[table] = { status: "exception", error: e.message, count: 0, rows: [] };
    }
  }

  // Calculate cryptographic SHA-256 checksum of the exported dataset
  const payloadString = JSON.stringify(backupData.tables);
  const dataChecksum = crypto.createHash("sha256").update(payloadString).digest("hex");
  backupData.metadata.checksumSha256 = dataChecksum;
  backupData.metadata.totalRecordsExported = totalRecords;

  const artifactId = `REC-STAGING-${Date.now()}`;
  backupData.metadata.artifactIdentifier = artifactId;

  // Write artifact to backups/ directory
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const artifactPath = path.join(backupsDir, `${artifactId}.json`);
  fs.writeFileSync(artifactPath, JSON.stringify(backupData, null, 2), "utf-8");

  console.log("\n================================================================================");
  console.log("                     RECOVERY ARTIFACT CREATED                                  ");
  console.log("================================================================================");
  console.log(`Artifact Identifier: ${artifactId}`);
  console.log(`Saved Path:          ${artifactPath}`);
  console.log(`Total Tables:        ${TABLES_TO_EXPORT.length}`);
  console.log(`Total Records:       ${totalRecords}`);
  console.log(`Payload SHA-256:     ${dataChecksum}`);
  console.log("================================================================================\n");
}

createRecoveryArtifact().catch(err => {
  console.error("Fatal backup error:", err);
  process.exit(1);
});
