import { createFileRoute } from "@tanstack/react-router";
import { AttendanceReportPage } from "@/components/hr/AttendanceReportPage";

export const Route = createFileRoute("/reports/daily-late")({
  head: () => ({
    meta: [
      { title: "تقرير التأخير اليومي | نظام الموارد البشرية" },
      {
        name: "description",
        content: "حصر يومي لحالات تأخير الموظفين ودقائق التأخير مع الفلاتر التنظيمية والوظيفية.",
      },
      { property: "og:title", content: "تقرير التأخير اليومي" },
      {
        property: "og:description",
        content: "حصر يومي لحالات تأخير الموظفين ودقائق التأخير مع الفلاتر التنظيمية والوظيفية.",
      },
    ],
  }),
  component: () => <AttendanceReportPage variant="daily-late" />,
});
