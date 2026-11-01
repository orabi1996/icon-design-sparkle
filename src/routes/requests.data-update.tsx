import { createFileRoute } from "@tanstack/react-router";
import { DataUpdateCleanPage } from "@/routes/regulations.data-update";

export const Route = createFileRoute("/requests/data-update")({
  head: () => ({
    meta: [
      { title: "تحديث البيانات | الطلبات" },
      {
        name: "description",
        content:
          "إنشاء وإدارة طلبات تحديث البيانات المرسلة للموظفين (Public أو مخصصة) واعتماد ردود الموظفين.",
      },
    ],
  }),
  component: DataUpdateCleanPage,
});
