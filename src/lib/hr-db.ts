import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Loose client wrapper: keeps generated types out of the hot type path. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type HrTable =
  | "employees"
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
  | "tasks";

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
      let q = db
        .from(table)
        .select("*")
        .order(opts?.orderBy ?? "created_at", { ascending: opts?.ascending ?? false });
      for (const [k, v] of Object.entries(opts?.filters ?? {})) q = q.eq(k, v);
      const col = opts?.rangeColumn ?? "created_at";
      if (opts?.from) q = q.gte(col, opts.from);
      if (opts?.to)
        q = q.lte(
          col,
          opts.to.length === 10 && col !== "created_at" ? opts.to : `${opts.to}T23:59:59`,
        );
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Row[];
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
      const { id, created_at: _c, updated_at: _u, ...values } = row;
      if (id) {
        const { data, error } = await db.from(table).update(values).eq("id", id).select().single();
        if (error) throw error;
        return data as Row;
      }
      const { data, error } = await db.from(table).insert(values).select().single();
      if (error) throw error;
      return data as Row;
    },
    onSuccess: (_d, vars) => {
      invalidate(qc, table);
      toast.success(vars["id"] ? "تم تحديث السجل بنجاح" : "تمت الإضافة بنجاح");
    },
    onError: (e: Error) => toast.error(`تعذر الحفظ: ${e.message}`),
  });
}

export function useDeleteRow(table: HrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidate(qc, table);
      toast.success("تم حذف السجل");
    },
    onError: (e: Error) => toast.error(`تعذر الحذف: ${e.message}`),
  });
}

export const ar = (n: number) => new Intl.NumberFormat("ar-SA").format(Math.round(n));
export const money = (n: number) => `${new Intl.NumberFormat("ar-SA").format(Math.round(n))} ر.س`;

/* ============ إعدادات التهيئة العامة (app_settings) ============ */

export type SettingsMap = Record<string, string>;

export function useSettings(section: string) {
  return useQuery({
    queryKey: ["app_settings", section],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await db.from("app_settings").select("*").eq("section", section);
      if (error) throw error;
      const map: SettingsMap = {};
      for (const r of (data ?? []) as Row[]) map[r["key"] as string] = (r["value"] ?? "") as string;
      return map;
    },
  });
}

export function useSaveSettings(section: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: SettingsMap) => {
      const rows = Object.entries(values).map(([key, value]) => ({ section, key, value }));
      const { error } = await db.from("app_settings").upsert(rows, { onConflict: "section,key" });
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
