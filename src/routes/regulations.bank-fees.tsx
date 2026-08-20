import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/bank-fees")({
  head: () => ({
    meta: [
      { title: "العمولات البنكية | نظام الموارد البشرية" },
      { name: "description", content: "إدارة العمولات البنكية لكل بنك وطريقة قبض مع الإضافة والتعديل والحذف." },
      { property: "og:title", content: "العمولات البنكية | نظام الموارد البشرية" },
      { property: "og:description", content: "إدارة العمولات البنكية لكل بنك وطريقة قبض مع الإضافة والتعديل والحذف." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BankFees,
});

const CATEGORY = "العمولات البنكية";

function BankFees() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح المالية", "العمولات البنكية"]} />
      <PageBanner icon="account_balance" title="العمولات البنكية" subtitle="إضافة وتعديل وحذف البنود وحفظها مباشرة في قاعدة البيانات" />
      <CrudTable
        table="regulation_rules"
        title="العمولات البنكية"
        addLabel="إضافة عمولة بنكية"
        filters={{ category: CATEGORY }}
        fields={[
          { key: "name", label: "الاسم", required: true },
          { key: "value_type", label: "نوع القيمة", type: "select", options: ["مبلغ ثابت", "نسبة"] },
          { key: "amount", label: "القيمة", type: "number" },
          { key: "days", label: "عدد الأيام / المراحل", type: "number" },
          { key: "active", label: "مفعّل", type: "checkbox" },
          { key: "notes", label: "ملاحظات", type: "textarea" },
        ]}
      />
    </div>
  );
}
