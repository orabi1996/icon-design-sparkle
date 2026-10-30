import { createFileRoute } from "@tanstack/react-router";
import { EmployeeProfileView } from "@/components/hr/employee-profile/EmployeeProfileView";

export const Route = createFileRoute("/staff/$employeeId")({
  validateSearch: (search: Record<string, unknown>): {
    tab?: "employee" | "financial" | "attendance";
  } => {
    const t = search?.["tab"];
    if (t === "employee" || t === "financial" || t === "attendance") {
      return { tab: t };
    }
    return {};
  },
  head: () => ({
    meta: [
      { title: "ملف الموظف | شؤون الموظفين" },
      {
        name: "description",
        content:
          "ملف الموظف الشامل: البيانات الأساسية، العقود، المستندات، التأمين الطبي، المرافقين، البيانات المالية، وبيانات الحضور والانصراف.",
      },
    ],
  }),
  component: EmployeeProfilePage,
});

function EmployeeProfilePage() {
  const { employeeId } = Route.useParams();
  const { tab } = Route.useSearch();
  return <EmployeeProfileView employeeId={employeeId} initialTab={tab} />;
}
