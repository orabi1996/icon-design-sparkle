import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
        subtitle="إدارة صلاحيات مستخدمي النظام من منشئي المهام والمستلمين"
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
  const save = useSaveRow("task_creator_permissions");
  const del = useDeleteRow("task_creator_permissions");
  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    if (!term.trim()) return rows;
    return rows.filter((r) =>
      ["employee_name", "emp_no", "branch", "department"].some((k) =>
        String(r[k] ?? "").includes(term.trim()),
      ),
    );
  }, [rows, term]);

  const openNew = () =>
    setDraft({
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

  return (
    <>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
        <MaterialIcon name="person_add" size={19} className="text-primary" filled />
        <h3 className="text-sm font-bold">منشئي المهام</h3>
      </div>

      <div
        className="mt-3 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
            المنشئين
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          <div className="relative">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث..."
              className={`${control} h-9 w-48 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <Btn icon="person_add" onClick={openNew}>
            إضافة موظف
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
                  "الصلاحيات",
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
                    {isLoading ? "جارٍ التحميل..." : "لم يتم إضافة أي موظف"}
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
                        <span className="block text-[13px] font-bold">
                          {String(r["employee_name"] ?? "—")}
                        </span>
                        {r["emp_no"] && (
                          <span className="block text-[10px] font-semibold text-muted-foreground">
                            #{String(r["emp_no"])}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                    {String(r["branch"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]">
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
                        onClick={() => setDraft({ ...r })}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-primary hover:bg-accent"
                      >
                        <MaterialIcon name="edit" size={17} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("هل تريد حذف صلاحية هذا الموظف؟"))
                            del.mutate(String(r["id"]));
                        }}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
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
          onChange={setDraft}
          onSave={async () => {
            if (!String(draft["employee_name"] ?? "").trim()) return;
            await save.mutateAsync(draft);
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
  onChange,
  onSave,
  onClose,
  saving,
}: {
  draft: Row;
  onChange: (r: Row) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-topbar/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <MaterialIcon name="person_add" size={22} className="text-primary" filled />
          <div>
            <h3 className="text-sm font-extrabold">
              {draft["id"] ? "تعديل صلاحيات منشئ" : "إضافة موظف جديد"}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              أدخل بيانات الموظف وحدد صلاحياته على إدارة المهام
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
          {/* Filter */}
          <section className="rounded-2xl border border-border bg-secondary/40 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
              <MaterialIcon name="filter_alt" size={17} className="text-primary" filled />
              تصفية
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldText
                label="الفرع"
                value={String(draft["branch"] ?? "")}
                onChange={(v) => onChange({ ...draft, branch: v })}
              />
              <FieldText
                label="القسم"
                value={String(draft["department"] ?? "")}
                onChange={(v) => onChange({ ...draft, department: v })}
              />
            </div>
          </section>

          {/* Employee */}
          <section className="rounded-2xl border border-border bg-secondary/40 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
              <MaterialIcon name="badge" size={17} className="text-primary" filled />
              الموظف
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldText
                label="اسم الموظف"
                required
                placeholder="ابحث بالاسم"
                value={String(draft["employee_name"] ?? "")}
                onChange={(v) => onChange({ ...draft, employee_name: v })}
              />
              <FieldText
                label="رقم الموظف"
                value={String(draft["emp_no"] ?? "")}
                onChange={(v) => onChange({ ...draft, emp_no: v })}
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
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
          >
            <MaterialIcon name="save" size={18} /> {saving ? "جارٍ الحفظ..." : "إضافة"}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-rose-100 px-4 py-2.5 text-[13px] font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-200"
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
  const save = useSaveRow("task_receiver_permissions");
  const del = useDeleteRow("task_receiver_permissions");
  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    if (!term.trim()) return rows;
    return rows.filter((r) =>
      ["employee_name", "emp_no", "branch", "department"].some((k) =>
        String(r[k] ?? "").includes(term.trim()),
      ),
    );
  }, [rows, term]);

  const openNew = () =>
    setDraft({
      employee_name: "",
      emp_no: "",
      branch: "",
      department: "",
      branch_scope: "own",
      department_scope: "own",
      is_active: true,
    });

  return (
    <>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
        <MaterialIcon name="assignment_ind" size={19} className="text-primary" filled />
        <h3 className="text-sm font-bold">مستلمي المهام</h3>
      </div>

      <div
        className="mt-3 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
            المستلمين
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          <div className="relative">
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث..."
              className={`${control} h-9 w-48 pe-9`}
            />
            <MaterialIcon
              name="search"
              size={17}
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
            />
          </div>
          <Btn icon="person_add" onClick={openNew}>
            إضافة موظف
          </Btn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {["المستخدم", "الفرع", "القسم", "نطاق الفرع", "نطاق القسم", "إجراءات"].map((c) => (
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
                    colSpan={6}
                    className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                  >
                    {isLoading ? "جارٍ التحميل..." : "لم يتم إضافة أي موظف"}
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
                        <span className="block text-[13px] font-bold">
                          {String(r["employee_name"] ?? "—")}
                        </span>
                        {r["emp_no"] && (
                          <span className="block text-[10px] font-semibold text-muted-foreground">
                            #{String(r["emp_no"])}
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                    {String(r["branch"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                    {String(r["department"] ?? "—")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {scopeLabel(String(r["branch_scope"] ?? "own"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[12px] font-semibold">
                    {scopeLabel(String(r["department_scope"] ?? "own"))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="flex items-center gap-1">
                      <button
                        onClick={() => setDraft({ ...r })}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-primary hover:bg-accent"
                      >
                        <MaterialIcon name="edit" size={17} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("هل تريد حذف صلاحية هذا الموظف؟"))
                            del.mutate(String(r["id"]));
                        }}
                        className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-topbar/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon name="assignment_ind" size={22} className="text-primary" filled />
              <div>
                <h3 className="text-sm font-extrabold">
                  {draft["id"] ? "تعديل مستلم" : "إضافة موظف جديد"}
                </h3>
                <p className="text-[11px] font-semibold text-muted-foreground">مستلمي المهام</p>
              </div>
              <button
                onClick={() => setDraft(null)}
                className="ms-auto text-muted-foreground hover:text-foreground"
              >
                <MaterialIcon name="close" size={22} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="filter_alt" size={17} className="text-primary" filled />
                  تصفية
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
                  <MaterialIcon name="badge" size={17} className="text-primary" filled />
                  الموظف
                </h4>
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
              </section>

              <section className="rounded-2xl border border-border bg-secondary/40 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold">
                  <MaterialIcon name="hub" size={17} className="text-primary" filled />
                  نطاق الصلاحيات
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
                  if (!String(draft["employee_name"] ?? "").trim()) return;
                  await save.mutateAsync(draft);
                  setDraft(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
              >
                <MaterialIcon name="save" size={18} /> {save.isPending ? "جارٍ الحفظ..." : "إضافة"}
              </button>
              <button
                onClick={() => setDraft(null)}
                className="flex items-center gap-2 rounded-xl bg-rose-100 px-4 py-2.5 text-[13px] font-bold text-rose-700 hover:bg-rose-200"
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
