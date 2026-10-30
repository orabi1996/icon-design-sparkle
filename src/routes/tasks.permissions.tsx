import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, Chip } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { TasksModuleShell, TabBar } from "@/components/hr/TasksModuleShell";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/tasks/permissions")({
  head: () => ({
    meta: [
      { title: "إدارة الصلاحيات | إدارة المهام" },
      {
        name: "description",
        content: "إدارة صلاحيات مستخدمي النظام من منشئي المهام والمستلمين.",
      },
    ],
  }),
  component: TasksPermissionsPage,
});

const SCOPE_OPTIONS = [
  { value: "own", label: "الفرع/القسم الخاص بي" },
  { value: "selected", label: "فروع/أقسام محددة" },
  { value: "all", label: "جميع الفروع/الأقسام" },
];
const REPORTS_SCOPE = [
  { value: "own_only", label: "مهامي فقط" },
  { value: "department", label: "مهام قسمي" },
  { value: "branch", label: "مهام فرعي" },
  { value: "all", label: "كل المهام" },
];

type TabId = "creators" | "receivers";
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "creators", label: "منشئي المهام", icon: "person_add" },
  { id: "receivers", label: "مستلمي المهام", icon: "assignment_ind" },
];

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

function scopeLabel(v: string) {
  return SCOPE_OPTIONS.find((s) => s.value === v)?.label ?? v;
}
function reportsLabel(v: string) {
  return REPORTS_SCOPE.find((s) => s.value === v)?.label ?? v;
}

function TasksPermissionsPage() {
  const [tab, setTab] = useState<TabId>("creators");

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "إدارة الصلاحيات"]} />
      <TasksModuleShell
        icon="shield_person"
        title="إدارة الصلاحيات"
        subtitle="إدارة وتحديد صلاحيات مستخدمي النظام من منشئي المهام والمستلمين ونطاق وصولهم"
      >
        <TabBar tabs={TABS} value={tab} onChange={setTab} />
        {tab === "creators" ? <CreatorsPanel /> : <ReceiversPanel />}
      </TasksModuleShell>
    </AppShell>
  );
}

/* ============================= Creators panel ============================= */
function CreatorsPanel() {
  const { data: rows = [], isLoading } = useRows("task_creator_permissions", {
    orderBy: "created_at",
  });
  const { data: employees = [] } = useRows("employees", {
    orderBy: "full_name",
    ascending: true,
  });
  const save = useSaveRow("task_creator_permissions");
  const del = useDeleteRow("task_creator_permissions");
  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    if (!term.trim()) return rows;
    const t = term.trim().toLowerCase();
    return rows.filter((r) =>
      ["employee_name", "emp_no", "branch", "department"].some((k) =>
        String(r[k] ?? "").toLowerCase().includes(t),
      ),
    );
  }, [rows, term]);

  const openNew = () =>
    setDraft({
      employee_id: "",
      employee_name: "",
      emp_no: "",
      branch: "",
      department: "",
      can_create: true,
      can_edit: false,
      can_delete: false,
      can_view_reports: true,
      branch_scope: "own",
      department_scope: "own",
      reports_scope: "own_only",
      is_active: true,
    });

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filtered.map((r, i) => ({
      "م": i + 1,
      "اسم الموظف": r["employee_name"] ?? "—",
      "الرقم الوظيفي": r["emp_no"] ?? "—",
      "الفرع": r["branch"] ?? "—",
      "القسم": r["department"] ?? "—",
      "إنشاء مهمة": r["can_create"] ? "نعم" : "لا",
      "تعديل مهمة": r["can_edit"] ? "نعم" : "لا",
      "حذف مهمة": r["can_delete"] ? "نعم" : "لا",
      "عرض التقارير": r["can_view_reports"] ? "نعم" : "لا",
      "نطاق الفرع": scopeLabel(String(r["branch_scope"] ?? "own")),
      "نطاق القسم": scopeLabel(String(r["department_scope"] ?? "own")),
      "نطاق التقارير": reportsLabel(String(r["reports_scope"] ?? "own_only")),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "منشئي_المهام");
    XLSX.writeFile(wb, "صلاحيات_منشئي_المهام.xlsx");
  };

  return (
    <>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
        <MaterialIcon name="person_add" size={19} className="text-primary" filled />
        <h3 className="text-sm font-bold text-foreground">منشئي المهام</h3>
      </div>

      <div
        className="mt-3 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
            المنشئين المصرح لهم
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          <div className="relative">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الوظيفي..."
              className={`${control} h-9 w-60 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <button
            onClick={exportExcel}
            title="تصدير Excel"
            className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary hover:bg-emerald-50 hover:text-emerald-700"
          >
            <MaterialIcon name="table_view" size={17} />
          </button>
          <Btn icon="person_add" onClick={openNew}>
            إضافة منشئ
          </Btn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {[
                  "المستخدم",
                  "الفرع",
                  "القسم",
                  "الصلاحيات الممنوحة",
                  "نطاق الفرع",
                  "نطاق القسم",
                  "نطاق التقارير",
                  "إجراءات",
                ].map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(isLoading || filtered.length === 0) && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {isLoading ? "جارٍ التحميل..." : "لم يتم إضافة أي منشئ مهام حتى الآن"}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={String(r["id"])}
                  className="border-b border-border last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                        <MaterialIcon name="person" size={16} filled />
                      </span>
                      <span>
                        <span className="block text-[13px] font-bold text-foreground">
                          {String(r["employee_name"] ?? "—")}
                        </span>
                        {r["emp_no"] && (
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            #{String(r["emp_no"])}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground">
                    {String(r["branch"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground">
                    {String(r["department"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {r["can_create"] && <Chip label="إنشاء" tone="green" />}
                      {r["can_edit"] && <Chip label="تعديل" tone="blue" />}
                      {r["can_delete"] && <Chip label="حذف" tone="amber" />}
                      {r["can_view_reports"] && <Chip label="تقارير" tone="teal" />}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {scopeLabel(String(r["branch_scope"] ?? "own"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {scopeLabel(String(r["department_scope"] ?? "own"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {reportsLabel(String(r["reports_scope"] ?? "own_only"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-1">
                      <button
                        title="تعديل"
                        onClick={() => setDraft({ ...r })}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-primary hover:bg-accent"
                      >
                        <MaterialIcon name="edit" size={17} />
                      </button>
                      <button
                        title="حذف"
                        onClick={() => {
                          if (confirm(`هل تريد حذف صلاحية منشئ للموظف "${r["employee_name"]}"؟`)) {
                            del.mutate(String(r["id"]));
                            toast.success("تم حذف الصلاحية");
                          }
                        }}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground hover:bg-rose-100 hover:text-rose-700"
                      >
                        <MaterialIcon name="delete" size={17} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <CreatorModal
          draft={draft}
          employees={employees}
          onChange={setDraft}
          onSave={async () => {
            if (!String(draft["employee_name"] ?? "").trim()) {
              toast.error("يرجى اختيار الموظف أو كتابة اسمه");
              return;
            }
            await save.mutateAsync(draft);
            toast.success("تم حفظ صلاحيات المنشئ بنجاح");
            setDraft(null);
          }}
          onClose={() => setDraft(null)}
          saving={save.isPending}
        />
      )}
    </>
  );
}

function CreatorModal({
  draft,
  employees,
  onChange,
  onSave,
  onClose,
  saving,
}: {
  draft: Row;
  employees: Row[];
  onChange: (r: Row) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <MaterialIcon name="person_add" size={22} className="text-primary" filled />
          <div>
            <h3 className="text-sm font-extrabold text-foreground">
              {draft["id"] ? "تعديل صلاحيات منشئ" : "إضافة منشئ مهام جديد"}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              اختر الموظف وحدد نطاق الفروع والأقسام والتقارير المسموح له بها
            </p>
          </div>
          <button
            onClick={onClose}
            className="ms-auto text-muted-foreground hover:text-foreground"
          >
            <MaterialIcon name="close" size={22} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Employee Picker */}
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-primary">
              <MaterialIcon name="badge" size={17} filled />
              الموظف (تعبئة تلقائية للرقم والفرع والقسم)
            </h4>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-foreground">
                  اختيار من الموظفين
                </span>
                <select
                  className={control}
                  value={String(draft["employee_id"] ?? "")}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = employees.find((x) => String(x["id"]) === empId);
                    if (emp) {
                      onChange({
                        ...draft,
                        employee_id: empId,
                        employee_name: String(emp["full_name"] ?? ""),
                        emp_no: String(emp["emp_no"] ?? ""),
                        branch: String(emp["branch"] ?? draft["branch"] ?? ""),
                        department: String(emp["department"] ?? draft["department"] ?? ""),
                      });
                    }
                  }}
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((emp) => (
                    <option key={String(emp["id"])} value={String(emp["id"])}>
                      {String(emp["full_name"])} {emp["emp_no"] ? `(#${emp["emp_no"]})` : ""}{" "}
                      - {String(emp["department"] || "")}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <FieldText
                  label="اسم الموظف"
                  required
                  placeholder="الاسم"
                  value={String(draft["employee_name"] ?? "")}
                  onChange={(v) => onChange({ ...draft, employee_name: v })}
                />
                <FieldText
                  label="الرقم الوظيفي"
                  placeholder="10001"
                  value={String(draft["emp_no"] ?? "")}
                  onChange={(v) => onChange({ ...draft, emp_no: v })}
                />
              </div>
            </div>
          </section>

          {/* Branch & Department */}
          <section className="rounded-2xl border border-border bg-secondary/40 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
              <MaterialIcon name="business" size={17} className="text-primary" filled />
              الفرع والقسم التابع له
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldText
                label="الفرع"
                placeholder="الفرع الرئيسي"
                value={String(draft["branch"] ?? "")}
                onChange={(v) => onChange({ ...draft, branch: v })}
              />
              <FieldText
                label="القسم"
                placeholder="الموارد البشرية"
                value={String(draft["department"] ?? "")}
                onChange={(v) => onChange({ ...draft, department: v })}
              />
            </div>
          </section>

          {/* Permissions */}
          <section className="rounded-2xl border border-border bg-secondary/40 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
              <MaterialIcon name="admin_panel_settings" size={17} className="text-primary" filled />
              الأذونات
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "can_create", label: "إنشاء مهمة", icon: "add_task" },
                { key: "can_edit", label: "تعديل مهمة", icon: "edit_note" },
                { key: "can_delete", label: "حذف المهمة", icon: "delete" },
                { key: "can_view_reports", label: "عرض التقارير", icon: "assessment" },
              ].map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <MaterialIcon name={p.icon} size={19} className="text-primary" />
                  <span className="me-auto text-[13px] font-bold">{p.label}</span>
                  <Toggle
                    checked={Boolean(draft[p.key])}
                    onChange={(v) => onChange({ ...draft, [p.key]: v })}
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Scopes */}
          <section className="rounded-2xl border border-border bg-secondary/40 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
              <MaterialIcon name="hub" size={17} className="text-primary" filled />
              نطاق الصلاحيات
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldSelect
                label="نطاق الصلاحية للفرع"
                value={String(draft["branch_scope"] ?? "own")}
                options={SCOPE_OPTIONS}
                onChange={(v) => onChange({ ...draft, branch_scope: v })}
              />
              <FieldSelect
                label="نطاق الصلاحية للقسم"
                value={String(draft["department_scope"] ?? "own")}
                options={SCOPE_OPTIONS}
                onChange={(v) => onChange({ ...draft, department_scope: v })}
              />
              <FieldSelect
                label="نطاق التقارير"
                value={String(draft["reports_scope"] ?? "own_only")}
                options={REPORTS_SCOPE}
                onChange={(v) => onChange({ ...draft, reports_scope: v })}
              />
            </div>
          </section>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90 shadow-sm"
          >
            <MaterialIcon name="save" size={18} /> {saving ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-bold hover:bg-secondary"
          >
            <MaterialIcon name="close" size={18} /> إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================= Receivers panel ============================ */
function ReceiversPanel() {
  const { data: rows = [], isLoading } = useRows("task_receiver_permissions", {
    orderBy: "created_at",
  });
  const { data: employees = [] } = useRows("employees", {
    orderBy: "full_name",
    ascending: true,
  });
  const save = useSaveRow("task_receiver_permissions");
  const del = useDeleteRow("task_receiver_permissions");
  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    if (!term.trim()) return rows;
    const t = term.trim().toLowerCase();
    return rows.filter((r) =>
      ["employee_name", "emp_no", "branch", "department"].some((k) =>
        String(r[k] ?? "").toLowerCase().includes(t),
      ),
    );
  }, [rows, term]);

  const openNew = () =>
    setDraft({
      employee_id: "",
      employee_name: "",
      emp_no: "",
      branch: "",
      department: "",
      branch_scope: "own",
      department_scope: "own",
      is_active: true,
    });

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filtered.map((r, i) => ({
      "م": i + 1,
      "اسم الموظف": r["employee_name"] ?? "—",
      "الرقم الوظيفي": r["emp_no"] ?? "—",
      "الفرع": r["branch"] ?? "—",
      "القسم": r["department"] ?? "—",
      "نطاق الفرع": scopeLabel(String(r["branch_scope"] ?? "own")),
      "نطاق القسم": scopeLabel(String(r["department_scope"] ?? "own")),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "مستلمي_المهام");
    XLSX.writeFile(wb, "صلاحيات_مستلمي_المهام.xlsx");
  };

  return (
    <>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
        <MaterialIcon name="assignment_ind" size={19} className="text-primary" filled />
        <h3 className="text-sm font-bold text-foreground">مستلمي المهام</h3>
      </div>

      <div
        className="mt-3 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
            المستلمين المصرح لهم
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          <div className="relative">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم الوظيفي..."
              className={`${control} h-9 w-60 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <button
            onClick={exportExcel}
            title="تصدير Excel"
            className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary hover:bg-emerald-50 hover:text-emerald-700"
          >
            <MaterialIcon name="table_view" size={17} />
          </button>
          <Btn icon="person_add" onClick={openNew}>
            إضافة مستلم
          </Btn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {["المستخدم", "الفرع", "القسم", "نطاق الفرع", "نطاق القسم", "الحالة", "إجراءات"].map(
                  (c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                    >
                      {c}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(isLoading || filtered.length === 0) && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {isLoading ? "جارٍ التحميل..." : "لم يتم إضافة أي مستلم للمهام حتى الآن"}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={String(r["id"])}
                  className="border-b border-border last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
                        <MaterialIcon name="person" size={16} filled />
                      </span>
                      <span>
                        <span className="block text-[13px] font-bold text-foreground">
                          {String(r["employee_name"] ?? "—")}
                        </span>
                        {r["emp_no"] && (
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            #{String(r["emp_no"])}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground">
                    {String(r["branch"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground">
                    {String(r["department"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {scopeLabel(String(r["branch_scope"] ?? "own"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {scopeLabel(String(r["department_scope"] ?? "own"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r["is_active"] !== false ? (
                      <Chip label="مفعّل" tone="green" />
                    ) : (
                      <Chip label="معطّل" tone="muted" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-1">
                      <button
                        title="تعديل"
                        onClick={() => setDraft({ ...r })}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-primary hover:bg-accent"
                      >
                        <MaterialIcon name="edit" size={17} />
                      </button>
                      <button
                        title="حذف"
                        onClick={() => {
                          if (confirm(`هل تريد حذف صلاحية مستلم للموظف "${r["employee_name"]}"؟`)) {
                            del.mutate(String(r["id"]));
                            toast.success("تم حذف الصلاحية");
                          }
                        }}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground hover:bg-rose-100 hover:text-rose-700"
                      >
                        <MaterialIcon name="delete" size={17} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon name="assignment_ind" size={22} className="text-primary" filled />
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  {draft["id"] ? "تعديل صلاحيات مستلم" : "إضافة مستلم مهام جديد"}
                </h3>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  تحديد نطاق استلام المهام للموظف
                </p>
              </div>
              <button
                onClick={() => setDraft(null)}
                className="ms-auto text-muted-foreground hover:text-foreground"
              >
                <MaterialIcon name="close" size={22} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Employee selection */}
              <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-primary">
                  <MaterialIcon name="badge" size={17} filled />
                  الموظف المستلم
                </h4>
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-foreground">
                      اختيار من الموظفين
                    </span>
                    <select
                      className={control}
                      value={String(draft["employee_id"] ?? "")}
                      onChange={(e) => {
                        const empId = e.target.value;
                        const emp = employees.find((x) => String(x["id"]) === empId);
                        if (emp) {
                          setDraft({
                            ...draft,
                            employee_id: empId,
                            employee_name: String(emp["full_name"] ?? ""),
                            emp_no: String(emp["emp_no"] ?? ""),
                            branch: String(emp["branch"] ?? draft["branch"] ?? ""),
                            department: String(emp["department"] ?? draft["department"] ?? ""),
                          });
                        }
                      }}
                    >
                      <option value="">اختر الموظف...</option>
                      {employees.map((emp) => (
                        <option key={String(emp["id"])} value={String(emp["id"])}>
                          {String(emp["full_name"])} {emp["emp_no"] ? `(#${emp["emp_no"]})` : ""}{" "}
                          - {String(emp["department"] || "")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldText
                      label="اسم الموظف"
                      required
                      placeholder="ابحث بالاسم"
                      value={String(draft["employee_name"] ?? "")}
                      onChange={(v) => setDraft({ ...draft, employee_name: v })}
                    />
                    <FieldText
                      label="رقم الموظف"
                      value={String(draft["emp_no"] ?? "")}
                      onChange={(v) => setDraft({ ...draft, emp_no: v })}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="business" size={17} className="text-primary" filled />
                  الفرع والقسم
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldText
                    label="الفرع"
                    value={String(draft["branch"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, branch: v })}
                  />
                  <FieldText
                    label="القسم"
                    value={String(draft["department"] ?? "")}
                    onChange={(v) => setDraft({ ...draft, department: v })}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="hub" size={17} className="text-primary" filled />
                  نطاق استلام المهام
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldSelect
                    label="نطاق الصلاحية للفرع"
                    value={String(draft["branch_scope"] ?? "own")}
                    options={SCOPE_OPTIONS}
                    onChange={(v) => setDraft({ ...draft, branch_scope: v })}
                  />
                  <FieldSelect
                    label="نطاق الصلاحية للقسم"
                    value={String(draft["department_scope"] ?? "own")}
                    options={SCOPE_OPTIONS}
                    onChange={(v) => setDraft({ ...draft, department_scope: v })}
                  />
                </div>
              </section>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <button
                onClick={async () => {
                  if (!String(draft["employee_name"] ?? "").trim()) {
                    toast.error("يرجى اختيار الموظف أو كتابة اسمه");
                    return;
                  }
                  await save.mutateAsync(draft);
                  toast.success("تم حفظ صلاحيات المستلم بنجاح");
                  setDraft(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90 shadow-sm"
              >
                <MaterialIcon name="save" size={18} /> حفظ
              </button>
              <button
                onClick={() => setDraft(null)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-bold hover:bg-secondary"
              >
                <MaterialIcon name="close" size={18} /> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================= tiny helpers =============================== */
function FieldText({
  label,
  required,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      <input
        className={control}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">{label}</span>
      <select className={control} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "-translate-x-0.5" : "-translate-x-[22px]"
        }`}
      />
    </button>
  );
}
