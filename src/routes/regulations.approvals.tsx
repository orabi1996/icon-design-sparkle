import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MaterialIcon } from "@/components/MaterialIcon";
import {
  Breadcrumbs,
  Btn,
  Card,
  DataTable,
  Field,
  Input,
  PageBanner,
  Pager,
  Select,
  TableToolbar,
} from "@/components/hr/ui";

export const Route = createFileRoute("/regulations/approvals")({
  head: () => ({
    meta: [
      { title: "تهيئة سلاسل الموافقات | اللوائح" },
      {
        name: "description",
        content:
          "إنشاء سلاسل الموافقات وتهيئة اللجان والمدى الوظيفي، وربط سلاسل الموافقات بأنواع الطلبات مثل الأذونات والمساءلات.",
      },
      { property: "og:title", content: "تهيئة سلاسل الموافقات | اللوائح" },
      {
        property: "og:description",
        content: "سلاسل الموافقات وربطها بأنواع الطلبات داخل نظام الموارد البشرية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Approvals;
});
