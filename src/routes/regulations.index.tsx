import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/")({
  head: () => ({
    meta: [
      { title: "لائحة الإستحقاقات | اللوائح المالية" },
      {
        name: "description",
        content: "إضافة وتعديل وحذف إستحقاقات الموظفين: بدل السكن والنقل والبدلات الأخرى وطريقة الاحتساب.",
      },
      { property: "og:title", content: "لائحة الإستحقاقات | اللوائح المالية" },
      { property: "og:description", content: "إدارة الإستحقاقات وحفظها مباشرة في قاعدة البيانات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entitlements,
});

function Entitlements() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح المالية", "لائحة الإستحقاقات"]} />
      <PageBanner icon="savings" title="لائحة الإستحقاقات" subtitle="إضافة وتعديل البدلات والاستحقاقات المالية" />
      <CrudTable
        table="entitlements"
        title="الإستحقاقات"
        addLabel="إضافة إستحقاق"
        fields={[
          { key: "name", label: "الإستحقاق", required: true },
          { key: "calc_type", label: "طريقة الاحتساب", type: "select", options: ["مبلغ ثابت", "نسبة من الأساسي", "ساعة عمل", "يوم عمل"] },
          { key: "amount", label: "القيمة", type: "number" },
          { key: "gosi_subject", label: "خاضع للتأمينات", type: "checkbox" },
          { key: "active", label: "مفعّل", type: "checkbox" },
          { key: "notes", label: "ملاحظات", type: "textarea" },
        ]}
      />
    </div>
  );
}
