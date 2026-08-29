import { createFileRoute } from "@tanstack/react-router";
import { EmployeeWizard } from "@/components/hr/EmployeeWizard";

export const Route = createFileRoute("/staff/add")({
  head: () => ({
    meta: [
      { title: "إضافة موظف | شؤون الموظفين" },
      {
        name: "description",
        content:
          "معالج متكامل لإضافة موظف جديد وحفظ البيانات الشخصية والوظيفية وبيانات التواصل والبيانات المالية والعقود.",
      },
      { property: "og:title", content: "إضافة موظف | شؤون الموظفين" },
      {
        property: "og:description",
        content: "إضافة موظف جديد من خلال خمس مراحل مترابطة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeeWizard,
});
