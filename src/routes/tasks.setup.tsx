import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";
import { TasksModuleShell, TabBar } from "@/components/hr/TasksModuleShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveRow, type Row } from "@/lib/hr-db";
import {
  DEFAULT_TASK_STATUSES,
  DEFAULT_TASK_PRIORITIES,
  DEFAULT_TASK_CATEGORIES,
} from "@/lib/task-core";

export const Route = createFileRoute("/tasks/setup")({
  head: () => ({
    meta: [
      { title: "تهيئة إدارة المهام" },
      { name: "description", content: "تهيئة تصنيفات المهام والأولويات والحالات." },
    ],
  }),
  component: TasksSetupPage,
});

type TabId = "categories" | "priorities" | "statuses";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "categories", label: "تصنيف المهمة", icon: "sell" },
  { id: "priorities", label: "الأولوية", icon: "priority_high" },
  { id: "statuses",   label: "الحالة",   icon: "flag" },
];

function TasksSetupPage() {
  const [tab, setTab] = useState<TabId>("categories");
  const title =
    tab === "categories"
      ? "تهيئة تصنيفات المهام"
      : tab === "priorities"
        ? "تهيئة أولويات المهام"
        : "تهيئة حالات المهام";

  const { data: rawCats = [] } = useRows("task_categories");
  const { data: rawPris = [] } = useRows("task_priorities");
  const saveCat = useSaveRow("task_categories");
  const savePri = useSaveRow("task_priorities");

  // Seed default categories if empty
  const initDefaultCategories = async () => {
    try {
      for (const c of DEFAULT_TASK_CATEGORIES) {
        await saveCat.mutateAsync({
          name_ar: c.name_ar,
          name_en: c.name_en,
          is_active: c.is_active,
        });
      }
      toast.success("تمت تهيئة التصنيفات الافتراضية بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء تهيئة التصنيفات");
    }
  };

  // Seed default priorities if empty
  const initDefaultPriorities = async () => {
    try {
      for (const p of DEFAULT_TASK_PRIORITIES) {
        await savePri.mutateAsync({
          name_ar: p.name_ar,
          name_en: p.name_en,
          color: p.color,
          sort_order: p.sort_order,
          is_active: p.is_active,
        });
      }
      toast.success("تمت تهيئة الأولويات الافتراضية بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء تهيئة الأولويات");
    }
  };

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "التهيئة"]} />
      <TasksModuleShell
        icon="settings"
        title="التهيئة"
        subtitle="تهيئة تصنيفات المهام والأولويات والحالات"
      >
        <TabBar tabs={TABS} value={tab} onChange={setTab} />

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <MaterialIcon name="stacks" size={19} className="text-primary" filled />
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
          </div>

          {tab === "categories" && rawCats.length === 0 && (
            <button
              onClick={initDefaultCategories}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              <MaterialIcon name="auto_fix_high" size={16} />
              تهيئة التصنيفات الافتراضية
            </button>
          )}

          {tab === "priorities" && rawPris.length === 0 && (
            <button
              onClick={initDefaultPriorities}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              <MaterialIcon name="auto_fix_high" size={16} />
              تهيئة الأولويات الافتراضية
            </button>
          )}
        </div>

        {tab === "categories" && (
          <CrudTable
            table="task_categories"
            title="تصنيفات المهام"
            addLabel="إضافة تصنيف"
            searchKeys={["name_ar", "name_en"]}
            orderBy="name_ar"
            ascending
            fields={[
              { key: "name_ar", label: "اسم الحقل بالعربية", required: true },
              { key: "name_en", label: "اسم الحقل بالإنجليزية" },
              { key: "is_active", label: "مفعّل", type: "checkbox" },
            ]}
          />
        )}

        {tab === "priorities" && (
          <CrudTable
            table="task_priorities"
            title="أولويات المهام"
            addLabel="إضافة أولوية"
            searchKeys={["name_ar", "name_en"]}
            orderBy="sort_order"
            ascending
            fields={[
              { key: "name_ar", label: "اسم الحقل بالعربية", required: true },
              { key: "name_en", label: "اسم الحقل بالإنجليزية" },
              { key: "color", label: "اللون (مثال: #ef4444)" },
              { key: "sort_order", label: "الترتيب", type: "number" },
              { key: "is_active", label: "مفعّل", type: "checkbox" },
            ]}
          />
        )}

        {tab === "statuses" && <StatusesTab />}
      </TasksModuleShell>
    </AppShell>
  );
}

function StatusesTab() {
  const { data: rawRows = [], isLoading } = useRows("task_statuses", {
    orderBy: "sort_order",
    ascending: true,
  });
  const save = useSaveRow("task_statuses");
  const [draft, setDraft] = useState<Row | null>(null);

  const control =
    "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

  // Effective rows (fallback to DEFAULT_TASK_STATUSES if not yet in database)
  const rows = rawRows.length > 0 ? rawRows : DEFAULT_TASK_STATUSES;

  const initDefaultStatuses = async () => {
    try {
      for (const s of DEFAULT_TASK_STATUSES) {
        await save.mutateAsync({
          code: s.code,
          name_ar: s.name_ar,
          name_en: s.name_en,
          color: s.color,
          sort_order: s.sort_order,
          is_system: true,
        });
      }
      toast.success("تم حفظ وتثبيت حالات المهام الافتراضية بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء حفظ الحالات");
    }
  };

  return (
    <>
      <div
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="me-auto flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name="flag" size={19} className="text-primary" filled />
            حالات المهام
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
              {rows.length}
            </span>
          </h2>

          {rawRows.length === 0 ? (
            <button
              onClick={initDefaultStatuses}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
            >
              <MaterialIcon name="save" size={16} />
              تثبيت الحالات الافتراضية في النظام
            </button>
          ) : (
            <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
              حالات نظام قياسية — يمكن تعديل المسميات والألوان والترتيب
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {["الترتيب", "اسم الحقل بالعربية", "اسم الحقل بالإنجليزية", "الكود", "معاينة اللون", "إجراءات"].map(
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
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr
                  key={String(r["id"] || r["code"] || idx)}
                  className="border-b border-border last:border-0 odd:bg-secondary/35 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-bold text-muted-foreground">
                    #{r["sort_order"] ?? idx + 1}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-foreground">
                    {String(r["name_ar"])}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {String(r["name_en"] ?? "—")}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-primary">
                    {String(r["code"])}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block size-4 rounded-full ring-2 ring-white/60 shadow-xs"
                        style={{ backgroundColor: String(r["color"] ?? "#64748b") }}
                      />
                      <code className="text-[11px] font-semibold text-muted-foreground">
                        {String(r["color"] ?? "")}
                      </code>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDraft({ ...r })}
                      className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <MaterialIcon name="edit" size={15} />
                      تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon name="edit" size={20} className="text-primary" filled />
              <div>
                <h3 className="text-sm font-extrabold text-foreground">تعديل حالة المهمة</h3>
                <span className="font-mono text-xs text-muted-foreground">
                  الكود: {String(draft["code"])}
                </span>
              </div>
              <button
                onClick={() => setDraft(null)}
                className="ms-auto text-muted-foreground hover:text-foreground"
              >
                <MaterialIcon name="close" size={20} />
              </button>
            </div>
            <div className="grid gap-4 p-5">
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  الاسم بالعربية
                </span>
                <input
                  className={control}
                  value={String(draft["name_ar"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  الاسم بالإنجليزية
                </span>
                <input
                  className={control}
                  value={String(draft["name_en"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  كود اللون
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="size-10 cursor-pointer rounded-lg border border-border p-1"
                    value={String(draft["color"] || "#3b82f6")}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  />
                  <input
                    className={`${control} font-mono`}
                    placeholder="#3b82f6"
                    value={String(draft["color"] ?? "")}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  />
                </div>
              </label>
              <label>
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">
                  الترتيب
                </span>
                <input
                  type="number"
                  className={control}
                  value={Number(draft["sort_order"] ?? 0)}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <button
                onClick={async () => {
                  await save.mutateAsync(draft);
                  toast.success("تم تحديث الحالة بنجاح");
                  setDraft(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90 shadow-sm"
              >
                <MaterialIcon name="save" size={18} /> حفظ التعديلات
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
