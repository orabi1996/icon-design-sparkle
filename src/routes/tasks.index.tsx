import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, Chip } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { TasksModuleShell } from "@/components/hr/TasksModuleShell";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";

export const Route = createFileRoute("/tasks/")({
  head: () => ({
    meta: [
      { title: "المهام | إدارة المهام الإضافية" },
      {
        name: "description",
        content: "قائمة كاملة بالمهام مع البحث والفلاتر والحالة والأولوية.",
      },
    ],
  }),
  component: TasksListPage,
});

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

type StatusRow = { code: string; name_ar: string; color?: string };
type CategoryRow = { id: string; name_ar: string };
type PriorityRow = { id: string; name_ar: string; color?: string };

function StatusChip({ code, statuses }: { code: string; statuses: StatusRow[] }) {
  const s = statuses.find((x) => x.code === code);
  const tone =
    code === "finished"
      ? "green"
      : code === "in_progress"
        ? "amber"
        : code === "postponed"
          ? "muted"
          : code === "closed"
            ? "muted"
            : "blue";
  return <Chip label={s?.name_ar ?? code} tone={tone as "green" | "amber" | "muted" | "blue"} />;
}

function TasksListPage() {
  const { data: tasks = [], isLoading } = useRows("tasks", { orderBy: "created_at" });
  const { data: cats = [] } = useRows("task_categories", { orderBy: "name_ar", ascending: true });
  const { data: pris = [] } = useRows("task_priorities", { orderBy: "sort_order", ascending: true });
  const { data: statuses = [] } = useRows("task_statuses", { orderBy: "sort_order", ascending: true });
  const save = useSaveRow("tasks");
  const del = useDeleteRow("tasks");

  const [draft, setDraft] = useState<Row | null>(null);
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    const t = term.trim();
    return tasks.filter((r) => {
      if (statusFilter && r["status_code"] !== statusFilter) return false;
      if (!t) return true;
      return ["title", "assignee_name", "branch", "department", "category_name"].some((k) =>
        String(r[k] ?? "").includes(t),
      );
    });
  }, [tasks, term, statusFilter]);

  const openNew = () =>
    setDraft({
      title: "",
      description: "",
      status_code: "pending",
      priority_id: "",
      category_id: "",
      branch: "",
      department: "",
      assignee_name: "",
      start_date: "",
      end_date: "",
      notes: "",
    });

  const submit = async () => {
    if (!draft) return;
    if (!String(draft["title"] ?? "").trim()) return;
    // stamp category/priority name for reporting
    const cat = cats.find((c) => c["id"] === draft["category_id"]) as CategoryRow | undefined;
    const pri = pris.find((p) => p["id"] === draft["priority_id"]) as PriorityRow | undefined;
    const clean: Row = {
      ...draft,
      category_name: cat?.name_ar ?? null,
      priority_name: pri?.name_ar ?? null,
      category_id: draft["category_id"] || null,
      priority_id: draft["priority_id"] || null,
      start_date: draft["start_date"] || null,
      end_date: draft["end_date"] || null,
    };
    await save.mutateAsync(clean);
    setDraft(null);
  };

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "المهام"]} />
      <TasksModuleShell
        icon="task"
        title="المهام"
        subtitle="قائمة شاملة بالمهام مع البحث والفلاتر"
        actions={
          <Btn icon="add" variant="onDark" onClick={openNew}>
            إضافة مهمة
          </Btn>
        }
      >
        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
              <MaterialIcon name="assignment" size={19} className="text-primary" filled />
              قائمة المهام
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {tasks.length}
              </span>
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${control} h-9 w-40`}
            >
              <option value="">كل الحالات</option>
              {statuses.map((s) => (
                <option key={String(s["code"])} value={String(s["code"])}>
                  {s["name_ar"] as string}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث بعنوان المهمة أو الموظف..."
                className={`${control} h-9 w-64 pe-9`}
              />
              <MaterialIcon
                name="search"
                size={17}
                className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
              />
            </div>
            {["picture_as_pdf", "table_view", "print"].map((i) => (
              <button
                key={i}
                className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary transition-colors hover:bg-accent"
              >
                <MaterialIcon name={i} size={17} />
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-right">
              <thead>
                <tr className="bg-secondary">
                  {[
                    "رقم المهمة",
                    "عنوان المهمة",
                    "التصنيف",
                    "الفرع",
                    "القسم",
                    "المستلم",
                    "الأولوية",
                    "الحالة",
                    "تاريخ البداية",
                    "تاريخ النهاية",
                    "المدة",
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
                      colSpan={12}
                      className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                    >
                      {isLoading ? "جارٍ تحميل المهام..." : "لا توجد مهام مطابقة"}
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr
                    key={String(r["id"])}
                    className="border-b border-border transition-colors last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-primary">
                      #{String(r["task_number"])}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold">{String(r["title"] ?? "—")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["category_name"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">{String(r["branch"] ?? "—")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["department"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["assignee_name"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {r["priority_name"] ? (
                        <Chip label={String(r["priority_name"])} tone="teal" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusChip code={String(r["status_code"] ?? "pending")} statuses={statuses as StatusRow[]} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["start_date"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {String(r["end_date"] ?? "—")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                      {r["duration_days"] ? `${r["duration_days"]} يوم` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="flex items-center gap-1">
                        <button
                          title="تعديل"
                          onClick={() => setDraft({ ...r })}
                          className="grid size-8 place-items-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent"
                        >
                          <MaterialIcon name="edit" size={17} />
                        </button>
                        <button
                          title="حذف"
                          onClick={() => {
                            if (confirm("هل تريد حذف هذه المهمة نهائياً؟"))
                              del.mutate(String(r["id"]));
                          }}
                          className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
      </TasksModuleShell>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-topbar/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon
                name={draft["id"] ? "edit" : "add_task"}
                size={22}
                className="text-primary"
                filled
              />
              <div>
                <h3 className="text-sm font-extrabold">
                  {draft["id"] ? "تعديل مهمة" : "إضافة مهمة جديدة"}
                </h3>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  أدخل تفاصيل المهمة وحدد المستلم والأولوية والحالة
                </p>
              </div>
              <button
                onClick={() => setDraft(null)}
                className="ms-auto text-muted-foreground hover:text-foreground"
              >
                <MaterialIcon name="close" size={22} />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              <label className="sm:col-span-2 xl:col-span-3">
                <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
                  عنوان المهمة <span className="text-destructive">*</span>
                </span>
                <input
                  className={control}
                  value={String(draft["title"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">التصنيف</span>
                <select
                  className={control}
                  value={String(draft["category_id"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                >
                  <option value="">اختر ....</option>
                  {cats.map((c) => (
                    <option key={String(c["id"])} value={String(c["id"])}>
                      {c["name_ar"] as string}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الأولوية</span>
                <select
                  className={control}
                  value={String(draft["priority_id"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, priority_id: e.target.value })}
                >
                  <option value="">اختر ....</option>
                  {pris.map((p) => (
                    <option key={String(p["id"])} value={String(p["id"])}>
                      {p["name_ar"] as string}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الحالة</span>
                <select
                  className={control}
                  value={String(draft["status_code"] ?? "pending")}
                  onChange={(e) => setDraft({ ...draft, status_code: e.target.value })}
                >
                  {statuses.map((s) => (
                    <option key={String(s["code"])} value={String(s["code"])}>
                      {s["name_ar"] as string}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الفرع</span>
                <input
                  className={control}
                  value={String(draft["branch"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, branch: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">القسم</span>
                <input
                  className={control}
                  value={String(draft["department"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">اسم المستلم</span>
                <input
                  className={control}
                  placeholder="اسم الموظف المستلم للمهمة"
                  value={String(draft["assignee_name"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, assignee_name: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">تاريخ البداية</span>
                <input
                  type="date"
                  className={control}
                  value={String(draft["start_date"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">تاريخ النهاية</span>
                <input
                  type="date"
                  className={control}
                  value={String(draft["end_date"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
                />
              </label>

              <label className="sm:col-span-2 xl:col-span-3">
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الوصف</span>
                <textarea
                  rows={3}
                  className={`${control} h-auto py-2`}
                  value={String(draft["description"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>

              <label className="sm:col-span-2 xl:col-span-3">
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">ملاحظات</span>
                <textarea
                  rows={2}
                  className={`${control} h-auto py-2`}
                  value={String(draft["notes"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <Btn icon="save" onClick={submit}>
                {save.isPending ? "جارٍ الحفظ..." : draft["id"] ? "حفظ التعديلات" : "إضافة المهمة"}
              </Btn>
              <Btn icon="close" variant="ghost" onClick={() => setDraft(null)}>
                إلغاء
              </Btn>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
