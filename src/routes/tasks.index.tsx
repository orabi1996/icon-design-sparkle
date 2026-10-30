import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn } from "@/components/hr/ui";
import { MaterialIcon } from "@/components/MaterialIcon";
import { TasksModuleShell } from "@/components/hr/TasksModuleShell";
import { useRows, useSaveRow, useDeleteRow, type Row } from "@/lib/hr-db";
import {
  DEFAULT_TASK_STATUSES,
  DEFAULT_TASK_PRIORITIES,
  DEFAULT_TASK_CATEGORIES,
  generateNextTaskNumber,
  calculateDurationDays,
  isTaskOverdue,
  exportTasksToExcel,
  printTasksReport,
  printTaskJobOrder,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
  type SubtaskItem,
  type TaskComment,
} from "@/lib/task-core";

export const Route = createFileRoute("/tasks/")({
  head: () => ({
    meta: [
      { title: "المهام | إدارة المهام الإضافية" },
      {
        name: "description",
        content: "قائمة كاملة بالمهام مع البحث والفلاتر والكانبان التفاعلي والحالة والأولوية.",
      },
    ],
  }),
  component: TasksListPage,
});

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

function StatusBadge({
  code,
  statuses,
}: {
  code: string;
  statuses: TaskStatus[];
}) {
  const s = statuses.find((x) => x.code === code);
  const color = s?.color || "#64748b";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{
        backgroundColor: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {s?.name_ar || code}
    </span>
  );
}

function PriorityBadge({
  priorityId,
  priorityName,
  priorities,
}: {
  priorityId?: string;
  priorityName?: string;
  priorities: TaskPriority[];
}) {
  const p = priorities.find((x) => x.id === priorityId || x.name_ar === priorityName);
  const color = p?.color || "#3b82f6";
  const name = priorityName || p?.name_ar || "متوسط";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}35`,
      }}
    >
      {name}
    </span>
  );
}

function ProgressBar({ progress = 0 }: { progress: number }) {
  const clean = Math.min(Math.max(Number(progress) || 0, 0), 100);
  const tone =
    clean >= 100
      ? "bg-emerald-500"
      : clean >= 60
        ? "bg-blue-500"
        : clean >= 30
          ? "bg-amber-500"
          : "bg-slate-400";

  return (
    <div className="flex w-28 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-300 ${tone}`}
          style={{ width: `${clean}%` }}
        />
      </div>
      <span className="w-8 text-[11px] font-bold text-muted-foreground">
        {clean}%
      </span>
    </div>
  );
}

function DueDateBadge({
  endDate,
  statusCode,
}: {
  endDate?: string;
  statusCode?: string;
}) {
  if (!endDate) return null;
  if (["finished", "closed", "cancelled"].includes(statusCode || "")) {
    return null;
  }
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
        <MaterialIcon name="warning" size={12} />
        متأخرة ({Math.abs(diffDays)} يوم)
      </span>
    );
  }
  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <MaterialIcon name="schedule" size={12} />
        اليوم الموعد النهائي
      </span>
    );
  }
  if (diffDays <= 3) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
        <MaterialIcon name="event" size={12} />
        متبقي {diffDays} أيام
      </span>
    );
  }
  return null;
}

function TasksListPage() {
  const { data: rawTasks = [], isLoading } = useRows("tasks", {
    orderBy: "created_at",
  });
  const { data: rawCats = [] } = useRows("task_categories", {
    orderBy: "name_ar",
    ascending: true,
  });
  const { data: rawPris = [] } = useRows("task_priorities", {
    orderBy: "sort_order",
    ascending: true,
  });
  const { data: rawStatuses = [] } = useRows("task_statuses", {
    orderBy: "sort_order",
    ascending: true,
  });
  const { data: employees = [] } = useRows("employees", {
    orderBy: "full_name",
    ascending: true,
  });

  const save = useSaveRow("tasks");
  const del = useDeleteRow("tasks");

  // Effective lookup sets with defaults
  const statuses: TaskStatus[] = useMemo(() => {
    if (rawStatuses.length === 0) return DEFAULT_TASK_STATUSES;
    return rawStatuses.map((r: Row) => ({
      id: String(r["id"]),
      code: String(r["code"] ?? r["id"]),
      name_ar: String(r["name_ar"] ?? ""),
      name_en: String(r["name_en"] ?? ""),
      color: String(r["color"] ?? "#3b82f6"),
      sort_order: Number(r["sort_order"] ?? 0),
      is_system: Boolean(r["is_system"]),
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

  // Tasks with normalization
  const tasks: Row[] = useMemo(() => {
    return rawTasks.map((t: Row) => ({
      ...t,
      duration_days:
        Number(t["duration_days"]) ||
        calculateDurationDays(t["start_date"] as string, t["end_date"] as string),
      progress: Number(t["progress"] ?? 0),
    }));
  }, [rawTasks]);

  // UI state
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [draggingOverCol, setDraggingOverCol] = useState<string | null>(null);

  // Modals state
  const [draft, setDraft] = useState<Row | null>(null);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [viewingTask, setViewingTask] = useState<Row | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  // Stats calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t["status_code"] === "pending").length;
    const inProgress = tasks.filter((t) => t["status_code"] === "in_progress").length;
    const underReview = tasks.filter((t) => t["status_code"] === "under_review").length;
    const finished = tasks.filter((t) => t["status_code"] === "finished").length;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    return { total, pending, inProgress, underReview, finished, overdue };
  }, [tasks]);

  // Filtered tasks
  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    return tasks.filter((r) => {
      if (statusFilter && r["status_code"] !== statusFilter) return false;
      if (priorityFilter && r["priority_id"] !== priorityFilter) return false;
      if (categoryFilter && r["category_id"] !== categoryFilter) return false;
      if (overdueOnly && !isTaskOverdue(r)) return false;

      if (!t) return true;
      return [
        "task_number",
        "title",
        "assignee_name",
        "branch",
        "department",
        "category_name",
        "description",
      ].some((k) => String(r[k] ?? "").toLowerCase().includes(t));
    });
  }, [tasks, term, statusFilter, priorityFilter, categoryFilter, overdueOnly]);

  // Open New Task Modal
  const openNew = () => {
    const nextNumber = generateNextTaskNumber(tasks);
    const today = new Date().toISOString().slice(0, 10);
    setNewCheckItem("");
    setDraft({
      task_number: nextNumber,
      title: "",
      description: "",
      status_code: "pending",
      priority_id: priorities[1]?.id || priorities[0]?.id || "pri-medium",
      priority_name: priorities[1]?.name_ar || priorities[0]?.name_ar || "متوسط",
      category_id: categories[0]?.id || "cat-admin",
      category_name: categories[0]?.name_ar || "مهام إدارية عامة",
      assignee_id: "",
      assignee_name: "",
      assignee_emp_no: "",
      branch: "",
      department: "",
      start_date: today,
      end_date: "",
      duration_days: 0,
      progress: 0,
      checklist: [],
      comments: [],
      notes: "",
      attachment_url: "",
      attachment_name: "",
    });
  };

  // Quick Status Updater
  const updateTaskStatus = async (task: Row, newStatusCode: string) => {
    const statusObj = statuses.find((s) => s.code === newStatusCode);
    const progress =
      newStatusCode === "finished"
        ? 100
        : newStatusCode === "in_progress" && Number(task["progress"] || 0) === 0
          ? 25
          : Number(task["progress"] || 0);

    const patch: Row = {
      ...task,
      status_code: newStatusCode,
      progress,
      updated_at: new Date().toISOString(),
    };
    if (newStatusCode === "finished" && !task["completed_at"]) {
      patch["completed_at"] = new Date().toISOString();
    }
    await save.mutateAsync(patch);
    toast.success(`تم تحديث حالة المهمة إلى "${statusObj?.name_ar || newStatusCode}"`);
    if (viewingTask && viewingTask["id"] === task["id"]) {
      setViewingTask(patch);
    }
  };

  // Drag and Drop Handler in Kanban
  const handleDrop = async (taskId: string, targetStatusCode: string) => {
    setDraggingOverCol(null);
    const task = tasks.find((t) => String(t["id"]) === taskId);
    if (!task) return;
    if (task["status_code"] === targetStatusCode) return;
    await updateTaskStatus(task, targetStatusCode);
  };

  // Subtask Checklist Helpers
  const addChecklistItemToDraft = () => {
    if (!newCheckItem.trim() || !draft) return;
    const currentList: SubtaskItem[] = Array.isArray(draft["checklist"])
      ? [...(draft["checklist"] as SubtaskItem[])]
      : [];
    const item: SubtaskItem = {
      id: crypto.randomUUID(),
      text: newCheckItem.trim(),
      done: false,
    };
    currentList.push(item);

    const doneCount = currentList.filter((c) => c.done).length;
    const prog = Math.round((doneCount / currentList.length) * 100);

    setDraft({ ...draft, checklist: currentList, progress: prog });
    setNewCheckItem("");
  };

  const removeChecklistItemFromDraft = (id: string) => {
    if (!draft) return;
    const currentList: SubtaskItem[] = Array.isArray(draft["checklist"])
      ? [...(draft["checklist"] as SubtaskItem[])]
      : [];
    const updated = currentList.filter((c) => c.id !== id);
    const doneCount = updated.filter((c) => c.done).length;
    const prog = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : draft["progress"];
    setDraft({ ...draft, checklist: updated, progress: prog });
  };

  const toggleChecklistItemInDraft = (id: string) => {
    if (!draft) return;
    const currentList: SubtaskItem[] = Array.isArray(draft["checklist"])
      ? [...(draft["checklist"] as SubtaskItem[])]
      : [];
    const updated = currentList.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
    const doneCount = updated.filter((c) => c.done).length;
    const prog = Math.round((doneCount / updated.length) * 100);
    setDraft({ ...draft, checklist: updated, progress: prog });
  };

  // Toggle checklist inside Viewing Task modal (and persist immediately)
  const toggleChecklistInView = async (id: string) => {
    if (!viewingTask) return;
    const list: SubtaskItem[] = Array.isArray(viewingTask["checklist"])
      ? [...(viewingTask["checklist"] as SubtaskItem[])]
      : [];
    const updated = list.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
    const doneCount = updated.filter((c) => c.done).length;
    const prog = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : viewingTask["progress"];
    let status = viewingTask["status_code"];
    if (prog >= 100 && status !== "closed") {
      status = "finished";
    }

    const patch: Row = {
      ...viewingTask,
      checklist: updated,
      progress: prog,
      status_code: status,
      updated_at: new Date().toISOString(),
    };
    setViewingTask(patch);
    await save.mutateAsync(patch);
  };

  // Add Comment inside Viewing Task modal
  const addCommentToView = async () => {
    if (!newCommentText.trim() || !viewingTask) return;
    const comments: TaskComment[] = Array.isArray(viewingTask["comments"])
      ? [...(viewingTask["comments"] as TaskComment[])]
      : [];
    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      author: "المسؤول / المشرف",
      text: newCommentText.trim(),
      created_at: new Date().toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    comments.push(newComment);

    const patch: Row = {
      ...viewingTask,
      comments,
      updated_at: new Date().toISOString(),
    };
    setViewingTask(patch);
    setNewCommentText("");
    await save.mutateAsync(patch);
    toast.success("تم إضافة الملاحظة بنجاح");
  };

  // Submit Task (Create / Edit)
  const submitDraft = async () => {
    if (!draft) return;
    if (!String(draft["title"] ?? "").trim()) {
      toast.error("يرجى إدخال عنوان المهمة");
      return;
    }

    const cat = categories.find((c) => c.id === draft["category_id"]);
    const pri = priorities.find((p) => p.id === draft["priority_id"]);

    const start = draft["start_date"] as string;
    const end = draft["end_date"] as string;
    const duration = calculateDurationDays(start, end);

    let progress = Number(draft["progress"] ?? 0);
    let statusCode = String(draft["status_code"] ?? "pending");
    if (progress >= 100 && statusCode !== "finished" && statusCode !== "closed") {
      statusCode = "finished";
    }

    const clean: Row = {
      ...draft,
      task_number: draft["task_number"] || generateNextTaskNumber(tasks),
      category_name: cat?.name_ar ?? draft["category_name"] ?? null,
      priority_name: pri?.name_ar ?? draft["priority_name"] ?? null,
      category_id: draft["category_id"] || null,
      priority_id: draft["priority_id"] || null,
      start_date: start || null,
      end_date: end || null,
      duration_days: duration,
      progress,
      status_code: statusCode,
      updated_at: new Date().toISOString(),
    };

    if (statusCode === "finished" && !clean["completed_at"]) {
      clean["completed_at"] = new Date().toISOString();
    }

    await save.mutateAsync(clean);
    toast.success(draft["id"] ? "تم تحديث المهمة بنجاح" : "تمت إضافة المهمة بنجاح");
    setDraft(null);
  };

  // Delete Task
  const deleteTask = async (task: Row) => {
    if (confirm(`هل أنت متأكد من حذف المهمة "${task["title"]}" نهائياً؟`)) {
      await del.mutateAsync(String(task["id"]));
      toast.success("تم حذف المهمة");
      if (viewingTask && viewingTask["id"] === task["id"]) {
        setViewingTask(null);
      }
    }
  };

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "المهام"]} />
      <TasksModuleShell
        icon="task"
        title="إدارة المهام والعمليات"
        subtitle="متابعة وتنفيذ وتوزيع المهام الإضافية مع لوحة كانبان التفاعلية وقوائم التحقق والتقارير الفورية"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-white/20 p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <MaterialIcon name="table_rows" size={16} />
                جدول
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  viewMode === "kanban"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <MaterialIcon name="view_kanban" size={16} />
                كانبان (سحب وإفلات)
              </button>
            </div>
            <Btn icon="add" variant="onDark" onClick={openNew}>
              إضافة مهمة جديدة
            </Btn>
          </div>
        }
      >
        {/* KPI & Quick Filter Pills */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            onClick={() => {
              setStatusFilter("");
              setOverdueOnly(false);
            }}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all ${
              !statusFilter && !overdueOnly
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="text-[11px] font-bold text-muted-foreground">إجمالي المهام</span>
            <span className="text-xl font-extrabold text-foreground">{stats.total}</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("pending");
              setOverdueOnly(false);
            }}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all ${
              statusFilter === "pending"
                ? "border-blue-500 bg-blue-500/10 shadow-sm"
                : "border-border bg-card hover:border-blue-400"
            }`}
          >
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              قيد الانتظار
            </span>
            <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300">
              {stats.pending}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("in_progress");
              setOverdueOnly(false);
            }}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all ${
              statusFilter === "in_progress"
                ? "border-amber-500 bg-amber-500/10 shadow-sm"
                : "border-border bg-card hover:border-amber-400"
            }`}
          >
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              جاري التنفيذ
            </span>
            <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
              {stats.inProgress}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("under_review");
              setOverdueOnly(false);
            }}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all ${
              statusFilter === "under_review"
                ? "border-purple-500 bg-purple-500/10 shadow-sm"
                : "border-border bg-card hover:border-purple-400"
            }`}
          >
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              قيد المراجعة
            </span>
            <span className="text-xl font-extrabold text-purple-700 dark:text-purple-300">
              {stats.underReview}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusFilter("finished");
              setOverdueOnly(false);
            }}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all ${
              statusFilter === "finished"
                ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                : "border-border bg-card hover:border-emerald-400"
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              تم الإنجاز
            </span>
            <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {stats.finished}
            </span>
          </button>

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-right transition-all ${
              overdueOnly
                ? "border-rose-500 bg-rose-500/15 shadow-sm"
                : "border-border bg-card hover:border-rose-400"
            }`}
          >
            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <MaterialIcon name="warning" size={14} />
              مهام متأخرة
            </span>
            <span className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
              {stats.overdue}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
              <MaterialIcon name="assignment" size={19} className="text-primary" filled />
              قائمة المهام
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {filtered.length} من {tasks.length}
              </span>
            </h2>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${control} h-9 w-36`}
            >
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`${control} h-9 w-32`}
            >
              <option value="">كل الأولويات</option>
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_ar}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${control} h-9 w-36`}
            >
              <option value="">كل الحالات</option>
              {statuses.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name_ar}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث برقم المهمة، العنوان، الموظف..."
                className={`${control} h-9 w-60 pe-9`}
              />
              <MaterialIcon
                name="search"
                size={17}
                className="pointer-events-none absolute inset-y-0 left-3 my-auto h-fit text-muted-foreground"
              />
            </div>

            {/* Actions: Excel & Print */}
            <button
              onClick={() => exportTasksToExcel(filtered, statuses, priorities)}
              title="تصدير إكسيل"
              className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
            >
              <MaterialIcon name="table_view" size={17} />
            </button>
            <button
              onClick={() => printTasksReport(filtered, statuses, "تقرير قائمة المهام")}
              title="طباعة / PDF"
              className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-primary transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
            >
              <MaterialIcon name="print" size={17} />
            </button>
          </div>

          {/* VIEW: Table Mode */}
          {viewMode === "table" ? (
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
                      "الموعد والتنبيه",
                      "نسبة الإنجاز",
                      "الحالة",
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
                        {isLoading ? "جارٍ تحميل المهام..." : "لا توجد مهام مطابقة للبحث أو الفلتر"}
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => {
                    const overdue = isTaskOverdue(r);
                    return (
                      <tr
                        key={String(r["id"])}
                        className={`border-b border-border transition-colors last:border-0 odd:bg-secondary/35 hover:bg-accent/50 ${
                          overdue ? "bg-rose-50/40 dark:bg-rose-950/10" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-primary">
                          <button
                            onClick={() => setViewingTask(r)}
                            className="font-mono text-primary hover:underline"
                          >
                            #{String(r["task_number"] || "—")}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold">
                          <button
                            onClick={() => setViewingTask(r)}
                            className="text-right hover:text-primary"
                          >
                            {String(r["title"] ?? "—")}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                          {String(r["category_name"] ?? "—")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <PriorityBadge
                            priorityId={r["priority_id"] as string}
                            priorityName={r["priority_name"] as string}
                            priorities={priorities}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px]">
                          <span className="font-semibold text-foreground">
                            {String(r["assignee_name"] ?? "غير محدد")}
                          </span>
                          {r["assignee_emp_no"] && (
                            <span className="block text-[10px] text-muted-foreground">
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
                          <span className={overdue ? "font-bold text-rose-600" : ""}>
                            {String(r["end_date"] ?? "—")}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                          <DueDateBadge
                            endDate={r["end_date"] as string}
                            statusCode={r["status_code"] as string}
                          />
                          {!overdue && r["duration_days"] && (
                            <span className="text-[11px] text-muted-foreground block">
                              {r["duration_days"]} يوم
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <ProgressBar progress={Number(r["progress"] ?? 0)} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <select
                            value={String(r["status_code"] ?? "pending")}
                            onChange={(e) => updateTaskStatus(r, e.target.value)}
                            className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold outline-none hover:border-primary focus:border-primary"
                          >
                            {statuses.map((s) => (
                              <option key={s.code} value={s.code}>
                                {s.name_ar}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              title="عرض التفاصيل"
                              onClick={() => setViewingTask(r)}
                              className="grid size-8 place-items-center rounded-lg bg-secondary text-slate-700 transition-colors hover:bg-primary hover:text-white dark:text-slate-300"
                            >
                              <MaterialIcon name="visibility" size={17} />
                            </button>
                            <button
                              title="طباعة أمر تكليف بالمهمة"
                              onClick={() => printTaskJobOrder(r, statuses, priorities)}
                              className="grid size-8 place-items-center rounded-lg bg-secondary text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
                            >
                              <MaterialIcon name="print" size={17} />
                            </button>
                            <button
                              title="تعديل"
                              onClick={() => setDraft({ ...r })}
                              className="grid size-8 place-items-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent"
                            >
                              <MaterialIcon name="edit" size={17} />
                            </button>
                            <button
                              title="حذف"
                              onClick={() => deleteTask(r)}
                              className="grid size-8 place-items-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/30"
                            >
                              <MaterialIcon name="delete" size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW: Interactive Kanban Mode (Drag & Drop) */
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { code: "pending", title: "قيد الانتظار", color: "#3b82f6" },
                { code: "in_progress", title: "جاري التنفيذ", color: "#f59e0b" },
                { code: "under_review", title: "قيد المراجعة", color: "#8b5cf6" },
                { code: "finished", title: "تم الإنجاز", color: "#10b981" },
              ].map((col) => {
                const colTasks = filtered.filter((t) => t["status_code"] === col.code);
                const isOver = draggingOverCol === col.code;

                return (
                  <div
                    key={col.code}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (draggingOverCol !== col.code) setDraggingOverCol(col.code);
                    }}
                    onDragLeave={() => {
                      if (draggingOverCol === col.code) setDraggingOverCol(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData("text/plain");
                      if (taskId) handleDrop(taskId, col.code);
                    }}
                    className={`flex min-h-[420px] flex-col rounded-2xl border p-3 transition-colors ${
                      isOver
                        ? "border-primary bg-primary/10 ring-2 ring-primary/25"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                      <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        {col.title}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-extrabold text-muted-foreground">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh]">
                      {colTasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
                          اسحب المهمة وأفلتها هنا
                        </div>
                      ) : (
                        colTasks.map((t) => {
                          const overdue = isTaskOverdue(t);
                          return (
                            <div
                              key={String(t["id"])}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", String(t["id"]));
                              }}
                              className={`cursor-grab active:cursor-grabbing rounded-xl border border-border bg-card p-3 shadow-xs transition-all hover:border-primary/50 hover:shadow-sm ${
                                overdue ? "border-rose-400 bg-rose-50/30 dark:bg-rose-950/10" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <span className="font-mono font-bold text-primary">
                                  #{String(t["task_number"] || "—")}
                                </span>
                                <PriorityBadge
                                  priorityId={t["priority_id"] as string}
                                  priorityName={t["priority_name"] as string}
                                  priorities={priorities}
                                />
                              </div>

                              <button
                                onClick={() => setViewingTask(t)}
                                className="mt-1.5 block text-right text-[13px] font-bold text-foreground hover:text-primary"
                              >
                                {String(t["title"] ?? "—")}
                              </button>

                              {t["category_name"] && (
                                <span className="mt-1 block text-[11px] text-muted-foreground">
                                  {String(t["category_name"])}
                                </span>
                              )}

                              <div className="mt-2 flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1 font-semibold text-foreground/80">
                                  <MaterialIcon name="person" size={14} className="text-muted-foreground" />
                                  {String(t["assignee_name"] || "غير محدد")}
                                </span>
                                <DueDateBadge
                                  endDate={t["end_date"] as string}
                                  statusCode={t["status_code"] as string}
                                />
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-border/60">
                                <ProgressBar progress={Number(t["progress"] ?? 0)} />
                              </div>

                              <div className="mt-2 flex items-center justify-between pt-1 text-[11px]">
                                <div className="flex gap-1">
                                  <button
                                    title="عرض التفاصيل"
                                    onClick={() => setViewingTask(t)}
                                    className="p-1 text-muted-foreground hover:text-primary"
                                  >
                                    <MaterialIcon name="visibility" size={15} />
                                  </button>
                                  <button
                                    title="أمر تكليف"
                                    onClick={() => printTaskJobOrder(t, statuses, priorities)}
                                    className="p-1 text-muted-foreground hover:text-blue-600"
                                  >
                                    <MaterialIcon name="print" size={15} />
                                  </button>
                                  <button
                                    title="تعديل"
                                    onClick={() => setDraft({ ...t })}
                                    className="p-1 text-muted-foreground hover:text-primary"
                                  >
                                    <MaterialIcon name="edit" size={15} />
                                  </button>
                                </div>

                                {/* Next Status Quick Action */}
                                {col.code === "pending" && (
                                  <button
                                    onClick={() => updateTaskStatus(t, "in_progress")}
                                    className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                                  >
                                    بدء التنفيذ
                                    <MaterialIcon name="arrow_back" size={12} />
                                  </button>
                                )}
                                {col.code === "in_progress" && (
                                  <button
                                    onClick={() => updateTaskStatus(t, "under_review")}
                                    className="flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10.5px] font-bold text-purple-700 hover:bg-purple-500/20 dark:text-purple-300"
                                  >
                                    للمراجعة
                                    <MaterialIcon name="arrow_back" size={12} />
                                  </button>
                                )}
                                {col.code === "under_review" && (
                                  <button
                                    onClick={() => updateTaskStatus(t, "finished")}
                                    className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                                  >
                                    اعتماد الإنجاز
                                    <MaterialIcon name="check" size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </TasksModuleShell>

      {/* ===================== VIEW TASK DETAILS MODAL ===================== */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">
                    #{String(viewingTask["task_number"] || "—")}
                  </span>
                  <StatusBadge
                    code={String(viewingTask["status_code"] ?? "pending")}
                    statuses={statuses}
                  />
                  <PriorityBadge
                    priorityId={viewingTask["priority_id"] as string}
                    priorityName={viewingTask["priority_name"] as string}
                    priorities={priorities}
                  />
                  <DueDateBadge
                    endDate={viewingTask["end_date"] as string}
                    statusCode={viewingTask["status_code"] as string}
                  />
                </div>
                <h2 className="mt-2 text-lg font-extrabold text-foreground">
                  {String(viewingTask["title"] ?? "—")}
                </h2>
                <span className="text-xs font-semibold text-muted-foreground">
                  التصنيف: {String(viewingTask["category_name"] ?? "—")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => printTaskJobOrder(viewingTask, statuses, priorities)}
                  title="طباعة أمر تكليف"
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-primary hover:bg-blue-50 hover:text-blue-700"
                >
                  <MaterialIcon name="print" size={16} />
                  أمر تكليف
                </button>
                <button
                  onClick={() => setViewingTask(null)}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <MaterialIcon name="close" size={20} />
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Progress Bar */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                  <span>نسبة الإنجاز الإجمالية</span>
                  <span className="text-primary font-mono text-sm">{Number(viewingTask["progress"] ?? 0)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(Number(viewingTask["progress"] ?? 0), 100)}%` }}
                  />
                </div>
              </div>

              {/* Assignee & Location Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground">المستلم المسؤول</span>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {String(viewingTask["assignee_name"] || "غير محدد")}
                  </p>
                  {viewingTask["assignee_emp_no"] && (
                    <span className="font-mono text-xs text-muted-foreground">
                      الرقم الوظيفي: #{String(viewingTask["assignee_emp_no"])}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground">الفرع والقسم</span>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {String(viewingTask["branch"] || "—")}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    القسم: {String(viewingTask["department"] || "—")}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <span className="text-[11px] font-bold text-muted-foreground">الفترة والمدة</span>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    من: {String(viewingTask["start_date"] || "—")}
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    إلى: {String(viewingTask["end_date"] || "—")}
                  </p>
                  <span className="text-[11px] font-bold text-primary">
                    المدة: {Number(viewingTask["duration_days"] || 0)} يوم
                  </span>
                </div>
              </div>

              {/* Description */}
              {viewingTask["description"] && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="mb-1 text-xs font-bold text-muted-foreground">الوصف والمتطلبات</h4>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                    {String(viewingTask["description"])}
                  </p>
                </div>
              )}

              {/* Subtasks / Checklist (Interactive) */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <MaterialIcon name="checklist" size={17} className="text-primary" />
                    قائمة بنود ومراحل التنفيذ (انقر لإكمال البند)
                  </h4>
                  {Array.isArray(viewingTask["checklist"]) && viewingTask["checklist"].length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {(viewingTask["checklist"] as SubtaskItem[]).filter((c) => c.done).length} من{" "}
                      {(viewingTask["checklist"] as SubtaskItem[]).length} مكتمل
                    </span>
                  )}
                </div>

                {Array.isArray(viewingTask["checklist"]) && viewingTask["checklist"].length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {(viewingTask["checklist"] as SubtaskItem[]).map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 py-2 text-[13px] hover:bg-secondary/40 px-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleChecklistInView(item.id)}
                          className="size-4 accent-primary cursor-pointer"
                        />
                        <span
                          className={`flex-1 ${
                            item.done ? "line-through text-muted-foreground font-medium" : "font-semibold text-foreground"
                          }`}
                        >
                          {item.text}
                        </span>
                        {item.done && (
                          <span className="text-[10.5px] font-bold text-emerald-600">منجز ✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">لا توجد بنود فرعية مسجلة لهذه المهمة.</p>
                )}
              </div>

              {/* Comments & Activity Log */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MaterialIcon name="forum" size={17} className="text-primary" />
                  سجل الملاحظات والمتابعة اليومية
                </h4>

                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {Array.isArray(viewingTask["comments"]) && viewingTask["comments"].length > 0 ? (
                    (viewingTask["comments"] as TaskComment[]).map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg bg-secondary/50 p-2.5 text-xs border border-border/50"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-primary mb-1">
                          <span>{comment.author}</span>
                          <span className="text-muted-foreground font-normal">{comment.created_at}</span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">لا توجد تعليقات أو تحديثات بعد.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCommentToView();
                      }
                    }}
                    placeholder="اكتب ملاحظة أو توجيه جديد..."
                    className={`${control} h-9 text-xs`}
                  />
                  <button
                    onClick={addCommentToView}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-xs"
                  >
                    <MaterialIcon name="send" size={15} />
                    إرسال
                  </button>
                </div>
              </div>

              {/* Quick status transition actions */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h4 className="mb-2 text-xs font-bold text-muted-foreground">
                  تغيير حالة المهمة سريعاً
                </h4>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => {
                    const active = s.code === viewingTask["status_code"];
                    return (
                      <button
                        key={s.code}
                        disabled={active}
                        onClick={() => updateTaskStatus(viewingTask, s.code)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                          active
                            ? "bg-primary text-white shadow-xs"
                            : "bg-card text-foreground hover:border-primary border border-border hover:bg-secondary"
                        }`}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name_ar}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div className="flex gap-2">
                <Btn
                  icon="edit"
                  onClick={() => {
                    setDraft({ ...viewingTask });
                    setViewingTask(null);
                  }}
                >
                  تعديل المهمة
                </Btn>
                <button
                  onClick={() => deleteTask(viewingTask)}
                  className="flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <MaterialIcon name="delete" size={16} />
                  حذف
                </button>
              </div>
              <Btn variant="ghost" onClick={() => setViewingTask(null)}>
                إغلاق
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ADD / EDIT TASK MODAL ===================== */}
      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon
                name={draft["id"] ? "edit" : "add_task"}
                size={22}
                className="text-primary"
                filled
              />
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  {draft["id"] ? `تعديل المهمة (${draft["task_number"]})` : "إضافة مهمة جديدة"}
                </h3>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  أدخل تفاصيل المهمة وحدد المستلم والأولوية والمواعيد وقوائم التحقق
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
              {/* Task Number (Read-only) */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  رقم المهمة
                </span>
                <input
                  className={`${control} bg-secondary/50 font-mono`}
                  value={String(draft["task_number"] ?? "")}
                  readOnly
                />
              </label>

              {/* Task Title */}
              <label className="sm:col-span-2">
                <span className="mb-1.5 flex items-center gap-1 text-[12px] font-bold text-foreground/80">
                  عنوان المهمة <span className="text-destructive">*</span>
                </span>
                <input
                  className={control}
                  placeholder="مثال: إعداد مسيرات رواتب شهر أكتوبر..."
                  value={String(draft["title"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>

              {/* Category */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  التصنيف
                </span>
                <select
                  className={control}
                  value={String(draft["category_id"] ?? "")}
                  onChange={(e) => {
                    const c = categories.find((cat) => cat.id === e.target.value);
                    setDraft({
                      ...draft,
                      category_id: e.target.value,
                      category_name: c?.name_ar || "",
                    });
                  }}
                >
                  <option value="">اختر التصنيف...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ar}
                    </option>
                  ))}
                </select>
              </label>

              {/* Priority */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  الأولوية
                </span>
                <select
                  className={control}
                  value={String(draft["priority_id"] ?? "")}
                  onChange={(e) => {
                    const p = priorities.find((pri) => pri.id === e.target.value);
                    setDraft({
                      ...draft,
                      priority_id: e.target.value,
                      priority_name: p?.name_ar || "",
                    });
                  }}
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar}
                    </option>
                  ))}
                </select>
              </label>

              {/* Status */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  الحالة
                </span>
                <select
                  className={control}
                  value={String(draft["status_code"] ?? "pending")}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let prog = Number(draft["progress"] ?? 0);
                    if (newStatus === "finished") prog = 100;
                    setDraft({ ...draft, status_code: newStatus, progress: prog });
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name_ar}
                    </option>
                  ))}
                </select>
              </label>

              {/* Employee Selection (Auto-fill) */}
              <label className="sm:col-span-2 xl:col-span-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-primary">
                  <MaterialIcon name="person_search" size={16} />
                  اختيار الموظف المستلم (تعبئة تلقائية للفرع والقسم)
                </span>
                <select
                  className={control}
                  value={String(draft["assignee_id"] ?? "")}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = employees.find((x) => String(x["id"]) === empId);
                    if (emp) {
                      setDraft({
                        ...draft,
                        assignee_id: empId,
                        assignee_name: String(emp["full_name"] ?? ""),
                        assignee_emp_no: String(emp["emp_no"] ?? ""),
                        branch: String(emp["branch"] ?? draft["branch"] ?? ""),
                        department: String(emp["department"] ?? draft["department"] ?? ""),
                      });
                    } else {
                      setDraft({
                        ...draft,
                        assignee_id: "",
                      });
                    }
                  }}
                >
                  <option value="">اختر موظفاً من قائمة الموظفين (أو أدخل يدوياً أدناه)...</option>
                  {employees.map((emp) => (
                    <option key={String(emp["id"])} value={String(emp["id"])}>
                      {String(emp["full_name"])} {emp["emp_no"] ? `(#${emp["emp_no"]})` : ""}{" "}
                      - {String(emp["job_title"] || emp["department"] || "")}
                    </option>
                  ))}
                </select>
              </label>

              {/* Manual Assignee Name */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  اسم المستلم
                </span>
                <input
                  className={control}
                  placeholder="اسم الموظف المستلم"
                  value={String(draft["assignee_name"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, assignee_name: e.target.value })}
                />
              </label>

              {/* Branch */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  الفرع
                </span>
                <input
                  className={control}
                  placeholder="مثال: الفرع الرئيسي"
                  value={String(draft["branch"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, branch: e.target.value })}
                />
              </label>

              {/* Department */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  القسم
                </span>
                <input
                  className={control}
                  placeholder="مثال: الموارد البشرية"
                  value={String(draft["department"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                />
              </label>

              {/* Start Date */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  تاريخ البداية
                </span>
                <input
                  type="date"
                  className={control}
                  value={String(draft["start_date"] ?? "")}
                  onChange={(e) => {
                    const start = e.target.value;
                    const end = String(draft["end_date"] ?? "");
                    const dur = calculateDurationDays(start, end);
                    setDraft({ ...draft, start_date: start, duration_days: dur });
                  }}
                />
              </label>

              {/* End Date */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  تاريخ النهاية
                </span>
                <input
                  type="date"
                  className={control}
                  value={String(draft["end_date"] ?? "")}
                  onChange={(e) => {
                    const end = e.target.value;
                    const start = String(draft["start_date"] ?? "");
                    const dur = calculateDurationDays(start, end);
                    setDraft({ ...draft, end_date: end, duration_days: dur });
                  }}
                />
              </label>

              {/* Duration (Days) */}
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  المدة المحسوبة (أيام)
                </span>
                <input
                  type="number"
                  readOnly
                  className={`${control} bg-secondary/50 font-bold`}
                  value={Number(draft["duration_days"] ?? 0)}
                />
              </label>

              {/* Progress Slider */}
              <div className="sm:col-span-2 xl:col-span-3 rounded-xl border border-border bg-card p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold">
                  <span>نسبة الإنجاز الحالية:</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                    {Number(draft["progress"] ?? 0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="h-2 w-full cursor-pointer accent-primary"
                  value={Number(draft["progress"] ?? 0)}
                  onChange={(e) => {
                    const prog = Number(e.target.value);
                    const status = prog >= 100 ? "finished" : draft["status_code"];
                    setDraft({ ...draft, progress: prog, status_code: status });
                  }}
                />
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>0% لم تبدأ</span>
                  <span>25% تم البدء</span>
                  <span>50% منتصف الإنجاز</span>
                  <span>75% مرحلة متقدمة</span>
                  <span>100% مكتملة</span>
                </div>
              </div>

              {/* Subtasks / Checklist Builder */}
              <div className="sm:col-span-2 xl:col-span-3 rounded-xl border border-border bg-secondary/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <MaterialIcon name="checklist" size={17} className="text-primary" />
                    قائمة البنود والمهام الفرعية (Checklist)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    تُحسب نسبة الإنجاز تلقائياً عند تحديد البنود
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChecklistItemToDraft();
                      }
                    }}
                    placeholder="أدخل بنداً فرعياً للمهمة ثم اضغط إضافة..."
                    className={`${control} h-9 text-xs`}
                  />
                  <button
                    type="button"
                    onClick={addChecklistItemToDraft}
                    className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
                  >
                    <MaterialIcon name="add" size={16} />
                    إضافة بند
                  </button>
                </div>

                {Array.isArray(draft["checklist"]) && draft["checklist"].length > 0 ? (
                  <div className="space-y-1.5">
                    {(draft["checklist"] as SubtaskItem[]).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg bg-card border border-border p-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleChecklistItemInDraft(item.id)}
                          className="size-4 accent-primary cursor-pointer"
                        />
                        <span
                          className={`flex-1 ${
                            item.done ? "line-through text-muted-foreground" : "font-semibold text-foreground"
                          }`}
                        >
                          {item.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItemFromDraft(item.id)}
                          className="p-1 text-muted-foreground hover:text-rose-600"
                        >
                          <MaterialIcon name="close" size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">لم يتم إضافة بنود فرعية بعد.</p>
                )}
              </div>

              {/* Description */}
              <label className="sm:col-span-2 xl:col-span-3">
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  تفاصيل ووصف المهمة
                </span>
                <textarea
                  rows={3}
                  placeholder="أدخل متطلبات المهمة والأهداف المرجوة بالتفصيل..."
                  className={`${control} h-auto py-2`}
                  value={String(draft["description"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>

              {/* Notes */}
              <label className="sm:col-span-2 xl:col-span-3">
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  ملاحظات وتوجيهات إضافية
                </span>
                <textarea
                  rows={2}
                  placeholder="أي ملاحظات أو توجيهات للموظف..."
                  className={`${control} h-auto py-2`}
                  value={String(draft["notes"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <Btn icon="save" onClick={submitDraft}>
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
