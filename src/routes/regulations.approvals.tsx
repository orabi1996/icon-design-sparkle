import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/approvals")({
  head: () => ({
    meta: [
      { title: "سلاسل الموافقات | نظام الموارد البشرية" },
      {
        name: "description",
        content: "تهيئة سلاسل الموافقات وعدد مراحلها لكل نوع طلب مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "سلاسل الموافقات | نظام الموارد البشرية" },
      {
        property: "og:description",
        content: "تهيئة سلاسل الموافقات وعدد مراحلها لكل نوع طلب مع الإضافة والتعديل والحذف.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Approvals,
});

const CATEGORY = "سلاسل الموافقات";

function Approvals() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح", "سلاسل الموافقات"]} />
      <PageBanner
        icon="checklist"
        title="سلاسل الموافقات"
        subtitle="إضافة وتعديل وحذف البنود وحفظها مباشرة في قاعدة البيانات"
      />
      <CrudTable
        table="regulation_rules"
        title="سلاسل الموافقات"
        addLabel="إضافة سلسلة موافقات"
        filters={{ category: CATEGORY }}
        fields={[
          { key: "name", label: "الاسم", required: true },
          {
            key: "value_type",
            label: "نوع القيمة",
            type: "select",
            options: ["مراحل", "مبلغ ثابت"],
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
