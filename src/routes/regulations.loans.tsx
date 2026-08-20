import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";
import { useRows } from "@/lib/hr-db";

export const Route = createFileRoute("/regulations/loans")({
  head: () => ({
    meta: [
      { title: "تهيئة السلف | اللوائح المالية" },
      {
        name: "description",
        content:
          "إدارة سلف الموظفين: المبلغ وعدد الأقساط والقسط الشهري والمسدد وحالة السلفة مع الإضافة والتعديل والحذف.",
      },
      { property: "og:title", content: "تهيئة السلف | اللوائح المالية" },
      { property: "og:description", content: "متابعة سلف الموظفين وأقساطها وحالة السداد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Loans,
});

function Loans() {
  const employees = useRows("employees", { orderBy: "emp_no", ascending: true }).data ?? [];
  const names = employees.map((e) => String(e["full_name"]));

  return (
    <div className="mt-4">
      <Breadcrumbs trail={["اللوائح المالية", "تهيئة السلف"]} />
      <PageBanner
        icon="request_quote"
        title="السلف"
        subtitle="إضافة سلفة جديدة ومتابعة الأقساط والسداد"
      />
      <CrudTable
        table="loans"
        title="سلف الموظفين"
        addLabel="إضافة سلفة"
        fields={[
          { key: "employee_name", label: "الموظف", type: "select", options: names, required: true },
          { key: "amount", label: "مبلغ السلفة", type: "number" },
          { key: "installments", label: "عدد الأقساط", type: "number" },
          { key: "monthly_amount", label: "القسط الشهري", type: "number" },
          { key: "paid_amount", label: "المسدد", type: "number" },
          { key: "start_date", label: "تاريخ البداية", type: "date" },
          {
            key: "status",
            label: "الحالة",
            type: "select",
            options: ["بانتظار الموافقة", "قيد السداد", "مسددة", "مرفوضة"],
          },
          { key: "notes", label: "ملاحظات", type: "textarea" },
        ]}
      />
    </div>
  );
}
