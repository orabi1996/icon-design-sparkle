import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";
import { TasksModuleShell, TabBar } from "@/components/hr/TasksModuleShell";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRows, useSaveRow, type Row } from "@/lib/hr-db";

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

  return (
    <AppShell>
      <Breadcrumbs trail={["إدارة المهام الإضافية", "التهيئة"]} />
      <TasksModuleShell
        icon="settings"
        title="التهيئة"
        subtitle="تهيئة تصنيفات المهام والأولويات والحالات"
      >
        <TabBar tabs={TABS} value={tab} onChange={setTab} />

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
          <MaterialIcon name="stacks" size={19} className="text-primary" filled />
          <h3 className="text-sm font-bold">{title}</h3>
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
  const { data: rows = [], isLoading } = useRows("task_statuses", {
    orderBy: "sort_order",
    ascending: true,
  });
  const save = useSaveRow("task_statuses");
  const [draft, setDraft] = useState<Row | null>(null);
  const control =
    "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

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
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            حالات نظام ثابتة — التعديل على الأسماء فقط
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-right">
            <thead>
              <tr className="bg-secondary">
                {["اسم الحقل بالعربية", "اسم الحقل بالإنجليزية", "الكود", "اللون", "تعديل"].map(
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
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    جارٍ التحميل...
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={String(r["id"])}
                  className="border-b border-border last:border-0 odd:bg-secondary/35"
                >
                  <td className="px-4 py-3 text-[13px] font-bold">{String(r["name_ar"])}</td>
                  <td className="px-4 py-3 text-[13px]">{String(r["name_en"] ?? "—")}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                    {String(r["code"])}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block size-4 rounded-full ring-1 ring-border"
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
                      className="grid size-8 place-items-center rounded-lg bg-secondary text-primary transition-colors hover:bg-accent"
                    >
                      <MaterialIcon name="edit" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-topbar/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <MaterialIcon name="edit" size={20} className="text-primary" filled />
              <h3 className="text-sm font-extrabold">تعديل الحالة</h3>
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
                <span className="mb-1.5 block text-[12px] font-bold text-foreground/80">اللون</span>
                <input
                  className={control}
                  placeholder="#3b82f6"
                  value={String(draft["color"] ?? "")}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
              <button
                onClick={async () => {
                  await save.mutateAsync(draft);
                  setDraft(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90"
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
