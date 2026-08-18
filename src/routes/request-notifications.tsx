import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, PageBanner } from "@/components/hr/ui";
import { CrudTable } from "@/components/hr/CrudTable";
import { useRows } from "@/lib/hr-db";

export const Route = createFileRoute("/request-notifications")({
  head: () => ({
    meta: [
      { title: "اشعارات الطلبات | متابعة طلبات الموظفين" },
      {
        name: "description",
        content: "متابعة طلبات الموظفين: السلف والأذونات والتعريف بالراتب والنقل مع الاعتماد والتعديل والحذف.",
      },
      { property: "og:title", content: "اشعارات الطلبات | متابعة طلبات الموظفين" },
      { property: "og:description", content: "إدارة طلبات الموظفين وحالتها من مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestNotifications,
});

function RequestNotifications() {
  const employees = useRows("employees", { orderBy: "emp_no", ascending: true }).data ?? [];
  const names = employees.map((e) => String(e["full_name"]));

  return (
    <AppShell>
      <div className="mt-4">
        <Breadcrumbs trail={["الطلبات", "اشعارات الطلبات"]} />
        <PageBanner icon="notifications_active" title="اشعارات الطلبات" subtitle="متابعة واعتماد طلبات الموظفين" />
        <CrudTable
          table="requests"
          title="طلبات الموظفين"
          addLabel="إضافة طلب"
          fields={[
            { key: "employee_name", label: "الموظف", type: "select", options: names, required: true },
            {
              key: "request_type",
              label: "نوع الطلب",
              type: "select",
              options: [
                "طلب سلفة",
                "طلب أجازة",
                "طلب إذن",
                "طلب تعريف بالراتب",
                "طلب تجديد إقامة",
                "طلب نقل",
                "طلب عمل إضافي",
                "طلب بدل انتداب",
                "طلب استقالة",
              ],
            },
            { key: "status", label: "الحالة", type: "select", options: ["جديد", "قيد المعالجة", "معتمد", "مرفوض"] },
            { key: "amount", label: "المبلغ", type: "number" },
            { key: "notes", label: "ملاحظات", type: "textarea" },
          ]}
        />
      </div>
    </AppShell>
  );
}
