import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/permits")({
  head: () => ({
    meta: [
      { title: "لائحة الأذونات | نظام الموارد البشرية" },
      {
        name: "description",
        content: "إدارة أنواع الأذونات وحدودها بالساعات وحالة التفعيل مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "لائحة الأذونات | نظام الموارد البشرية" },
      {
        property: "og:description",
        content: "إدارة أنواع الأذونات وحدودها بالساعات وحالة التفعيل مع الإضافة والتعديل والحذف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Permits,
});

const CATEGORY = "لائحة الأذونات";

function Permits() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "لائحة الأذونات"]} />
      <PageBanner
        icon="event_available"
        title="لائحة الأذونات"
        subtitle="إضافة وتعديل وحذف البنود وحفظها مباشرة في قاعدة البيانات"
      />
      <CrudTable
        table="regulation_rules"
        title="الأذونات"
        addLabel="إضافة إذن"
        filters={{ category: CATEGORY }}
        fields={[
          { key: "name", label: "الاسم", required: true },
          {
            key: "value_type",
            label: "نوع القيمة",
            type: "select",
            options: ["ساعة", "مبلغ ثابت", "نسبة من الأساسي", "مرات شهرياً"],
          },
          { key: "amount", label: "القيمة", type: "number" },
          { key: "days", label: "عدد الأيام / المراحل", type: "number" },
          { key: "active", label: "مفعّل", type: "checkbox" },
          { key: "notes", label: "ملاحظات", type: "textarea" },
        ]}
      />
    </div>
  );
}
