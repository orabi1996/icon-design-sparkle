import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";
import { useRows } from "@/lib/hr-db";

export const Route = createFileRoute("/regulations/shifts")({
  head: () => ({
    meta: [
      { title: "تهيئة مجموعات الدوام والحضور | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "تهيئة مجموعات الدوام وأوقات الحضور والانصراف ودقائق السماح، وإدارة سجلات حضور الموظفين إضافة وتعديلاً وحذفاً.",
      },
      { property: "og:title", content: "تهيئة مجموعات الدوام والحضور" },
      { property: "og:description", content: "مجموعات الدوام وسجلات الحضور اليومية مرتبطة بقاعدة البيانات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shifts,
});

const tabs = [
  { key: "groups", label: "مجموعات الدوام", icon: "schedule" },
  { key: "records", label: "سجلات الحضور والانصراف", icon: "how_to_reg" },
];

function Shifts() {
  const [tab, setTab] = useState("groups");
  const employees = useRows("employees", { orderBy: "emp_no", ascending: true }).data ?? [];
  const names = employees.map((e) => String(e["full_name"]));

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "الدوام", "تهيئة مجموعات الدوام"]} />
      <PageBanner
        icon="schedule"
        title="تهيئة مجموعات الدوام"
        subtitle="مجموعات الدوام وأوقاتها وسجلات الحضور اليومية للموظفين"
      />

      <div
        className="mt-4 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {tabs.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <MaterialIcon name={t.icon} size={17} filled={on} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "groups" ? (
        <CrudTable
          table="work_shift_groups"
          title="مجموعات الدوام"
          addLabel="إضافة مجموعة دوام"
          orderBy="name"
          ascending
          fields={[
            { key: "name", label: "اسم المجموعة", required: true },
            { key: "branch", label: "الفرع", type: "select", options: ["الفرع الرئيسي", "فرع جدة", "فرع الدمام"] },
            { key: "work_days", label: "أيام العمل", type: "number" },
            { key: "start_time", label: "وقت الحضور" },
            { key: "end_time", label: "وقت الانصراف" },
            { key: "break_minutes", label: "دقائق الراحة", type: "number" },
            { key: "grace_minutes", label: "دقائق السماح", type: "number" },
            { key: "active", label: "مفعّل", type: "checkbox" },
            { key: "notes", label: "ملاحظات", type: "textarea" },
          ]}
        />
      ) : (
        <CrudTable
          table="attendance_records"
          title="سجلات الحضور"
          addLabel="إضافة سجل حضور"
          orderBy="work_date"
          fields={[
            { key: "employee_name", label: "الموظف", type: "select", options: names, required: true },
            { key: "work_date", label: "التاريخ", type: "date" },
            { key: "check_in", label: "وقت الحضور" },
            { key: "check_out", label: "وقت الانصراف" },
            { key: "status", label: "الحالة", type: "select", options: ["حاضر", "متأخر", "غائب", "أجازة", "إذن"] },
            { key: "late_minutes", label: "دقائق التأخير", type: "number" },
          ]}
        />
      )}
    </div>
  );
}
