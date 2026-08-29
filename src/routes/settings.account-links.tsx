import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, PageBanner, Btn } from "@/components/hr/ui";
import { CrudTable, type FieldDef } from "@/components/hr/CrudTable";
import { useSettings, useSaveSettings, type SettingsMap } from "@/lib/hr-db";

export const Route = createFileRoute("/settings/account-links")({
  head: () => ({
    meta: [
      { title: "تهيئة ربط الحسابات | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "ربط بنود الموارد البشرية بالحسابات المحاسبية: اللائحة ومراكز التكلفة والمصروفات الحكومية والأجازات والاستحقاقات والاستقطاعات والجزاءات ونهاية الخدمة وأنواع العمليات.",
      },
      { property: "og:title", content: "تهيئة ربط الحسابات | نظام الموارد البشرية" },
      {
        property: "og:description",
        content: "إدارة ربط قيود الرواتب والسلف والأجازات بالحسابات العامة وحفظها في قاعدة البيانات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountLinks,
});

const jobLevels = [
  "إداري",
  "تعليمي",
  "أكاديمي",
  "اداره اكاديميه",
  "إدارة عامة",
  "تعليمي عليا",
  "مستوى1",
];

const accountLabel = "اختر الحساب ....";

const TABS = [
  { key: "ربط لائحة", label: "ربط لائحة", icon: "rule_settings" },
  { key: "ربط مراكز التكلفة", label: "ربط مراكز التكلفة", icon: "hub" },
  { key: "ربط المصروفات الحكومية", label: "ربط المصروفات الحكومية", icon: "account_balance" },
  { key: "ربط الأجازات", label: "ربط الأجازات", icon: "beach_access" },
  { key: "ربط الاستحقاقات", label: "ربط الاستحقاقات", icon: "payments" },
  { key: "ربط الاستقطاعات", label: "ربط الاستقطاعات", icon: "money_off" },
  { key: "ربط الجزاءات", label: "ربط الجزاءات", icon: "gavel" },
  { key: "ربط نهاية الخدمة", label: "ربط نهاية الخدمة", icon: "person_remove" },
  { key: "ربط نوع العمليات للحسابات العامة", label: "ربط نوع العمليات للحسابات العامة", icon: "swap_horiz" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const control =
  "h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] font-semibold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

/* ---------- form-only tabs (single settings record) ---------- */

function SettingsForm({
  section,
  groups,
}: {
  section: string;
  groups: { title: string; icon: string; fields: { key: string; label: string }[] }[];
}) {
  const { data } = useSettings(section);
  const save = useSaveSettings(section);
  const [values, setValues] = useState<SettingsMap>({});

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  return (
    <div className="mt-4 space-y-4">
      {groups.map((g) => (
        <div
          key={g.title}
          className="rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <MaterialIcon name={g.icon} size={19} className="text-primary" filled />
            {g.title}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {g.fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-muted-foreground">
                  {f.label}
                </span>
                <input
                  className={control}
                  placeholder={accountLabel}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-center">
        <Btn icon="save" onClick={() => save.mutate(values)}>
          حفظ
        </Btn>
      </div>
    </div>
  );
}

/* ---------- table tabs ---------- */

const linkFields = (itemLabel: string, extra: FieldDef[] = []): FieldDef[] => [
  { key: "item_name", label: itemLabel, required: true },
  { key: "job_level", label: "المستوى الوظيفي", type: "select", options: jobLevels },
  ...extra,
  { key: "notes", label: "ملاحظات", type: "textarea", formOnly: true },
];

function TableTab({ tab }: { tab: TabKey }) {
  if (tab === "ربط مراكز التكلفة")
    return (
      <CrudTable
        table="account_links"
        title="ربط مراكز التكلفة"
        addLabel="إضافة ربط مركز تكلفة"
        filters={{ link_type: tab }}
        fields={[
          { key: "branch", label: "الفرع", required: true },
          { key: "department", label: "القسم" },
          { key: "specialty", label: "التخصص" },
          { key: "sector", label: "القطاع" },
          { key: "main_department", label: "القسم الرئيسي" },
          { key: "current_job", label: "الوظيفه الحاليه" },
          { key: "path", label: "المسار" },
          { key: "admin_unit", label: "الوحده الاداريه" },
          { key: "cost_center", label: "مراكز التكلفه" },
          { key: "notes", label: "ملاحظات", type: "textarea", formOnly: true },
        ]}
      />
    );

  if (tab === "ربط المصروفات الحكومية")
    return (
      <CrudTable
        table="account_links"
        title="ربط المصروفات الحكومية"
        addLabel="إضافة ربط مصروف حكومي"
        filters={{ link_type: tab }}
        fields={linkFields("اسم المصروف الحكومي", [
          { key: "expense_account", label: "حساب المصروف" },
          { key: "entitlement_account", label: "حساب الاستحقاق" },
        ])}
      />
    );

  if (tab === "ربط الأجازات")
    return (
      <CrudTable
        table="account_links"
        title="ربط الأجازات"
        addLabel="إضافة ربط أجازة"
        filters={{ link_type: tab }}
        fields={linkFields("اسم الاجازه", [
          { key: "expense_account", label: "حساب مصروف الاجازة" },
          { key: "provision_account", label: "حساب مخصص الاجازة" },
          { key: "entitlement_account", label: "حساب الاستحقاق" },
        ])}
      />
    );

  if (tab === "ربط الاستحقاقات")
    return (
      <CrudTable
        table="account_links"
        title="ربط الاستحقاقات"
        addLabel="إضافة ربط استحقاق"
        filters={{ link_type: tab }}
        fields={linkFields("الاستحقاق", [
          { key: "debit_account", label: "حساب الطرف المدين في قيد الاستحقاق" },
        ])}
      />
    );

  if (tab === "ربط الاستقطاعات")
    return (
      <CrudTable
        table="account_links"
        title="ربط الاستقطاعات"
        addLabel="إضافة ربط استقطاع"
        filters={{ link_type: tab }}
        fields={linkFields("الاستقطاع", [
          { key: "credit_account", label: "حساب الطرف الدائن في الاستحقاق" },
        ])}
      />
    );

  if (tab === "ربط الجزاءات")
    return (
      <CrudTable
        table="account_links"
        title="ربط الجزاءات"
        addLabel="إضافة ربط جزاء"
        filters={{ link_type: tab }}
        fields={linkFields("الجزاء", [
          { key: "credit_account", label: "حساب الطرف الدائن في الاستحقاق" },
        ])}
      />
    );

  return (
    <CrudTable
      table="account_links"
      title="ربط نهاية الخدمة"
      addLabel="إضافة ربط نهاية خدمة"
      filters={{ link_type: tab }}
      fields={[
        { key: "job_title", label: "المسمى الوظيفى", required: true },
        { key: "job_level", label: "المستوى الوظيفي", type: "select", options: jobLevels },
        { key: "expense_account", label: "مصروف نهايه الخدمه" },
        { key: "provision_account", label: "حساب مخصص نهايه الخدمه" },
        { key: "entitlement_account", label: "حساب الاستحقاق" },
        { key: "notes", label: "ملاحظات", type: "textarea", formOnly: true },
      ]}
    />
  );
}

function AccountLinks() {
  const [tab, setTab] = useState<TabKey>("ربط الاستحقاقات");

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["إعدادات النظام", "تهيئة ربط الحسابات"]} />
      <PageBanner
        icon="account_tree"
        title="تهيئة ربط الحسابات"
        subtitle="ربط بنود الموارد البشرية بحسابات النظام المحاسبي وقيود مسير الرواتب"
      />

      <div
        className="mt-4 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-2"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-bold transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <MaterialIcon name={t.icon} size={17} filled={tab === t.key} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ربط لائحة" ? (
        <SettingsForm
          section="account_links_regulation"
          groups={[
            {
              title: "الطرف المدين في قيد الاستحقاق لمسير الرواتب",
              icon: "north_east",
              fields: [{ key: "overtime", label: "لائحة الوقت الاضافي" }],
            },
            {
              title: "الطرف الدائن في قيد الاستحقاق لمسير الرواتب",
              icon: "south_west",
              fields: [
                { key: "absence", label: "لائحة الغياب" },
                { key: "late", label: "لائحة التاخير" },
                { key: "loans", label: "السلف" },
                { key: "early_leave", label: "لائحة الانصراف المبكر" },
                { key: "net", label: "الصافي" },
                { key: "fingerprint", label: "لائحة البصمه" },
              ],
            },
          ]}
        />
      ) : tab === "ربط نوع العمليات للحسابات العامة" ? (
        <SettingsForm
          section="account_links_operations"
          groups={[
            {
              title: "نوع العمليات للحسابات العامة",
              icon: "swap_horiz",
              fields: [
                { key: "loan_installment_payment", label: "سداد اقساط السلف" },
                { key: "payroll_entry", label: "ترحيل قيد مسير الرواتب" },
                { key: "payroll_settlement_entry", label: "ترحيل قيد مسير الرواتب تصفية" },
                { key: "payroll_adjust_entry", label: "ترحيل قيد مسير الرواتب تسوية" },
                { key: "employee_transfer", label: "قيد نقل الموظف لوحدة ادارية مختلفة" },
                { key: "eos_reward", label: "قيد مكافأة نهاية الخدمة" },
                { key: "visa_penalty", label: "قيد سداد غرامة التأشيرات" },
                { key: "annual_leave_allowance", label: "قيد بدلات الاجازات السنويه" },
                { key: "loan_installment_transfer", label: "ترحيل قسط السلفة" },
                { key: "loan_combined_entry", label: "ترحيل القيد المجمع للسلف" },
              ],
            },
          ]}
        />
      ) : (
        <TableTab tab={tab} />
      )}
    </div>
  );
}
