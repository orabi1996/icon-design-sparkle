import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/other")({
  head: () => ({
    meta: [
      { title: "لوائح أخرى | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "إدارة الجزاءات ومراحل التأشيرات والمصاريف الحكومية وبقية اللوائح مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "لوائح أخرى | نظام الموارد البشرية" },
      {
        property: "og:description",
        content:
          "إدارة الجزاءات ومراحل التأشيرات والمصاريف الحكومية وبقية اللوائح مع الإضافة والتعديل والحذف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Other,
});

const CATEGORY = "لوائح أخرى";

function Other() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "لوائح أخرى"]} />
      <PageBanner
        icon="rule_folder"
        title="لوائح أخرى"
        subtitle="إضافة وتعديل وحذف البنود وحفظها مباشرة في قاعدة البيانات"
      />
      <CrudTable
        table="regulation_rules"
        title="بنود اللوائح الأخرى"
        addLabel="إضافة بند"
        filters={{ category: CATEGORY }}
        fields={[
          { key: "name", label: "الاسم", required: true },
          {
            key: "value_type",
            label: "نوع القيمة",
            type: "select",
            options: ["مبلغ ثابت", "نسبة من الأساسي", "يوم عمل", "مراحل"],
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
