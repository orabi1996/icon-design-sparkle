// Run only against the disposable Postgres fixture, not the application database.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
function sql(statement) {
  return new Promise((resolve, reject) => {
    const process = spawn("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    process.stdout.on("data", (chunk) => { out += chunk; });
    process.stderr.on("data", (chunk) => { err += chunk; });
    process.on("error", reject);
    process.on("close", (code) => resolve({ code, out: out.trim(), err }));
    process.stdin.end(statement);
  });
}
const original = await sql("SELECT value FROM public.app_settings WHERE section='request_types' AND key='configs';");
assert.equal(original.code, 0, original.err);
const payload = JSON.parse(original.out);
async function compete(user, hours) {
  const next = JSON.stringify([{ ...payload[0], max_sla_hours: hours }]);
  return sql(`BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub', '${user}', true);
    SELECT public.save_request_type_settings(${quote(next)}::jsonb, ${quote(original.out)});
    SELECT pg_sleep(0.5);
    COMMIT;`);
}
const results = await Promise.all([
  compete("00000000-0000-0000-0000-000000000001", 36),
  compete("00000000-0000-0000-0000-000000000003", 72),
]);
assert.equal(results.filter((r) => r.code === 0).length, 1, "Exactly one concurrent write must win");
assert.match(results.find((r) => r.code !== 0).err, /40001/);
const final = await sql("SELECT value FROM public.app_settings WHERE section='request_types' AND key='configs';");
assert.equal(final.code, 0, final.err);
assert.equal(JSON.parse(final.out)[0].max_sla_hours, results[0].code === 0 ? 36 : 72);
console.log("Concurrent admins: one commit, one serialization conflict; winner preserved.");
