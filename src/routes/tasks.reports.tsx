import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { TasksModuleShell } from "@/components/hr/TasksModuleShell";
import { useRows, type Row } from "@/lib/hr-db";
import {
  DEFAULT_TASK_STATUSES,
  DEFAULT_TASK_PRIORITIES,
  DEFAULT_TASK_CATEGORIES,
  isTaskOverdue,
  exportTasksToExcel,
  printTasksReport,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
} from "@/lib/task-core";

export const Route = createFileRoute("/tasks/reports")({
  head: () => ({
    meta: [
      { title: "تقارير إدارة المهام" },
      { name: "description", content: "ملخص شامل لكل المهام مع فلاتر متعددة وإمكانية التصدير." },
    ],
  }),
  component: TasksReportsPage,
});

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

function TasksReportsPage() {
  const { data: rawTasks = [], isLoading } = useRows("tasks", { orderBy: "created_at" });
  const { data: rawStatuses = [] } = useRows("task_statuses", { orderBy: "sort_order", ascending: true });
  const { data: rawPris = [] } = useRows("task_priorities", { orderBy: "sort_order", ascending: true });
  const { data: rawCats = [] } = useRows("task_categories", { orderBy: "name_ar", ascending: true });

  const statuses: TaskStatus[] = useMemo(() => {
    if (rawStatuses.length === 0) return DEFAULT_TASK_STATUSES;
    return rawStatuses.map((r: Row) => ({
      id: String(r["id"]),
      code: String(r["code"] ?? r["id"]),
      name_ar: String(r["name_ar"] ?? ""),
      name_en: String(r["name_en"] ?? ""),
      color: String(r["color"] ?? "#3b82f6"),
      sort_order: Number(r["sort_order"] ?? 0),
    }));
  }, [rawStatuses]);

  const priorities: TaskPriority[] = useMemo(() => {
    if (rawPris.length === 0) return DEFAULT_TASK_PRIORITIES;
    return rawPris.map((r: Row) => ({
      id: String(r["id"]),
      code: String(r["code"] ?? r["id"]),
      name_ar: String(r["name_ar"] ?? ""),
      name_en: String(r["name_en"] ?? ""),
      color: String(r["color"] ?? "#3b82f6"),
      sort_order: Number(r["sort_order"] ?? 0),
      is_active: r["is_active"] !== false,
    }));
  }, [rawPris]);

  const categories: TaskCategory[] = useMemo(() => {
    if (rawCats.length === 0) return DEFAULT_TASK_CATEGORIES;
    return rawCats.map((r: Row) => ({
      id: String(r["id"]),
      name_ar: String(r["name_ar"] ?? ""),
      name_en: String(r["name_en"] ?? ""),
      is_active: r["is_active"] !== false,
    }));
  }, [rawCats]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [term, setTerm] = useState("");

  const tasks = rawTasks;

  const stats = useMemo(() => {
    const total = tasks.length;
    const by = (code: string) => tasks.filter((t) => t["status_code"] === code).length;
    const finished = by("finished");
    const completionRate = total > 0 ? Math.round((finished / total) * 100) : 0;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;

    return {
      total,
      pending: by("pending"),
      in_progress: by("in_progress"),
      under_review: by("under_review"),
      finished,
      postponed: by("postponed"),
      closed: by("closed"),
      overdue,
      completionRate,
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((r) => {
      if (statusFilter && r["status_code"] !== statusFilter) return false;
      if (priorityFilter && r["priority_id"] !== priorityFilter) return false;
      if (categoryFilter && r["category_id"] !== categoryFilter) return false;
      if (overdueOnly && !isTaskOverdue(r)) return false;

      if (dateFrom) {
        const start = String(r["start_date"] || "");
        if (start && start < dateFrom) return false;
      }
      if (dateTo) {
        const end = String(r["end_date"] || r["start_date"] || "");
        if (end && end > dateTo) return false;
      }

      const t = term.trim().toLowerCase();
      if (!t) return true;
      return [
        "task_number",
        "title",
        "assignee_name",
        "assignee_emp_no",
        "branch",
        "department",
        "category_name",
      ].some((k) => String(r[k] ?? "").toLowerCase().includes(t));
    });
  }, [tasks, statusFilter, priorityFilter, categoryFilter, overdueOnly, dateFrom, dateTo, term]);

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "التقارير"]} />
      <TasksModuleShell
        icon="assessment"
        title="تقارير المهام والإنتاجية"
        subtitle="تحليل شامل للمهام مع فلاتر التاريخ وحالة الإنجاز والالتزام الزمني وإمكانية التصدير"
      >
        {/* Stat Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard
            title="إجمالي المهام"
            value={stats.total}
            icon="list_alt"
            tone="primary"
            onClick={() => {
              setStatusFilter("");
              setOverdueOnly(false);
            }}
          />
          <StatCard
            title="قيد الانتظار"
            value={stats.pending}
            icon="schedule"
            tone="blue"
            onClick={() => {
              setStatusFilter("pending");
              setOverdueOnly(false);
            }}
          />
          <StatCard
            title="جاري التنفيذ"
            value={stats.in_progress}
            icon="autorenew"
            tone="amber"
            onClick={() => {
              setStatusFilter("in_progress");
              setOverdueOnly(false);
            }}
          />
          <StatCard
            title="تم الإنجاز"
            value={stats.finished}
            icon="task_alt"
            tone="emerald"
            onClick={() => {
              setStatusFilter("finished");
              setOverdueOnly(false);
            }}
          />
          <StatCard
            title="مهام متأخرة"
            value={stats.overdue}
            icon="warning"
            tone="rose"
            onClick={() => setOverdueOnly(!overdueOnly)}
          />
          <StatCard
            title="معدل الإنجاز"
            value={`${stats.completionRate}%`}
            icon="pie_chart"
            tone="teal"
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MaterialIcon name="filter_alt" size={19} className="text-primary" filled />
              فلاتر التقرير
            </h3>
            {(statusFilter || priorityFilter || categoryFilter || dateFrom || dateTo || overdueOnly || term) && (
              <button
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setCategoryFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setOverdueOnly(false);
                  setTerm("");
                }}
                className="text-xs font-bold text-primary hover:underline"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الحالة</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={control}
              >
                <option value="">كل الحالات</option>
                {statuses.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الأولوية</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={control}
              >
                <option value="">كل الأولويات</option>
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_ar}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">التصنيف</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={control}
              >
                <option value="">كل التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                بحث بالرقم أو الموظف أو العنوان
              </span>
              <div className="relative">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="ابحث..."
                  className={`${control} pe-9`}
                />
                <MaterialIcon
                  name="search"
                  size={17}
                  className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
                />
              </div>
            </label>

            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                من تاريخ
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={control}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                إلى تاريخ
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={control}
              />
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                عرض المهام المتأخرة فقط
              </span>
            </label>
          </div>
        </div>

        {/* Detailed Table */}
        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
              <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
              نتائج التقرير التفصيلي
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                إجمالي {filtered.length} مهمة
              </span>
            </h2>

            {/* Real Export Buttons */}
            <button
              onClick={() => exportTasksToExcel(filtered, statuses, priorities, "تقرير_المهام_التفصيلي.xlsx")}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
              title="تصدير Excel"
            >
              <MaterialIcon name="table_view" size={16} />
              تصدير Excel
            </button>
            <button
              onClick={() => printTasksReport(filtered, statuses, "تقرير المهام والإنتاجية")}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
              title="طباعة / PDF"
            >
              <MaterialIcon name="print" size={16} />
              طباعة / PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-right">
              <thead>
                <tr className="bg-secondary">
                  {[
                    "رقم المهمة",
                    "عنوان المهمة",
                    "التصنيف",
                    "الأولوية",
                    "المستلم",
                    "الفرع / القسم",
                    "تاريخ البداية",
                    "تاريخ النهاية",
                    "نسبة الإنجاز",
                    "الحالة",
                    "الالتزام الزمني",
                    "ملاحظات",
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
                      {isLoading ? "جارٍ إعداد التقرير..." : "لا توجد نتائج مطابقة لشروط الفلتر"}
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const s = statuses.find((x) => x.code === r["status_code"]);
                  const p = priorities.find((x) => x.id === r["priority_id"]);
                  const overdue = isTaskOverdue(r);

                  return (
                    <tr
                      key={String(r["id"])}
                      className="border-b border-border last:border-0 odd:bg-secondary/35 hover:bg-accent/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-bold text-primary">
                        #{String(r["task_number"] || "—")}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-foreground">
                        {String(r["title"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted-foreground">
                        {String(r["category_name"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                        <span
                          className="rounded px-2 py-0.5 font-bold"
                          style={{
                            backgroundColor: `${p?.color || "#3b82f6"}15`,
                            color: p?.color || "#3b82f6",
                          }}
                        >
                          {String(r["priority_name"] || p?.name_ar || "—")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        <span className="font-bold text-foreground">
                          {String(r["assignee_name"] ?? "—")}
                        </span>
                        {r["assignee_emp_no"] && (
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            #{String(r["assignee_emp_no"])}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-muted-foreground">
                        {String(r["branch"] || "—")} / {String(r["department"] || "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                        {String(r["start_date"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                        {String(r["end_date"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(Number(r["progress"] ?? 0), 100)}%` }}
                            />
                          </div>
                          <span className="font-bold">{Number(r["progress"] ?? 0)}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            backgroundColor: `${s?.color || "#64748b"}18`,
                            color: s?.color || "#64748b",
                            border: `1px solid ${s?.color || "#64748b"}40`,
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: s?.color || "#64748b" }}
                          />
                          {s?.name_ar || r["status_code"]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {overdue ? (
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            متأخرة
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            في الموعد
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-[12px] text-muted-foreground">
                        {String(r["notes"] ?? "—")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </TasksModuleShell>
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: string;
  tone: "primary" | "blue" | "amber" | "rose" | "emerald" | "muted" | "teal";
  onClick?: () => void;
}) {
  const toneClasses = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    rose: "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400",
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    muted: "border-border bg-card text-muted-foreground",
    teal: "border-teal-500/30 bg-teal-500/5 text-teal-600 dark:text-teal-400",
  }[tone];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${toneClasses} ${
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      }`}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-card shadow-xs">
        <MaterialIcon name={icon} size={20} filled />
      </span>
      <div>
        <p className="text-[11px] font-bold text-muted-foreground">{title}</p>
        <p className="text-xl font-extrabold text-foreground">{value}</p>
      </div>
    </div>
  );
}
