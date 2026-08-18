import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/regulations/deductions")({
  head: () => ({
    meta: [
      { title: "لائحة الإستقطاعات | اللوائح المالية" },
      {
        name: "description",
        content: "إضافة وتعديل وحذف إستقطاعات الموظفين: التأمينات الاجتماعية وخصومات الغياب والتأخير وأقساط السلف.",
      },
      { property: "og:title", content: "لائحة الإستقطاعات | اللوائح المالية" },
      { property: "og:description", content: "إدارة الإستقطاعات ونسب احتسابها وحفظها في قاعدة البيانات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deductions,
});

function Deductions() {
  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح المالية", "لائحة الإستقطاعات"]} />
      <PageBanner icon="remove_circle" title="لائحة الإستقطاعات" subtitle="إضافة وتعديل الخصومات ونسب احتسابها" />
      <CrudTable
        table="deductions"
        title="الإستقطاعات"
        addLabel="إضافة إستقطاع"
        fields={[
          { key: "name", label: "الإستقطاع", required: true },
          { key: "calc_type", label: "طريقة الاحتساب", type: "select", options: ["مبلغ ثابت", "نسبة من الأساسي", "يوم عمل", "ساعة عمل"] },
          { key: "amount", label: "القيمة", type: "number" },
          { key: "active", label: "مفعّل", type: "checkbox" },
          { key: "notes", label: "ملاحظات", type: "textarea" },
        ]}
      />
    </div>
  );
}
