import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_REQUEST_TYPES, serializeRequestConfigs } from "../src/lib/request-config.mjs";
import { loadRequestTypeSettings, parseRequestSettingsSnapshot, saveRequestTypeSettings } from "../src/lib/request-settings.mjs";

const configs = () => DEFAULT_REQUEST_TYPES.map((item) => ({ ...item, approval_chain: [...item.approval_chain] }));
const saved = () => ({ exists: true, value: serializeRequestConfigs(configs()) });
const reply = (data) => async () => ({ data, error: null });

test("only a successful, explicitly missing row permits initial defaults", async () => {
  const snapshot = await loadRequestTypeSettings(reply({ exists: false, value: null }));
  assert.equal(snapshot.expectedValue, null);
  assert.equal(snapshot.exists, false);
  assert.equal(snapshot.configs.length, 5);
  for (const data of [null, {}, { exists: false }, { exists: false, value: "[]" }, { exists: true, value: null }]) {
    assert.throws(() => parseRequestSettingsSnapshot(data), { code: "invalid_data" });
  }
});

test("corrupt, empty, partial and duplicate saved data block editing instead of defaulting", () => {
  const partial = JSON.stringify([configs()[0], { id: "bad" }]);
  const duplicate = JSON.stringify([configs()[0], configs()[0]]);
  for (const value of ["", " ", "{broken", "null", "[]", partial, duplicate]) {
    assert.throws(() => parseRequestSettingsSnapshot({ exists: true, value }), { code: "invalid_data" });
  }
});

test("backend authorization, missing migration and network failures cannot become default data", async () => {
  for (const [code, expected] of [["42501", "forbidden"], ["PGRST202", "unavailable"], ["42883", "unavailable"], ["unknown", "unavailable"]]) {
    await assert.rejects(loadRequestTypeSettings(async () => ({ data: saved(), error: { code, message: "provider-private-detail" } })), (error) => {
      assert.equal(error.code, expected);
      assert.ok(!error.message.includes("provider-private-detail"));
      return true;
    });
  }
  await assert.rejects(loadRequestTypeSettings(async () => { throw new Error("network"); }), { code: "unavailable" });
});

test("saving validates first, sends exact prior value, and uses only the checked RPC", async () => {
  const original = JSON.stringify(configs(), null, 2);
  const next = configs();
  next[0].name = "طلب معدل";
  let calls = 0;
  const rpc = async (name, args) => {
    calls += 1;
    assert.equal(name, "save_request_type_settings");
    assert.equal(args.p_expected_value, original);
    assert.deepEqual(args.p_configs, next);
    return { data: { exists: true, value: JSON.stringify(next) }, error: null };
  };
  const result = await saveRequestTypeSettings(rpc, next, original);
  assert.equal(result.configs[0].name, "طلب معدل");
  await assert.rejects(saveRequestTypeSettings(rpc, [], original));
  await assert.rejects(saveRequestTypeSettings(rpc, next, undefined), { code: "invalid_data" });
  assert.equal(calls, 1);
});

test("stale writes and uncertain responses fail without automatic retry or false success", async () => {
  let calls = 0;
  await assert.rejects(saveRequestTypeSettings(async () => {
    calls += 1;
    return { data: null, error: { code: "40001" } };
  }, configs(), saved().value), { code: "conflict" });
  assert.equal(calls, 1);
  await assert.rejects(saveRequestTypeSettings(reply({ exists: false, value: null }), configs(), null), { code: "invalid_data" });
  const different = configs();
  different[0].max_sla_hours = 5;
  await assert.rejects(saveRequestTypeSettings(reply({ exists: true, value: JSON.stringify(different) }), configs(), null), { code: "invalid_data" });
  await assert.rejects(saveRequestTypeSettings(async () => { throw new Error("connection dropped"); }, configs(), null), { code: "unavailable" });
});

test("UI contract keeps raw approval text, requires a loaded snapshot, and isolates accounts", () => {
  const ui = readFileSync("src/routes/requests.setup.tsx", "utf8");
  const db = readFileSync("src/lib/request-settings-db.ts", "utf8");
  assert.ok(ui.includes("value={chainText}"));
  assert.ok(ui.includes("approval_chain: splitApprovalChain(chainText)"));
  assert.ok(!/onChange[^\n]*splitApprovalChain/.test(ui));
  assert.ok(!ui.includes("useSaveSettings"));
  assert.ok(!ui.includes("useSettings("));
  assert.ok(ui.includes("settingsQuery.isSuccess && !settingsQuery.isFetching"));
  assert.ok(ui.includes("if (!canEdit || mutationInFlight.current || !draftBase) return;"));
  assert.ok(ui.includes("expectedValue: draftBase.expectedValue"));
  assert.ok(ui.includes("<RequestSetupEditor key={userId}"));
  assert.ok(db.includes('["request-type-settings", userId]'));
  assert.ok(db.includes("retry: false"));
  assert.ok(!db.includes('.from("app_settings")'));
});

test("SQL contract is restrictive over legacy policies and RPCs enforce authority and compare-and-swap", () => {
  const sql = readFileSync("supabase/migrations/20260915100000_secure_request_type_settings.sql", "utf8");
  for (const token of ["AS RESTRICTIVE FOR ALL", "USING (section <> 'request_types')",
    "WITH CHECK (section <> 'request_types')", "public.is_permissions_admin()",
    "pg_advisory_xact_lock", "FOR UPDATE", "IS DISTINCT FROM p_expected_value",
    "REVOKE ALL ON FUNCTION", "SET search_path = ''"]) assert.ok(sql.includes(token), token);
  assert.ok(!sql.includes("user_metadata"));
  assert.ok(!sql.includes("DROP TABLE"));
});
