import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  Chip,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/deductions")({
  head: () => ({
    meta: [
      { title: "لائحة الإستقطاعات | اللوائح المالية" },
      {
        name: "description",
        content:
          "تهيئة لائحة الإستقطاعات: التأمينات الاجتماعية والخصومات الخاصة ونسب الاحتساب من الراتب والوظائف والجنسيات المشمولة.",
      },
      { property: "og:title", content: "لائحة الإستقطاعات | اللوائح المالية" },
      { property: "og:description", content: "إضافة وتعديل إستقطاعات الموظفين ونسب احتسابها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deductions;
});

function Deductions() {
  return null;
}
