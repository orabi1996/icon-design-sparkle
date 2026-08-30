import { createFileRoute } from "@tanstack/react-router";
import { AttendanceReportPage } from "@/components/hr/AttendanceReportPage";

export const Route = createFileRoute("/reports/attendance-comprehensive")({
  head: () => ({
    meta: [
      { title: "تقرير الحضور والإنصراف الشامل | نظام الموارد البشرية" },
      {
        name: "description",
        content: "تقرير شامل لبيانات الموظف التنظيمية والوظيفية مع الحضور والانصراف والبصمة.",
      },
      { property: "og:title", content: "تقرير الحضور والإنصراف الشامل" },
      {
        property: "og:description",
        content: "تقرير شامل لبيانات الموظف التنظيمية والوظيفية مع الحضور والانصراف والبصمة.",
      },
    ],
  }),
  component: () => <AttendanceReportPage variant="comprehensive" />,
});
