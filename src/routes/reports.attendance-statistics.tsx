import { createFileRoute } from "@tanstack/react-router";
import { AttendanceReportPage } from "@/components/hr/AttendanceReportPage";

export const Route = createFileRoute("/reports/attendance-statistics")({
  head: () => ({
    meta: [
      { title: "تقرير إحصائي عن الحضور والانصراف | نظام الموارد البشرية" },
      {
        name: "description",
        content:
          "تقرير إحصائي مجمع للحضور والانصراف والغياب والتأخير حسب الموظف أو الفرع أو القسم.",
      },
      { property: "og:title", content: "تقرير إحصائي عن الحضور والانصراف" },
      {
        property: "og:description",
        content:
          "تقرير إحصائي مجمع للحضور والانصراف والغياب والتأخير حسب الموظف أو الفرع أو القسم.",
      },
    ],
  }),
  component: () => <AttendanceReportPage variant="statistics" />,
});
