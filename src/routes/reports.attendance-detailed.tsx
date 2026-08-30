import { createFileRoute } from "@tanstack/react-router";
import { AttendanceReportPage } from "@/components/hr/AttendanceReportPage";

export const Route = createFileRoute("/reports/attendance-detailed")({
  head: () => ({
    meta: [
      { title: "تقرير الحضور والانصراف التفصيلي | نظام الموارد البشرية" },
      {
        name: "description",
        content: "تقرير يومي تفصيلي لأوقات حضور وانصراف الموظفين وحالات الدوام ودقائق التأخير.",
      },
      { property: "og:title", content: "تقرير الحضور والانصراف التفصيلي" },
      {
        property: "og:description",
        content: "تقرير يومي تفصيلي لأوقات حضور وانصراف الموظفين وحالات الدوام ودقائق التأخير.",
      },
    ],
  }),
  component: () => <AttendanceReportPage variant="detailed" />,
});
