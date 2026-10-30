import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const url = "https://ufdfvcsvvgzjxsmekqqc.supabase.co";
const key = "sb_publishable_SFJbLeGyqW0zWNo_w8Vr9A_aNkRUhK8";
const client = createClient(url, key);

async function restore(backupFile) {
  if (!backupFile) {
    const files = fs.readdirSync("backups").filter((f) => f.startsWith("backup_system_data_")).sort();
    if (files.length === 0) {
      console.log("No backup file found.");
      return;
    }
    backupFile = "backups/" + files[files.length - 1];
  }

  console.log("Restoring from", backupFile);
  const data = JSON.parse(fs.readFileSync(backupFile, "utf8"));

  for (const [table, rows] of Object.entries(data)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    console.log(`Restoring ${rows.length} rows to ${table}...`);
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await client.from(table).upsert(batch);
      if (error) console.log(`Error inserting to ${table}:`, error.message);
    }
  }
  console.log("Restore complete!");
}

restore(process.argv[2]);
