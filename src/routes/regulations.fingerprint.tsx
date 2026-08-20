import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/fingerprint")({
  head: () => ({
    meta: [
      { title: "خصومات البصمة | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "إدارة خصومات البصمة والتأخير وقيم الجزاءات المرتبطة بها مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "خصومات البصمة | نظام الموارد البشرية" },
      {
        property: "og:description",
        content:
          "إدارة خصومات البصمة والتأخير وقيم الجزاءات المرتبطة بها مع الإضافة والتعديل والحذف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fingerprint,
});

const CATEGORY = "خصومات البصمة";

function Fingerprint() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "خصومات البصمة"]} />
      <PageBanner
        icon="fingerprint"
        title="خصومات البصمة"
        subtitle="إضافة وتعديل وحذف البنود وحفظها مباشرة في قاعدة البيانات"
      />
      <CrudTable
        table="regulation_rules"
        title="خصومات البصمة"
        addLabel="إضافة خصم بصمة"
        filters={{ category: CATEGORY }}
        fields={[
          { key: "name", label: "الاسم", required: true },
          {
            key: "value_type",
            label: "نوع القيمة",
            type: "select",
            options: ["مبلغ ثابت", "نسبة من الأساسي", "يوم عمل", "ساعة عمل"],
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
