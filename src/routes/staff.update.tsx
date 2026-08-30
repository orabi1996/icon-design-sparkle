import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { EmployeeExcelImport } from "@/components/hr/EmployeeExcelImport";
import { EmployeeExcelUpdate } from "@/components/hr/EmployeeExcelUpdate";
import { RelativeExcelImport } from "@/components/hr/RelativeExcelImport";
import { StaffBulkExcelImport } from "@/components/hr/StaffBulkExcelImport";
import type { StaffBulkTemplateKey } from "@/lib/staff-bulk-templates";
import { Breadcrumbs, Btn, Card, Field, PageBanner, Select } from "@/components/hr/ui";

export const Route = createFileRoute("/staff/update")({
  head: () => ({
    meta: [
      { title: "تحديث البيانات | رفع وتحديث بيانات الموظفين" },
      {
        name: "description",
        content:
          "تحديث بيانات الموظفين والرواتب والمستندات والحسابات البنكية عبر رفع ملفات Excel وتحميل النماذج الجاهزة.",
      },
      { property: "og:title", content: "تحديث البيانات | رفع وتحديث بيانات الموظفين" },
      {
        property: "og:description",
        content: "رفع نماذج التحديث الجماعي لبيانات الموظفين والرواتب والاستحقاقات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffUpdate,
});

type Section = {
  key: string;
  label: string;
  icon: string;
  filters?: { label: string; options?: string[]; kind?: "check" }[];
  columns?: string[];
  rowCount?: number;
  total?: number;
  searchOnly?: boolean;
};

const sections: Section[] = [
  {
    key: "employees",
    label: "إضافة بيانات الموظفين",
    icon: "person_add",
    columns: [
      "الرقم الوظيفي",
      "اسم الموظف",
      "تاريخ الميلاد",
      "القسم",
      "الفرع",
      "الجنس",
      "رقم الهوية",
      "تاريخ مباشرة العمل",
      "الفئة الوظيفية",
      "مفعل",
      "مستثنى من خصومات البصمة",
      "الجنسية",
      "الديانة",
      "الحالة الاجتماعية",
      "مكان الميلاد",
    ],
  },
  {
    key: "employee",
    label: "تحديث البيانات موظف",
    icon: "manage_accounts",
    columns: [
      "الرقم الوظيفي",
      "اسم الموظف",
      "اسم الموظف بالإنجليزية",
      "تاريخ الميلاد",
      "الجنس",
      "رقم الهوية",
      "تاريخ مباشرة العمل",
      "الجنسية",
      "الديانة",
      "الحالة الاجتماعية",
      "مكان الميلاد",
      "الوظيفة الحالية",
      "رقم الجوال",
      "تاريخ التعيين",
    ],
  },
  { key: "relatives", label: "رفع ملفات الأقارب", icon: "groups" },
  {
    key: "facility",
    label: "تحديث بيانات المنشأة",
    icon: "apartment",
    columns: ["رقم الهوية", "رقم مكتب العمل"],
  },
  {
    key: "salaries",
    label: "تحديث بيانات رواتب الموظفين",
    icon: "payments",
    filters: [
      { label: "الفرع", options: ["اختر ....", "الرئيسي", "جدة", "الدمام"] },
      { label: "القسم", options: ["اختر ....", "التسويق", "المالية", "تقنية المعلومات"] },
    ],
    columns: ["اسم الموظف", "الرقم الوظيفي", "رقم الهوية", "الحالة", "الراتب الأساسي"],
    rowCount: 10,
    total: 278,
  },
  {
    key: "documents",
    label: "تحديث مستندات الموظفين",
    icon: "description",
    filters: [
      { label: "اسم المستند", options: ["Select ...", "الهوية الوطنية", "جواز السفر", "الشهادة"] },
    ],
  },
  {
    key: "entitlement",
    label: "اضافة استحقاق",
    icon: "add_circle",
    filters: [
      { label: "السنة", options: ["اختر ....", "٢٠٢٥", "٢٠٢٦"] },
      { label: "الشهور", options: ["اختر ....", "يناير", "فبراير", "مارس"] },
      { label: "الاستحقاق", options: ["اختر ....", "بدل سكن", "بدل نقل", "مكافأة"] },
      { label: "افتراضي", kind: "check" },
    ],
    columns: ["السنة", "الشهور", "الاستحقاقات", "افتراضي", "الرقم الوظيفي", "القيمة"],
  },
  {
    key: "deduction",
    label: "اضافة استقطاع",
    icon: "remove_circle",
    filters: [
      { label: "السنة", options: ["اختر ....", "٢٠٢٥", "٢٠٢٦"] },
      { label: "الشهور", options: ["اختر ....", "يناير", "فبراير", "مارس"] },
      { label: "الاستقطاع", options: ["اختر ....", "غياب", "تأخير", "سلفة"] },
      { label: "افتراضي", kind: "check" },
    ],
    columns: ["السنة", "الشهور", "الاستقطاعات", "افتراضي", "الرقم الوظيفي", "القيمة", "ملاحظات"],
  },
  {
    key: "custom",
    label: "اضافة الاستحقاقات المخصصة",
    icon: "redeem",
    searchOnly: true,
    filters: [
      { label: "الفرع", options: ["اختر ....", "الرئيسي", "جدة", "الدمام"] },
      { label: "القسم", options: ["اختر ....", "التسويق", "المالية", "العمليات"] },
      { label: "الاستحقاق", options: ["اختر ....", "بدل سكن", "بدل نقل"] },
    ],
  },
  {
    key: "bank",
    label: "إضافة الحساب البنكي",
    icon: "account_balance",
    columns: ["الرقم الوظيفي", "رمز البنك", "رقم الحساب", "حالة الحساب البنكي", "طريقة القبض"],
  },
];

const bulkImportKeys = new Set<StaffBulkTemplateKey>([
  "facility",
  "salaries",
  "documents",
  "entitlement",
  "deduction",
  "bank",
]);

function StaffUpdate() {
  const [active, setActive] = useState(sections[0]!.key);
  const s = sections.find((x) => x.key === active)!;

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["عمليات شؤون الموظفين", "بيانات الموظفين", "تحديث البيانات"]} />
      <PageBanner
        icon="cloud_sync"
        title="تحديث البيانات"
        subtitle="رفع النماذج وتحديث بيانات الموظفين بشكل جماعي"
        actions={
          <Btn icon="help" variant="onDark">
            دليل الرفع
          </Btn>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          <Card>
            {s.key === "custom" && s.filters && s.filters.length > 0 && (
              <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {s.filters.map((f) =>
                  f.kind === "check" ? (
                    <label key={f.label} className="flex items-center gap-2 self-end pb-2.5">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="size-4 accent-[var(--primary)]"
                      />
                      <span className="text-[12px] font-bold">{f.label}</span>
                    </label>
                  ) : (
                    <Field key={f.label} label={f.label}>
                      <Select options={f.options ?? ["اختر ...."]} />
                    </Field>
                  ),
                )}
                {s.searchOnly && (
                  <div className="self-end">
                    <Btn icon="search">بحث</Btn>
                  </div>
                )}
              </div>
            )}
            {!s.searchOnly &&
              (s.key === "employees" ? (
                <EmployeeExcelImport />
              ) : s.key === "employee" ? (
                <EmployeeExcelUpdate />
              ) : s.key === "relatives" ? (
                <RelativeExcelImport />
              ) : bulkImportKeys.has(s.key as StaffBulkTemplateKey) ? (
                <StaffBulkExcelImport
                  kind={s.key as StaffBulkTemplateKey}
                  title={s.label}
                  icon={s.icon}
                />
              ) : (
                <></>
              ))}
          </Card>
        </div>

        <aside
          className="h-fit overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="flex items-center gap-2 border-b border-border px-4 py-3.5 text-sm font-bold">
            <MaterialIcon name="sync_alt" size={19} className="text-primary" filled />
            تحديث البيانات
          </h2>
          <nav className="space-y-1 p-2">
            {sections.map((item) => {
              const on = item.key === active;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition-colors ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <MaterialIcon
                    name={item.icon}
                    size={18}
                    filled={on}
                    className={on ? "" : "text-primary"}
                  />
                  <span className="text-start">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
