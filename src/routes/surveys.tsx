import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";

export const Route = createFileRoute("/surveys")({
  head: () => ({
    meta: [
      { title: "الاستبيانات و التعميم | شؤون الموظفين" },
      {
        name: "description",
        content: "إنشاء التعميمات والاستبيانات وإرسالها للموظفين مع تحديد النوع والجهة المستهدفة ونص الرسالة.",
      },
      { property: "og:title", content: "الاستبيانات و التعميم" },
      { property: "og:description", content: "إضافة وتعديل وحذف التعميمات والاستبيانات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Surveys,
});

function Surveys() {
  return (
    <AppShell>
      <div className="mt-4">
        <Breadcrumbs trail={["شئون الموظفين", "الاستبيانات و التعميم"]} />
        <PageBanner icon="campaign" title="الاستبيانات و التعميم" subtitle="إنشاء تعميم أو استبيان وإرساله للموظفين" />
        <CrudTable
          table="announcements"
          title="التعميمات والاستبيانات"
          addLabel="إضافة تعميم"
          fields={[
            { key: "title", label: "العنوان", required: true },
            { key: "kind", label: "النوع", type: "select", options: ["تعميم", "استبيان"] },
            {
              key: "target",
              label: "الجهة المستهدفة",
              type: "select",
              options: ["كل الموظفين", "الفرع الرئيسي", "فرع جدة", "فرع الدمام", "المشرفون"],
            },
            { key: "body", label: "نص الرسالة", type: "textarea" },
          ]}
        />
      </div>
    </AppShell>
  );
}
