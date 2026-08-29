import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Chip } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { TasksModuleShell } from "@/components/hr/TasksModuleShell";
import { useRows } from "@/lib/hr-db";

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

type StatusRow = { code: string; name_ar: string; color?: string };

function statusTone(code: string): "green" | "amber" | "blue" | "muted" | "teal" {
  return code === "finished"
    ? "green"
    : code === "in_progress"
      ? "amber"
      : code === "postponed"
        ? "muted"
        : code === "closed"
          ? "muted"
          : "blue";
}

function TasksReportsPage() {
  const { data: tasks = [] } = useRows("tasks", { orderBy: "created_at" });
  const { data: statuses = [] } = useRows("task_statuses", { orderBy: "sort_order", ascending: true });
  const { data: pris = [] } = useRows("task_priorities", { orderBy: "sort_order", ascending: true });

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [term, setTerm] = useState("");

  const stats = useMemo(() => {
    const total = tasks.length;
    const by = (code: string) => tasks.filter((t) => t["status_code"] === code).length;
    return {
      total,
      pending: by("pending"),
      in_progress: by("in_progress"),
      postponed: by("postponed"),
      finished: by("finished"),
      closed: by("closed"),
    };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((r) => {
      if (statusFilter && r["status_code"] !== statusFilter) return false;
      if (priorityFilter && r["priority_id"] !== priorityFilter) return false;
      const t = term.trim();
      if (!t) return true;
      return ["title", "assignee_name", "branch", "department", "category_name"].some((k) =>
        String(r[k] ?? "").includes(t),
      );
    });
  }, [tasks, statusFilter, priorityFilter, term]);

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "التقارير"]} />
      <TasksModuleShell
        icon="assessment"
        title="التقارير"
        subtitle="ملخص شامل لكل المهام مع فلاتر متعددة وإمكانية التصدير"
      >
        {/* Stat cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="إجمالي المهام" value={stats.total} icon="list_alt" tone="primary" />
          <StatCard title="تم الإنشاء" value={stats.pending} icon="check_circle" tone="blue" />
          <StatCard title="جاري التنفيذ" value={stats.in_progress} icon="schedule" tone="amber" />
          <StatCard title="تم التأجيل" value={stats.postponed} icon="pause_circle" tone="rose" />
          <StatCard title="تم التنفيذ" value={stats.finished} icon="task_alt" tone="emerald" />
          <StatCard title="مغلق" value={stats.closed} icon="lock" tone="muted" />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="filter_alt" size={19} className="text-primary" filled />
            فلتر التقرير
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">الحالة</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={control}
              >
                <option value="">كل الحالات</option>
                {statuses.map((s) => (
                  <option key={String(s["code"])} value={String(s["code"])}>
                    {s["name_ar"] as string}
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
                {pris.map((p) => (
                  <option key={String(p["id"])} value={String(p["id"])}>
                    {p["name_ar"] as string}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">بحث</span>
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
          </div>
        </div>

        {/* Detailed table */}
        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
              <MaterialIcon name="table_rows" size={19} className="text-primary" filled />
              جدول المهام التفصيلي
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                إجمالي {filtered.length} مهمة
              </span>
            </h2>
            {["picture_as_pdf", "table_view", "print"].map((i) => (
              <button
                key={i}
                className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary transition-colors hover:bg-accent"
                title={i === "picture_as_pdf" ? "PDF" : i === "table_view" ? "Excel" : "طباعة"}
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
                    "الأولوية",
                    "الحالة",
                    "ملاحظات",
                    "تاريخ البداية",
                    "تاريخ النهاية",
                    "المدة",
                  ].map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap border-b border-border px-4 py-3 text-[12px] font-extrabold text-secondary-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        {c}
                        <MaterialIcon
                          name="filter_list"
                          size={14}
                          className="text-primary/40"
                        />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-14 text-center text-sm font-semibold text-muted-foreground"
                    >
                      لا توجد بيانات مطابقة
                    </td>
                  </tr>
                )}
                {filtered.map((r) => {
                  const s = (statuses as StatusRow[]).find((x) => x.code === r["status_code"]);
                  return (
                    <tr
                      key={String(r["id"])}
                      className="border-b border-border last:border-0 odd:bg-secondary/35 hover:bg-accent/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-primary">
                        #{String(r["task_number"])}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold">
                        {String(r["title"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        {String(r["category_name"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        {String(r["branch"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        {String(r["department"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        {r["priority_name"] ? (
                          <Chip label={String(r["priority_name"])} tone="teal" />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Chip
                          label={s?.name_ar ?? String(r["status_code"])}
                          tone={statusTone(String(r["status_code"]))}
                        />
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {String(r["notes"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        {String(r["start_date"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                        {String(r["end_date"] ?? "—")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold">
                        {r["duration_days"] ? `${r["duration_days"]} يوم` : "—"}
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
}: {
  title: string;
  value: number;
  icon: string;
  tone: "primary" | "blue" | "amber" | "rose" | "emerald" | "muted";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    muted: "bg-secondary text-muted-foreground",
  };
  return (
    <div
      className="rounded-2xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
          <MaterialIcon name={icon} size={22} filled />
        </span>
        <span className="text-2xl font-black tracking-tight">
          {new Intl.NumberFormat("ar-SA").format(value)}
        </span>
      </div>
      <p className="mt-2 text-[12px] font-bold text-muted-foreground">{title}</p>
    </div>
  );
}
