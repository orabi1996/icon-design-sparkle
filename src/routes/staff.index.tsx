import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, Btn, Card, Chip, Field, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";
import { money, useRows } from "@/lib/hr-db";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "شؤون الموظفين | إدارة بيانات الموظفين" },
      {
        name: "description",
        content: "استعراض وتصفية بيانات الموظفين حسب الفرع والقسم والحالة مع الإضافة والتعديل والحذف المباشر.",
      },
      { property: "og:title", content: "شؤون الموظفين | إدارة بيانات الموظفين" },
      { property: "og:description", content: "قائمة الموظفين المباشرة مع فلاتر وإجراءات كاملة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffList,
});

const statusOptions = ["نشط", "موقوف", "منتهي الخدمة"];

function StaffList() {
  const { data: employees = [] } = useRows("employees", { orderBy: "emp_no", ascending: true });
  const { data: departments = [] } = useRows("departments", { orderBy: "name", ascending: true });
  const [dept, setDept] = useState("الكل");
  const [status, setStatus] = useState("الكل");

  const deptNames = departments.map((d) => String(d["name"]));
  const branches = [...new Set(employees.map((e) => String(e["branch"] ?? "")))].filter(Boolean);

  const summary = useMemo(() => {
    const active = employees.filter((e) => e["status"] === "نشط").length;
    const cost = employees.reduce((s, e) => s + Number(e["basic_salary"] ?? 0) + Number(e["allowances"] ?? 0), 0);
    return { active, cost };
  }, [employees]);

  const filterRow = (r: Record<string, unknown>) =>
    (dept === "الكل" || r["department"] === dept) && (status === "الكل" || r["status"] === status);

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "شؤون الموظفين"]} />
      <PageBanner
        icon="badge"
        title="شؤون الموظفين"
        subtitle={`${employees.length} موظف · ${summary.active} نشط · تكلفة شهرية ${money(summary.cost)}`}
        actions={
          <Link to="/staff/add">
            <Btn icon="person_add" variant="onDark">
              إضافة موظف
            </Btn>
          </Link>
        }
      />

      <div className="mt-4">
        <Card title="تصفية سريعة" icon="filter_alt">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="القسم">
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none focus:border-primary"
              >
                {["الكل", ...deptNames].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="الحالة الوظيفية">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none focus:border-primary"
              >
                {["الكل", ...statusOptions].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <Btn
                icon="restart_alt"
                variant="ghost"
                onClick={() => {
                  setDept("الكل");
                  setStatus("الكل");
                }}
              >
                إعادة تعيين
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      <CrudTable
        table="employees"
        title="قائمة الموظفين"
        addLabel="إضافة موظف"
        orderBy="emp_no"
        searchKeys={["emp_no", "full_name", "national_id", "job_title", "department"]}
        fields={[
          { key: "emp_no", label: "الرقم الوظيفي", required: true },
          {
            key: "full_name",
            label: "اسم الموظف",
            required: true,
            render: (r) => (
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-foreground">
                  {String(r["full_name"] ?? "؟").charAt(0)}
                </span>
                {String(r["full_name"])}
              </span>
            ),
          },
          { key: "job_title", label: "المسمى الوظيفي" },
          { key: "department", label: "القسم", type: "select", options: deptNames },
          { key: "branch", label: "الفرع", type: "select", options: branches.length ? branches : ["الفرع الرئيسي"] },
          { key: "basic_salary", label: "الراتب الأساسي", type: "number" },
          { key: "allowances", label: "البدلات", type: "number" },
          { key: "hire_date", label: "تاريخ التعيين", type: "date" },
          { key: "contract_end", label: "نهاية العقد", type: "date" },
          { key: "status", label: "الحالة", type: "select", options: statusOptions },
          { key: "national_id", label: "رقم الهوية", formOnly: true },
          { key: "nationality", label: "الجنسية", type: "select", options: ["سعودي", "مصري", "هندي", "يمني", "سوداني", "أخرى"], formOnly: true },
          { key: "gender", label: "الجنس", type: "select", options: ["ذكر", "أنثى"], formOnly: true },
          { key: "phone", label: "الجوال", formOnly: true },
          { key: "email", label: "البريد الإلكتروني", formOnly: true },
          { key: "bank_name", label: "البنك", type: "select", options: ["الراجحي", "الأهلي", "الرياض", "ساب", "الإنماء", "البلاد"], formOnly: true },
          { key: "iban", label: "الآيبان", formOnly: true },
          { key: "manager_name", label: "المدير المباشر", formOnly: true },
        ]}
      />

      {(dept !== "الكل" || status !== "الكل") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] font-bold text-muted-foreground">
          <MaterialIcon name="info" size={16} />
          نتيجة التصفية: {employees.filter(filterRow).length} موظف
          {dept !== "الكل" && <Chip label={dept} tone="blue" />}
          {status !== "الكل" && <Chip label={status} tone="teal" />}
        </div>
      )}
    </div>
  );
}
