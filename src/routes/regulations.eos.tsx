import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/eos")({
  head: () => ({
    meta: [
      { title: "لائحة نهاية الخدمة | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "تهيئة قواعد احتساب مكافأة نهاية الخدمة ونسبها وعدد الأيام مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "لائحة نهاية الخدمة | نظام الموارد البشرية" },
      {
        property: "og:description",
        content:
          "تهيئة قواعد احتساب مكافأة نهاية الخدمة ونسبها وعدد الأيام مع الإضافة والتعديل والحذف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Eos,
});

const CATEGORY = "لائحة نهاية الخدمة";

function Eos() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح المالية", "لائحة نهاية الخدمة"]} />
      <PageBanner
        icon="logout"
        title="لائحة نهاية الخدمة"
        subtitle="إضافة وتعديل وحذف البنود وحفظها مباشرة في قاعدة البيانات"
      />
      <CrudTable
        table="regulation_rules"
        title="قواعد نهاية الخدمة"
        addLabel="إضافة قاعدة نهاية خدمة"
        filters={{ category: CATEGORY }}
        fields={[
          { key: "name", label: "الاسم", required: true },
          {
            key: "value_type",
            label: "نوع القيمة",
            type: "select",
            options: ["نسبة من الأساسي", "مبلغ ثابت", "يوم عمل"],
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
