import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable, type FieldDef } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/settings/basic")({
  head: () => ({
    meta: [
      { title: "تهيئة البيانات الاساسية | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "تهيئة قوائم النظام الأساسية: المسار والأقسام والمستويات والفئات الوظيفية والتخصص والقطاع والجنسية والبنوك مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "تهيئة البيانات الاساسية | نظام الموارد البشرية" },
      {
        property: "og:description",
        content: "إدارة كل القوائم الأساسية للنظام وحفظها مباشرة في قاعدة البيانات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BasicData,
});

type Section = {
  key: string;
  label: string;
  icon: string;
  group: string;
  extra?: FieldDef[];
};

const nameFields = (label: string): FieldDef[] => [
  { key: "name_ar", label: `اسم الحقل بالعربية (${label})`, required: true },
  { key: "name_en", label: `اسم الحقل بالانجليزية (${label})` },
];

const SECTIONS: Section[] = [
  { key: "المسار", label: "المسار", icon: "route", group: "اعدادات بيانات العمل" },
  { key: "القسم الرئيسي", label: "القسم الرئيسي", icon: "account_tree", group: "اعدادات بيانات العمل" },
  { key: "الأقسام", label: "الأقسام", icon: "folder", group: "اعدادات بيانات العمل" },
  {
    key: "المستويات الوظيفية",
    label: "المستويات الوظيفية",
    icon: "menu",
    group: "اعدادات بيانات العمل",
    extra: [
      {
        key: "kind",
        label: "النوع",
        type: "select",
        options: ["افتراضي", "معلم", "ادارة اكاديمية", "اداري"],
      },
      { key: "linked_leaves", label: "الإجازات المرتبطة", type: "textarea" },
    ],
  },
  {
    key: "الفئة الوظيفية",
    label: "الفئة الوظيفية",
    icon: "work",
    group: "اعدادات بيانات العمل",
    extra: [{ key: "linked_leaves", label: "الإجازات المرتبطة", type: "textarea" }],
  },
  { key: "التخصص", label: "التخصص", icon: "badge", group: "اعدادات بيانات العمل" },
  { key: "القطاع", label: "القطاع", icon: "pie_chart", group: "اعدادات بيانات العمل" },
  { key: "الوظيفه الحاليه", label: "الوظيفه الحاليه", icon: "settings_accessibility", group: "اعدادات بيانات العمل" },
  { key: "المسمي الوظيفي", label: "المسمي الوظيفي", icon: "contact_page", group: "اعدادات بيانات العمل" },
  {
    key: "التصنيف المسائلات",
    label: "التصنيف المسائلات",
    icon: "label",
    group: "اعدادات اساسية",
    extra: [
      { key: "penalty", label: "الجزاء" },
      { key: "active", label: "تفعيل / ايقاف", type: "checkbox" },
    ],
  },
  { key: "الحاله الاجتماعيه", label: "الحاله الاجتماعيه", icon: "favorite", group: "اعدادات اساسية" },
  { key: "الجنسيه", label: "الجنسيه", icon: "flag", group: "اعدادات اساسية" },
  { key: "الديانه", label: "الديانه", icon: "menu_book", group: "اعدادات اساسية" },
  { key: "الدولة", label: "الدولة", icon: "public", group: "اعدادات اساسية" },
  {
    key: "بنك",
    label: "بنك",
    icon: "account_balance",
    group: "اعدادات اساسية",
    extra: [
      { key: "code", label: "رمز البنك" },
      { key: "sabb_code", label: "رمز البنك الخاص ب SABB" },
      { key: "flag", label: "بنك صرف الرواتب", type: "checkbox" },
    ],
  },
  {
    key: "نوع العقد",
    label: "نوع العقد",
    icon: "description",
    group: "اعدادات العقود والمستندات والمؤهلات",
    extra: [{ key: "flag", label: "أجير", type: "checkbox" }],
  },
  { key: "الجامعة", label: "الجامعة", icon: "school", group: "اعدادات العقود والمستندات والمؤهلات" },
  {
    key: "المؤهلات الدراسيه",
    label: "المؤهلات الدراسيه",
    icon: "workspace_premium",
    group: "اعدادات العقود والمستندات والمؤهلات",
  },
  {
    key: "بنود العقد",
    label: "بنود العقد",
    icon: "list_alt",
    group: "اعدادات العقود والمستندات والمؤهلات",
    extra: [
      { key: "details", label: "تفاصيل", type: "textarea" },
      { key: "active", label: "تفعيل / ايقاف", type: "checkbox" },
    ],
  },
  {
    key: "المستندات",
    label: "المستندات",
    icon: "folder_open",
    group: "اعدادات العقود والمستندات والمؤهلات",
    extra: [
      {
        key: "kind",
        label: "نوع البند",
        type: "select",
        options: ["الهوية", "العقد", "شهاده", "وثيقه جواز", "اخرى"],
      },
      { key: "ref_number", label: "رقم المستند" },
      { key: "notify_days", label: "عدد ايام التنبيه", type: "number" },
    ],
  },
  { key: "التقيم", label: "التقيم", icon: "star", group: "اعدادات العقود والمستندات والمؤهلات" },
  { key: "التقدير", label: "التقدير", icon: "emoji_events", group: "اعدادات العقود والمستندات والمؤهلات" },
  { key: "نوع التدريب", label: "نوع التدريب", icon: "cast_for_education", group: "اعدادات العقود والمستندات والمؤهلات" },
];

const GROUPS = ["اعدادات بيانات العمل", "اعدادات اساسية", "اعدادات العقود والمستندات والمؤهلات"];

function BasicData() {
  const [active, setActive] = useState(SECTIONS[0]!.key);
  const section = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0]!;

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["إعدادات النظام", "تهيئة البيانات الاساسية"]} />
      <PageBanner
        icon="tune"
        title="تهيئة البيانات الاساسية"
        subtitle="إدارة كل قوائم النظام الأساسية بالعربية والإنجليزية مع الإضافة والتعديل والحذف"
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          {GROUPS.map((g) => (
            <div
              key={g}
              className="overflow-hidden rounded-2xl border border-border bg-card"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h2 className="border-b border-border bg-secondary px-4 py-3 text-[12px] font-extrabold text-secondary-foreground">
                {g}
              </h2>
              <nav className="p-2">
                {SECTIONS.filter((s) => s.group === g).map((s) => {
                  const on = s.key === active;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActive(s.key)}
                      className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-colors ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-accent/60"
                      }`}
                    >
                      <MaterialIcon name={s.icon} size={18} filled={on} />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </aside>

        <div>
          <CrudTable
            key={section.key}
            table="basic_lookups"
            title={section.label}
            addLabel={`إضافة ${section.label}`}
            filters={{ category: section.key }}
            orderBy="created_at"
            ascending
            searchKeys={["name_ar", "name_en"]}
            fields={[...nameFields(section.label), ...(section.extra ?? [])]}
          />
        </div>
      </div>
    </div>
  );
}