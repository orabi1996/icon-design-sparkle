import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/hr/AppShell";
import { Breadcrumbs, Btn, DateInput, Field, Input, PageBanner, Select } from "@/components/hr/ui";

export const Route = createFileRoute("/surveys")({
  head: () => ({
    meta: [
      { title: "الاستبيانات و التعميم | شؤون الموظفين" },
      {
        name: "description",
        content: "إرسال الاستبيانات والتعميمات للموظفين مع تحديد السبب والرسالة وتاريخ الإرسال والإغلاق ونطاق الفروع والأقسام.",
      },
      { property: "og:title", content: "الاستبيانات و التعميم" },
      { property: "og:description", content: "إنشاء وإرسال تعميم أو استبيان لنطاق محدد من الموظفين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Surveys,
});

const opt = ["اختر ...."];
const reasons = ["اختر ....", "تعميم إداري", "استبيان رضا الموظفين", "تعميم إجازات", "استبيان تدريب"];
const branches = ["اختر ....", "شركة الحلول الخبيرة", "شركةالحلول٢"];
const depts = ["اختر ....", "management", "التطوير", "المالية"];
const levels = ["اختر ....", "سعودي تأمينات", "مقيم تأمينات", "أجير"];

function Surveys() {
  return (
    <AppShell>
      <div className="mt-4">
        <Breadcrumbs trail={["شئون الموظفين", "الاستبيانات و التعميم"]} />
        <PageBanner
          icon="campaign"
          title="الاستبيانات و التعميم"
          subtitle="إنشاء تعميم أو استبيان وإرساله لنطاق محدد من الموظفين"
        />

        <div
          className="mt-4 rounded-2xl border border-border bg-card p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="السبب" required>
              <Select options={reasons} />
            </Field>
            <Field label="رسالة" required>
              <Input placeholder="نص التعميم أو الاستبيان" />
            </Field>
            <Field label="تاريخ الارسال" required>
              <DateInput />
            </Field>
            <Field label="تاريخ الاغلاق">
              <DateInput />
            </Field>

            <Field label="الفرع">
              <Select options={branches} />
            </Field>
            <Field label="القسم">
              <Select options={depts} />
            </Field>
            <Field label="المستويات الوظيفية">
              <Select options={levels} />
            </Field>
            <Field label="القسم الرئيسي">
              <Select options={opt} />
            </Field>

            <Field label="المسار">
              <Select options={opt} />
            </Field>
            <Field label="القطاع">
              <Select options={opt} />
            </Field>
            <Field label="الموظفين">
              <Select options={opt} />
            </Field>
            <div className="flex items-end">
              <Btn icon="send" variant="teal">
                إرسال
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
