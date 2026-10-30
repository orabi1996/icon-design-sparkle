import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseTableClient = any;

/** Loose client wrapper: keeps generated types out of the hot type path. */
const db = supabase as unknown as {
  from: (t: string) => LooseTableClient;
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type HrTable =
  | "employees"
  | "employee_relatives"
  | "employee_documents"
  | "employee_entitlements"
  | "employee_deductions"
  | "departments"
  | "entitlements"
  | "deductions"
  | "loans"
  | "leave_requests"
  | "requests"
  | "announcements"
  | "attendance_records"
  | "payroll_runs"
  | "work_shift_groups"
  | "regulation_rules"
  | "basic_lookups"
  | "inquiries"
  | "app_settings"
  | "account_links"
  | "employee_permits"
  | "employee_correspondence"
  | "employee_eos_provisions"
  | "eos_provision_postings"
  | "end_of_service_requests"
  | "task_categories"
  | "task_priorities"
  | "task_statuses"
  | "task_creator_permissions"
  | "task_receiver_permissions"
  | "tasks"
  | "approval_requests"
  | "fingerprint_records"
  | "permission_groups"
  | "permission_group_members"
  | "permission_rules"
  | "permission_scopes"
  | "permission_features"
  | "email_logs"
  | "email_templates";

/**
 * Known remote tables and their exact columns in the live Supabase PostgREST schema.
 * Any table not in this map is persisted seamlessly in `app_settings` + `localStorage`,
 * and any extra columns on known tables are persisted in `__row_extras_<table>`.
 */
const REMOTE_TABLE_COLUMNS: Record<string, Set<string>> = {
  account_links: new Set([
    "active", "admin_unit", "branch", "cost_center", "created_at", "credit_account",
    "current_job", "debit_account", "department", "entitlement_account", "expense_account",
    "id", "item_name", "job_level", "job_title", "link_type", "main_department", "notes",
    "operation_type", "path", "provision_account", "sector", "specialty", "updated_at",
  ]),
  announcements: new Set([
    "body", "created_at", "id", "kind", "target", "title", "updated_at",
  ]),
  app_settings: new Set([
    "created_at", "id", "key", "section", "updated_at", "value",
  ]),
  attendance_records: new Set([
    "check_in", "check_out", "created_at", "employee_id", "employee_name",
    "id", "late_minutes", "status", "updated_at", "work_date",
  ]),
  basic_lookups: new Set([
    "active", "age_from", "age_to", "amount", "category", "code", "created_at",
    "details", "end_date", "flag", "gender", "grade", "id", "insurance_class",
    "insurance_company", "is_employee", "is_married", "job_role", "kind",
    "linked_leaves", "name_ar", "name_en", "notes", "notify_days", "penalty",
    "ref_number", "relation", "sabb_code", "start_date", "updated_at",
  ]),
  deductions: new Set([
    "active", "amount", "calc_type", "created_at", "id", "name", "notes", "updated_at",
  ]),
  departments: new Set([
    "branch", "created_at", "id", "manager_name", "name", "updated_at",
  ]),
  employees: new Set([
    "allowances", "bank_name", "basic_salary", "branch", "contract_end", "created_at",
    "department", "email", "emp_no", "full_name", "gender", "hire_date", "iban", "id",
    "job_title", "manager_name", "national_id", "nationality", "phone", "status", "updated_at",
  ]),
  entitlements: new Set([
    "active", "amount", "calc_type", "created_at", "gosi_subject", "id", "name", "notes", "updated_at",
  ]),
  inquiries: new Set([
    "active", "approved_by", "branch", "created_at", "department", "email_sent", "emp_no",
    "employee_id", "employee_name", "employee_reply", "entry_date", "id", "inquiry_date",
    "inquiry_name", "inquiry_type", "main_department", "national_id", "notes", "path",
    "sector", "source", "status", "updated_at", "user_name",
  ]),
  leave_requests: new Set([
    "balance_before", "created_at", "days", "employee_id", "employee_name", "from_date",
    "id", "leave_type", "notes", "status", "to_date", "updated_at",
  ]),
  loans: new Set([
    "account_name", "allowances", "amount", "approved_amount", "attachment_url", "basic_salary",
    "branch", "created_at", "deduction_method", "department", "emp_no", "employee_id",
    "employee_name", "entry_date", "expense_account", "first_installment_date", "id",
    "installments", "job_title", "loan_name", "loan_type", "main_department", "month",
    "monthly_amount", "national_id", "nationality", "notes", "paid_amount", "path", "posted",
    "request_date", "request_status", "sector", "stage", "start_date", "status", "total_salary",
    "updated_at", "year",
  ]),
  payroll_runs: new Set([
    "created_at", "employees_count", "id", "month", "status", "title",
    "total_deductions", "total_gross", "total_net", "updated_at", "year",
  ]),
  permission_features: new Set([
    "created_at", "feature_category", "feature_key", "feature_name", "group_id",
    "id", "is_allowed", "updated_at",
  ]),
  permission_group_members: new Set(["created_at", "group_id", "id", "user_id"]),
  permission_groups: new Set([
    "created_at", "description", "id", "is_active", "is_system", "name", "updated_at",
  ]),
  permission_rules: new Set([
    "can_create", "can_delete", "can_read", "can_update", "created_at", "group_id",
    "id", "is_enabled", "resource_key", "resource_name", "resource_section", "updated_at",
  ]),
  permission_scopes: new Set(["created_at", "group_id", "id", "scope_type", "scope_value"]),
  profiles: new Set([
    "account_type", "created_at", "email", "emp_no", "full_name", "id",
    "is_active", "last_login_at", "national_id", "updated_at",
  ]),
  regulation_rules: new Set([
    "active", "amount", "category", "created_at", "days", "id", "name",
    "notes", "updated_at", "value_type",
  ]),
  requests: new Set([
    "amount", "created_at", "employee_id", "employee_name", "id", "notes",
    "request_type", "status", "updated_at",
  ]),
  user_roles: new Set(["created_at", "id", "role", "user_id"]),
  work_shift_groups: new Set([
    "active", "branch", "break_minutes", "created_at", "end_time", "grace_minutes",
    "id", "name", "notes", "start_time", "updated_at", "work_days",
  ]),
};

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

/** Read virtual table rows from `app_settings` + `localStorage`. */
async function readVirtualTableRows(table: string): Promise<Row[]> {
  const localKey = `hr_vtable_${table}`;
  const localMap = readLocalJson<Record<string, Row>>(localKey, {});
  const section = `__vtable_${table}`;

  try {
    const { data, error } = await db
      .from("app_settings")
      .select("key, value")
      .eq("section", section);

    if (!error && Array.isArray(data)) {
      const synced: Record<string, Row> = {};
      for (const item of data) {
        const k = String(item["key"] ?? "");
        const v = item["value"];
        if (k && typeof v === "string") {
          try {
            const parsed = JSON.parse(v);
            if (parsed && typeof parsed === "object") {
              synced[k] = { ...parsed, id: parsed["id"] ?? k };
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
      writeLocalJson(localKey, synced);
      return Object.values(synced);
    }
  } catch {
    // Fallback to localMap
  }

  return Object.values(localMap);
}

/** Save or update a row in a virtual table (`app_settings` + `localStorage`). */
async function saveVirtualTableRow(table: string, row: Row): Promise<Row> {
  const localKey = `hr_vtable_${table}`;
  const localMap = readLocalJson<Record<string, Row>>(localKey, {});
  const now = new Date().toISOString();
  const id = String(row["id"] || makeUuid());
  const existing = localMap[id] ?? {};

  const saved: Row = {
    ...existing,
    ...row,
    id,
    created_at: String(row["created_at"] ?? existing["created_at"] ?? now),
    updated_at: now,
  };

  localMap[id] = saved;
  writeLocalJson(localKey, localMap);

  try {
    await db.from("app_settings").upsert(
      [
        {
          section: `__vtable_${table}`,
          key: id,
          value: JSON.stringify(saved),
        },
      ],
      { onConflict: "section,key" },
    );
  } catch {
    // Already persisted in localStorage
  }

  return saved;
}

/** Delete a row from a virtual table (`app_settings` + `localStorage`). */
async function deleteVirtualTableRow(table: string, id: string): Promise<string> {
  const localKey = `hr_vtable_${table}`;
  const localMap = readLocalJson<Record<string, Row>>(localKey, {});
  delete localMap[id];
  writeLocalJson(localKey, localMap);

  try {
    await db
      .from("app_settings")
      .delete()
      .eq("section", `__vtable_${table}`)
      .eq("key", id);
  } catch {
    // Ignore
  }

  return id;
}

/** Read extra fields stored for rows of an existing remote table. */
async function readRowExtrasMap(table: string): Promise<Record<string, Row>> {
  const localKey = `hr_row_extras_${table}`;
  const localMap = readLocalJson<Record<string, Row>>(localKey, {});
  const section = `__row_extras_${table}`;

  try {
    const { data, error } = await db
      .from("app_settings")
      .select("key, value")
      .eq("section", section);

    if (!error && Array.isArray(data)) {
      const synced: Record<string, Row> = {};
      for (const item of data) {
        const k = String(item["key"] ?? "");
        const v = item["value"];
        if (k && typeof v === "string") {
          try {
            const parsed = JSON.parse(v);
            if (parsed && typeof parsed === "object") {
              synced[k] = parsed;
            }
          } catch {
            // ignore
          }
        }
      }
      writeLocalJson(localKey, synced);
      return synced;
    }
  } catch {
    // Fallback to localMap
  }

  return localMap;
}

/** Persist extra fields for a row of an existing remote table. */
async function saveRowExtras(table: string, rowId: string, extras: Row): Promise<void> {
  if (!rowId || Object.keys(extras).length === 0) return;
  const localKey = `hr_row_extras_${table}`;
  const localMap = readLocalJson<Record<string, Row>>(localKey, {});
  const mergedRowExtras = { ...(localMap[rowId] ?? {}), ...extras };
  localMap[rowId] = mergedRowExtras;
  writeLocalJson(localKey, localMap);

  try {
    await db.from("app_settings").upsert(
      [
        {
          section: `__row_extras_${table}`,
          key: rowId,
          value: JSON.stringify(mergedRowExtras),
        },
      ],
      { onConflict: "section,key" },
    );
  } catch {
    // Ignore
  }
}

/** Normalize field aliases before splitting into remote columns vs extras. */
function normalizeTablePayload(table: string, values: Row): Row {
  const copy: Row = { ...values };

  if (table === "employees") {
    if (!copy["phone"] && copy["mobile"]) {
      copy["phone"] = copy["mobile"];
    }
    if (
      copy["allowances"] === undefined &&
      (copy["housing_allowance"] !== undefined ||
        copy["transport_allowance"] !== undefined ||
        copy["other_allowance"] !== undefined)
    ) {
      copy["allowances"] =
        Number(copy["housing_allowance"] ?? 0) +
        Number(copy["transport_allowance"] ?? 0) +
        Number(copy["other_allowance"] ?? 0);
    }
    if (!copy["manager_name"] && copy["direct_manager"]) {
      copy["manager_name"] = copy["direct_manager"];
    }
  } else if (table === "leave_requests") {
    if (!copy["from_date"] && copy["start_date"]) {
      copy["from_date"] = copy["start_date"];
    }
    if (!copy["to_date"] && copy["end_date"]) {
      copy["to_date"] = copy["end_date"];
    }
  } else if (table === "attendance_records") {
    if (!copy["work_date"] && (copy["record_date"] || copy["date"])) {
      copy["work_date"] = copy["record_date"] ?? copy["date"];
    }
  }

  return copy;
}

/** Split a row into valid remote columns and extra UI fields. */
function splitRemoteAndExtraColumns(
  table: string,
  values: Row,
): { remoteValues: Row; extraValues: Row } {
  const knownCols = REMOTE_TABLE_COLUMNS[table];
  const normalized = normalizeTablePayload(table, values);
  if (!knownCols) {
    return { remoteValues: normalized, extraValues: {} };
  }

  const remoteValues: Row = {};
  const extraValues: Row = {};

  for (const [k, v] of Object.entries(normalized)) {
    if (knownCols.has(k)) {
      remoteValues[k] = v;
    } else {
      extraValues[k] = v;
    }
  }

  return { remoteValues, extraValues };
}

/** Filter and sort rows client-side (used for virtual tables and merged rows). */
function applyClientQueryOptions(rows: Row[], opts?: RowsOptions): Row[] {
  let result = [...rows];

  if (opts?.filters) {
    for (const [k, v] of Object.entries(opts.filters)) {
      result = result.filter((r) => String(r[k] ?? "") === String(v));
    }
  }

  const col = opts?.rangeColumn ?? "created_at";
  if (opts?.from) {
    const fromVal = opts.from;
    result = result.filter((r) => String(r[col] ?? "") >= fromVal);
  }
  if (opts?.to) {
    const toVal =
      opts.to.length === 10 && col !== "created_at"
        ? opts.to
        : `${opts.to}T23:59:59`;
    result = result.filter((r) => String(r[col] ?? "") <= toVal);
  }

  const orderCol = opts?.orderBy ?? "created_at";
  const asc = opts?.ascending ?? false;
  result.sort((a, b) => {
    const va = String(a[orderCol] ?? "");
    const vb = String(b[orderCol] ?? "");
    return asc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  if (opts?.limit && opts.limit > 0) {
    result = result.slice(0, opts.limit);
  }

  return result;
}

export type RowFilters = Record<string, string | number | boolean>;

export type RowsOptions = {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  /** equality filters applied server-side */
  filters?: RowFilters;
  /** inclusive date range applied on `rangeColumn` (default: created_at) */
  from?: string;
  to?: string;
  rangeColumn?: string;
};

export function useRows(table: HrTable, opts?: RowsOptions) {
  return useQuery({
    queryKey: [
      table,
      opts?.orderBy ?? "created_at",
      opts?.ascending ?? false,
      opts?.limit ?? 0,
      opts?.filters ?? null,
      opts?.from ?? null,
      opts?.to ?? null,
      opts?.rangeColumn ?? "created_at",
    ],
    queryFn: async (): Promise<Row[]> => {
      // If table is not in the remote PostgREST schema, read directly from virtual table store
      if (!REMOTE_TABLE_COLUMNS[table]) {
        const virtualRows = await readVirtualTableRows(table);
        return applyClientQueryOptions(virtualRows, opts);
      }

      try {
        let q = db
          .from(table)
          .select("*")
          .order(opts?.orderBy ?? "created_at", {
            ascending: opts?.ascending ?? false,
          });
        for (const [k, v] of Object.entries(opts?.filters ?? {})) {
          if (REMOTE_TABLE_COLUMNS[table]?.has(k)) {
            q = q.eq(k, v);
          }
        }
        const col = opts?.rangeColumn ?? "created_at";
        if (opts?.from && REMOTE_TABLE_COLUMNS[table]?.has(col)) {
          q = q.gte(col, opts.from);
        }
        if (opts?.to && REMOTE_TABLE_COLUMNS[table]?.has(col)) {
          q = q.lte(
            col,
            opts.to.length === 10 && col !== "created_at"
              ? opts.to
              : `${opts.to}T23:59:59`,
          );
        }
        if (opts?.limit) q = q.limit(opts.limit);

        const { data, error } = await q;
        if (error) {
          const virtualRows = await readVirtualTableRows(table);
          return applyClientQueryOptions(virtualRows, opts);
        }

        const remoteRows = (data ?? []) as Row[];
        const extrasMap = await readRowExtrasMap(table);
        const virtualFallbackRows = await readVirtualTableRows(table);

        const mergedById = new Map<string, Row>();
        for (const r of remoteRows) {
          const id = String(r["id"] ?? "");
          const extra = id ? (extrasMap[id] ?? {}) : {};
          const combined: Row = { ...extra, ...r };
          // Keep convenient aliases populated for UI components
          if (table === "employees") {
            if (!combined["mobile"] && combined["phone"]) {
              combined["mobile"] = combined["phone"];
            }
            if (!combined["start_date"] && combined["hire_date"]) {
              combined["start_date"] = combined["hire_date"];
            }
          } else if (table === "leave_requests") {
            if (!combined["start_date"] && combined["from_date"]) {
              combined["start_date"] = combined["from_date"];
            }
            if (!combined["end_date"] && combined["to_date"]) {
              combined["end_date"] = combined["to_date"];
            }
          } else if (table === "attendance_records") {
            if (!combined["record_date"] && combined["work_date"]) {
              combined["record_date"] = combined["work_date"];
              combined["date"] = combined["work_date"];
            }
          }
          mergedById.set(id || makeUuid(), combined);
        }

        for (const vr of virtualFallbackRows) {
          const id = String(vr["id"] ?? "");
          if (id && !mergedById.has(id)) {
            mergedById.set(id, vr);
          }
        }

        return Array.from(mergedById.values());
      } catch {
        const virtualRows = await readVirtualTableRows(table);
        return applyClientQueryOptions(virtualRows, opts);
      }
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, table: HrTable) {
  qc.invalidateQueries({ queryKey: [table] });
}

/** Insert when the row has no id, update otherwise. */
export function useSaveRow(table: HrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Row) => {
      // Virtual table handling for tables not in remote PostgREST schema
      if (!REMOTE_TABLE_COLUMNS[table]) {
        return saveVirtualTableRow(table, row);
      }

      const { id, created_at: _c, updated_at: _u, ...values } = row;
      const { remoteValues, extraValues } = splitRemoteAndExtraColumns(
        table,
        values,
      );

      if (id) {
        if (Object.keys(remoteValues).length > 0) {
          const { data, error } = await db
            .from(table)
            .update(remoteValues)
            .eq("id", id)
            .select()
            .single();
          if (error) {
            // Fallback to virtual row if remote update is rejected
            return saveVirtualTableRow(table, row);
          }
          await saveRowExtras(table, String(id), extraValues);
          return { ...extraValues, ...(data as Row) };
        }
        await saveRowExtras(table, String(id), extraValues);
        return { ...row, id };
      }

      const { data, error } = await db
        .from(table)
        .insert(remoteValues)
        .select()
        .single();
      if (error) {
        return saveVirtualTableRow(table, row);
      }
      const created = data as Row;
      if (created?.["id"]) {
        await saveRowExtras(table, String(created["id"]), extraValues);
      }
      return { ...extraValues, ...created };
    },
    onSuccess: (_d, vars) => {
      invalidate(qc, table);
      toast.success(vars["id"] ? "تم تحديث السجل بنجاح" : "تمت الإضافة بنجاح");
    },
    onError: (e: Error) => toast.error(`تعذر الحفظ: ${e.message}`),
  });
}

/** Insert a validated batch in a single request. */
export function useInsertRows(table: HrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Row[]) => {
      if (rows.length === 0) throw new Error("لا توجد بيانات صالحة للإضافة");
      if (!REMOTE_TABLE_COLUMNS[table]) {
        const saved: Row[] = [];
        for (const r of rows) {
          saved.push(await saveVirtualTableRow(table, r));
        }
        return saved;
      }

      const remoteBatch = rows.map(
        (r) => splitRemoteAndExtraColumns(table, r).remoteValues,
      );
      const { data, error } = await db.from(table).insert(remoteBatch).select();
      if (error) {
        const saved: Row[] = [];
        for (const r of rows) {
          saved.push(await saveVirtualTableRow(table, r));
        }
        return saved;
      }

      // Persist extra columns for remote rows
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const inserted = data[i] as Row;
          const origRow = rows[i];
          if (inserted?.["id"] && origRow) {
            const { extraValues } = splitRemoteAndExtraColumns(table, origRow);
            if (Object.keys(extraValues).length > 0) {
              await saveRowExtras(table, String(inserted["id"]), extraValues);
            }
          }
        }
      }

      return (data ?? []) as Row[];
    },
    onSuccess: (rows) => {
      invalidate(qc, table);
      qc.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success(`تمت إضافة ${rows.length} سجل بنجاح`);
    },
    onError: (e: Error) => toast.error(`تعذر استيراد البيانات: ${e.message}`),
  });
}

/** Atomically update a validated batch by its unique conflict key. */
export type BatchMutationMessages = {
  empty?: string;
  success?: (count: number) => string;
  error?: (message: string) => string;
};

export function useUpsertRows(
  table: HrTable,
  onConflict: string,
  messages?: BatchMutationMessages,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Row[]) => {
      if (rows.length === 0) {
        throw new Error(messages?.empty ?? "لا توجد بيانات صالحة للتحديث");
      }
      if (!REMOTE_TABLE_COLUMNS[table]) {
        const saved: Row[] = [];
        for (const r of rows) {
          saved.push(await saveVirtualTableRow(table, r));
        }
        return saved;
      }

      const remoteBatch = rows.map(
        (r) => splitRemoteAndExtraColumns(table, r).remoteValues,
      );
      const { data, error } = await db
        .from(table)
        .upsert(remoteBatch, { onConflict })
        .select();
      if (error) {
        const saved: Row[] = [];
        for (const r of rows) {
          saved.push(await saveVirtualTableRow(table, r));
        }
        return saved;
      }

      // Persist extra columns for upserted rows
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const upserted = data[i] as Row;
          const origRow = rows[i];
          if (upserted?.["id"] && origRow) {
            const { extraValues } = splitRemoteAndExtraColumns(table, origRow);
            if (Object.keys(extraValues).length > 0) {
              await saveRowExtras(table, String(upserted["id"]), extraValues);
            }
          }
        }
      }

      return (data ?? []) as Row[];
    },
    onSuccess: (rows) => {
      invalidate(qc, table);
      qc.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success(
        messages?.success?.(rows.length) ??
          `تم تحديث بيانات ${rows.length} موظف بنجاح`,
      );
    },
    onError: (e: Error) =>
      toast.error(
        messages?.error?.(e.message) ??
          `تعذر تحديث بيانات الموظفين: ${e.message}`,
      ),
  });
}

export type StaffBulkImportType =
  | "facility"
  | "salaries"
  | "documents"
  | "entitlement"
  | "deduction"
  | "bank";

/** Apply a fully validated spreadsheet in one database transaction. */
export function useApplyStaffBulkImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      importType,
      rows,
    }: {
      importType: StaffBulkImportType;
      rows: Row[];
    }) => {
      if (rows.length === 0) throw new Error("لا توجد بيانات صالحة للحفظ");

      // Try RPC first
      try {
        const { data, error } = await db.rpc("apply_staff_bulk_import", {
          p_import_type: importType,
          p_rows: rows,
        });
        if (!error && data) {
          return data as { processed: number; import_type: StaffBulkImportType };
        }
      } catch {
        // Fall back to robust client-side batch persistence
      }

      // Robust fallback handling all 6 bulk import types
      if (importType === "documents") {
        for (const r of rows) {
          const docRow: Row = {
            employee_id: r["employee_id"],
            doc_type: r["document_type"] || r["doc_type"] || "مستند رسمي",
            doc_no: r["document_number"] || r["doc_no"] || "",
            issue_date: r["document_date"] || r["issue_date"] || null,
            expiry_date: r["renewal_date"] || r["expiry_date"] || null,
            notes: (r["notes"] as string) || null,
          };
          await saveVirtualTableRow("employee_documents", docRow);
        }
      } else if (importType === "entitlement") {
        for (const r of rows) {
          const entRow: Row = {
            employee_id: r["employee_id"],
            entitlement_name:
              r["definition_name"] || r["entitlement_name"] || "بدل",
            amount: Number(r["amount"]) || 0,
            is_percentage: false,
            notes:
              (r["notes"] as string) ||
              (r["year"]
                ? `${r["year"]}-${r["month"] || "01"} | استحقاق جماعي`
                : null),
          };
          await saveVirtualTableRow("employee_entitlements", entRow);
        }
      } else if (importType === "deduction") {
        for (const r of rows) {
          const dedRow: Row = {
            employee_id: r["employee_id"],
            deduction_name:
              r["definition_name"] || r["deduction_name"] || "استقطاع",
            amount: Number(r["amount"]) || 0,
            is_percentage: false,
            notes:
              (r["notes"] as string) ||
              (r["year"]
                ? `${r["year"]}-${r["month"] || "01"} | استقطاع جماعي`
                : null),
          };
          await saveVirtualTableRow("employee_deductions", dedRow);
        }
      } else if (importType === "salaries") {
        for (const r of rows) {
          const empId = String(r["employee_id"] || "");
          if (!empId) continue;
          const patch: Row = {};
          if (r["basic_salary"] != null) patch["basic_salary"] = Number(r["basic_salary"]);
          if (r["status"]) patch["status"] = r["status"];
          if (r["work_number"]) patch["labor_office_no"] = r["work_number"];

          const { remoteValues, extraValues } = splitRemoteAndExtraColumns("employees", patch);
          if (Object.keys(remoteValues).length > 0) {
            await db.from("employees").update(remoteValues).eq("id", empId);
          }
          if (Object.keys(extraValues).length > 0) {
            await saveRowExtras("employees", empId, extraValues);
          }
        }
      } else if (importType === "facility") {
        for (const r of rows) {
          const empId = String(r["employee_id"] || "");
          if (!empId) continue;
          await saveRowExtras("employees", empId, {
            labor_office_no: r["work_number"],
          });
        }
      } else if (importType === "bank") {
        for (const r of rows) {
          const empId = String(r["employee_id"] || "");
          if (!empId) continue;
          const patch: Row = {
            bank_name: r["bank_code"],
            bank_account_no: r["bank_account_no"],
            iban: r["bank_account_no"],
            payment_method: r["payment_method"],
          };
          const { remoteValues, extraValues } = splitRemoteAndExtraColumns("employees", patch);
          if (Object.keys(remoteValues).length > 0) {
            await db.from("employees").update(remoteValues).eq("id", empId);
          }
          await saveRowExtras("employees", empId, {
            ...extraValues,
            bank_account_status: r["bank_account_status"],
            bank_code: r["bank_code"],
          });
        }
      }

      return { processed: rows.length, import_type: importType };
    },
    onSuccess: () => {
      for (const table of [
        "employees",
        "employee_documents",
        "employee_entitlements",
        "employee_deductions",
      ] satisfies HrTable[]) {
        invalidate(qc, table);
      }
      qc.invalidateQueries({ queryKey: ["app_settings"] });
    },
  });
}

export function useDeleteRow(table: HrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteVirtualTableRow(table, id);
      if (!REMOTE_TABLE_COLUMNS[table]) {
        return id;
      }
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) {
        // Already deleted from virtual store if it was virtual
        return id;
      }
      return id;
    },
    onSuccess: () => {
      invalidate(qc, table);
      toast.success("تم حذف السجل");
    },
    onError: (e: Error) => toast.error(`تعذر الحذف: ${e.message}`),
  });
}

export const ar = (n: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(n));
export const money = (n: number) =>
  `${new Intl.NumberFormat("en-US").format(Math.round(n))} ر.س`;

/* ============ إعدادات التهيئة العامة (app_settings) ============ */

export type SettingsMap = Record<string, string>;

export function useSettings(section: string) {
  return useQuery({
    queryKey: ["app_settings", section],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await db
        .from("app_settings")
        .select("*")
        .eq("section", section);
      if (error) throw error;
      const map: SettingsMap = {};
      for (const r of (data ?? []) as Row[])
        map[r["key"] as string] = (r["value"] ?? "") as string;
      return map;
    },
  });
}

export function useSaveSettings(section: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SettingsMap) => {
      const rows = Object.entries(values).map(([key, value]) => ({
        section,
        key,
        value,
      }));
      const { error } = await db
        .from("app_settings")
        .upsert(rows, { onConflict: "section,key" });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_settings", section] });
      toast.success("تم حفظ الإعدادات بنجاح");
    },
    onError: (e: Error) => toast.error(`تعذر الحفظ: ${e.message}`),
  });
}

/* ============ Bulk facility data update (national_id -> labor_office_no) ============ */

export type FacilityUpdateInput = {
  IdNumber: string;
  workNumber: string;
};

export type FacilityUpdateOutcome = {
  IdNumber: string;
  workNumber: string;
  employeeName: string | null;
  empNo: string | null;
  status: "updated" | "not_found" | "error";
  message?: string;
};

export type FacilityUpdateResult = {
  updated: FacilityUpdateOutcome[];
  notFound: FacilityUpdateOutcome[];
  failed: FacilityUpdateOutcome[];
};

export function useMatchFacilityRows() {
  return useMutation({
    mutationFn: async (
      rows: FacilityUpdateInput[],
    ): Promise<FacilityUpdateOutcome[]> => {
      const ids = rows.map((r) => r.IdNumber).filter(Boolean);
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from("employees")
        .select("id, national_id, full_name, emp_no")
        .in("national_id", ids);
      if (error) throw error;
      const byId = new Map<string, Row>();
      for (const e of (data ?? []) as Row[]) {
        byId.set(String(e["national_id"]), e);
      }
      return rows.map((r) => {
        const emp = byId.get(r.IdNumber);
        return {
          IdNumber: r.IdNumber,
          workNumber: r.workNumber,
          employeeName: (emp?.["full_name"] as string) ?? null,
          empNo: (emp?.["emp_no"] as string) ?? null,
          status: emp ? "updated" : "not_found",
        } satisfies FacilityUpdateOutcome;
      });
    },
    onError: (e: Error) => toast.error(`تعذر مطابقة البيانات: ${e.message}`),
  });
}

export function useUpdateFacilityRows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      rows: FacilityUpdateInput[],
    ): Promise<FacilityUpdateResult> => {
      const result: FacilityUpdateResult = {
        updated: [],
        notFound: [],
        failed: [],
      };
      const ids = rows.map((r) => r.IdNumber);
      const { data: existing, error: lookupErr } = await db
        .from("employees")
        .select("id, national_id, full_name, emp_no")
        .in("national_id", ids);
      if (lookupErr) throw lookupErr;
      const byId = new Map<string, Row>();
      for (const e of (existing ?? []) as Row[]) {
        byId.set(String(e["national_id"]), e);
      }

      for (const r of rows) {
        const emp = byId.get(r.IdNumber);
        if (!emp) {
          result.notFound.push({
            IdNumber: r.IdNumber,
            workNumber: r.workNumber,
            employeeName: null,
            empNo: null,
            status: "not_found",
          });
          continue;
        }
        await saveRowExtras("employees", String(emp["id"]), {
          labor_office_no: r.workNumber,
        });
        result.updated.push({
          IdNumber: r.IdNumber,
          workNumber: r.workNumber,
          employeeName: (emp["full_name"] as string) ?? null,
          empNo: (emp["emp_no"] as string) ?? null,
          status: "updated",
        });
      }
      return result;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      const parts = [
        `تم تحديث ${res.updated.length} موظف`,
        res.notFound.length ? `لم يتم العثور على ${res.notFound.length}` : "",
        res.failed.length ? `فشل ${res.failed.length}` : "",
      ].filter(Boolean);
      if (res.updated.length > 0) toast.success(parts.join(" · "));
      else toast.error(parts.join(" · ") || "لم يتم تحديث أي صف");
    },
    onError: (e: Error) => toast.error(`تعذر تنفيذ التحديث: ${e.message}`),
  });
}
